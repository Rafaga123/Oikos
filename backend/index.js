// backend/index.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Importar Mailjet
const Mailjet = require('node-mailjet');

// Conectar con Mailjet
const mailjet = Mailjet.apiConnect(
    process.env.MJ_APIKEY_PUBLIC,
    process.env.MJ_APIKEY_PRIVATE
);

const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN_AQUI"

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado: Se requiere autenticación' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.usuario = user; // ¡Magia! Guardamos los datos del usuario en la petición
    next();
  });
};

async function inicializarRoles() {
  // Estos nombres deben coincidir EXACTAMENTE con tu enum RolNombre en schema.prisma
  const rolesNecesarios = ['ADMINISTRADOR', 'ENCARGADO_COMUNIDAD', 'HABITANTE'];
  
  console.log("Verificando roles en la base de datos...");

  
  for (const nombreRol of rolesNecesarios) {
    // Buscamos si el rol ya existe
    const existe = await prisma.rol.findUnique({
      where: { nombre: nombreRol } 
    });
    
    // Si no existe, lo creamos
    if (!existe) {
      await prisma.rol.create({ data: { nombre: nombreRol } });
      console.log(`Rol creado: ${nombreRol}`);
    }
  }
  console.log("Sistema de roles listo.");
}

// --- Password reset helpers (scope global) ---
function buildResetToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secreto_super_seguro', { expiresIn: '1h' });
}

async function enviarCorreo(destinatario, asunto, titulo, mensajeHTML) {
    try {
        const request = await mailjet.post("send", { 'version': 'v3.1' }).request({
            "Messages": [{
                "From": {
                    "Email": process.env.MJ_SENDER_EMAIL,
                    "Name": "Oikos - Gestión Residencial"
                },
                "To": [{ "Email": destinatario }],
                "Subject": asunto,
                "HTMLPart": `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #0d6efd;">${titulo}</h2>
                        <hr>
                        ${mensajeHTML}
                        <br>
                        <p style="font-size: 12px; color: #777;">Este es un mensaje automático de Oikos.</p>
                    </div>
                `
            }]
        });
        console.log(`📧 Correo enviado a ${destinatario}`);
        return true;
    } catch (error) {
        console.error("❌ Error enviando correo Mailjet:", error.statusCode);
        return false;
    }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './uploads';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Nombre único: id_usuario + fecha + extensión
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'perfil-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- ENDPOINTS ---

/**
 * REGISTRO DE USUARIO (Versión Completa Oikos)
 */
app.post('/api/registro', async (req, res) => {
  try {
    // 1. Recibir solo datos mínimos; el resto se completará en el primer login
    const { 
      cedula, email, password, 
      primer_nombre, segundo_nombre, 
      primer_apellido, segundo_apellido
    } = req.body;

    // 2. Validaciones
    if (!cedula || !email || !password || !primer_nombre || !primer_apellido) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // 3. Buscar rol
    const rolHabitante = await prisma.rol.findUnique({ where: { nombre: 'HABITANTE' } });
    if (!rolHabitante) return res.status(500).json({ error: 'Error: Rol HABITANTE no existe' });

    // 4. Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // 5. Crear usuario con datos mínimos; campos complementarios se llenarán después
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        cedula,
        email,
        password_hash,
        primer_nombre,
        segundo_nombre: segundo_nombre || null,
        primer_apellido,
        segundo_apellido: segundo_apellido || null,
        id_rol: rolHabitante.id,
        estado_solicitud: 'SIN_COMUNIDAD'
      }
    });

    console.log("Usuario registrado:", nuevoUsuario.email); // Borrar esto luego Log de confirmación
    
    await enviarCorreo(
    nuevoUsuario.email, 
    "¡Bienvenido a Oikos!", 
    `Hola, ${nuevoUsuario.primer_nombre}`,
    `<p>Gracias por registrarte en la plataforma.</p>
    <p>Ahora puedes unirte a tu comunidad usando el código de tu edificio o crear una nueva.</p>
    <a href="http://localhost/Proyectoquinto/Pages/login.html">Iniciar Sesión</a>` // cambiar luego
    );

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: { id: nuevoUsuario.id, email: nuevoUsuario.email }
    });

  } catch (error) {
    console.error("Error en registro:", error);
    if (error.code === 'P2002') {
      const target = error.meta?.target || "";
      if (target.includes('email')) return res.status(400).json({ error: 'El correo ya esta registrado en el sistema' });
      if (target.includes('cedula')) return res.status(400).json({ error: 'La cédula ya esta registrada en el sistema' });
    }
    res.status(500).json({ error: 'Error interno al registrar' });
  }
});

/**
 * OLVIDÉ CONTRASEÑA: Solicitar enlace de restablecimiento
 * - No revela si el correo existe (respuesta genérica)
 * - Envía correo con enlace al frontend para establecer nueva contraseña
 */
app.post('/api/password/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Correo requerido' });

    // 1. Buscar usuario (La variable se llama 'user')
    const user = await prisma.usuario.findUnique({ where: { email } });

    // 2. Solo si el usuario existe, procesamos (pero no decimos nada si no existe)
    if (user) {
      // Generar token (Usamos user.password_hash como secreto extra por seguridad)
      const secret = process.env.JWT_SECRET + user.password_hash;
      const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '15m' });

      // URL de frontend (¡Corregido: usamos user.id, no usuario.id!)
      const enlace = `http://localhost/Proyectoquinto/Pages/restablecer.html?id=${user.id}&token=${token}`;

      // Usar la función Mailjet (¡Corregido: usamos user.primer_nombre!)
      await enviarCorreo(
        email,
        "Recuperación de Contraseña",
        `Hola, ${user.primer_nombre}`,
        `<p>Has solicitado cambiar tu clave. Haz clic abajo:</p>
         <a href="${enlace}" style="background:#0d6efd;color:white;padding:10px;border-radius:5px;text-decoration:none;">Restablecer ahora</a>
         <p>Expira en 15 minutos.</p>`
      );
    } 
    // 3. Respuesta Genérica (Por seguridad siempre decimos lo mismo)
    res.json({ mensaje: 'Si el correo existe, se envió un enlace.' });

  } catch (error) {
    console.error('Error en forgot password:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * OLVIDÉ CONTRASEÑA: Aplicar nueva contraseña
 */
app.post('/api/password/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Datos incompletos' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro');
    } catch (e) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    if (payload.tipo !== 'RESET' || !payload.id) {
      return res.status(400).json({ error: 'Token inválido' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    await prisma.usuario.update({
      where: { id: payload.id },
      data: { password_hash }
    });

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error en reset password:', error);
    res.status(500).json({ error: 'Error interno al restablecer contraseña' });
  }
});

/**
 * INICIO DE SESIÓN (LOGIN)
 */
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, password } = req.body; // 'usuario' puede ser email o cédula

    if (!usuario || !password) {
      return res.status(400).json({ error: 'Credenciales requeridas' });
    }

    // 1. Buscar usuario por Email O Cédula
    let userFound = await prisma.usuario.findUnique({
      where: { email: usuario },
      include: { rol: true }
    });

    if (!userFound) {
      userFound = await prisma.usuario.findUnique({
        where: { cedula: usuario },
        include: { rol: true }
      });
    }

    if (!userFound) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // 2. Verificar contraseña
    const esCorrecto = await bcrypt.compare(password, userFound.password_hash);
    if (!esCorrecto) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // 3. Generar Token
    const token = jwt.sign(
      { 
        id: userFound.id, 
        rol: userFound.rol.nombre,
        estado: userFound.estado_solicitud 
      }, 
      process.env.JWT_SECRET || 'secreto_super_seguro', 
      { expiresIn: '1d' }
    );

    // 4. Responder
    res.json({
      mensaje: 'Bienvenido',
      token,
      usuario: {
        id: userFound.id,
        nombre: userFound.primer_nombre,
        apellido: userFound.primer_apellido,
        rol: userFound.rol.nombre,
        estado_solicitud: userFound.estado_solicitud,
        id_comunidad: userFound.id_comunidad
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
});

/**
 * 1. CREAR COMUNIDAD (Para el Encargado)
 * - Crea la comunidad
 * - Genera un código único automático
 * - Convierte al usuario creador en ENCARGADO_COMUNIDAD y lo acepta automáticamente
 */
app.post('/api/comunidades', verificarToken, async (req, res) => {
  try {
    const { nombre, direccion } = req.body;
    const idUsuario = req.usuario.id; // Obtenido del token gracias al middleware

    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

    // Generar código único simple (ej: "RES-8821")
    const aleatorio = Math.floor(1000 + Math.random() * 9000); 
    const codigo_unico = `${aleatorio}`;

    // Transacción: Hacemos todo o nada para asegurar integridad
    const resultado = await prisma.$transaction(async (tx) => {
      // A. Crear la comunidad
      const nuevaComunidad = await tx.comunidad.create({
        data: {
          nombre,
          direccion,
          codigo_unico
        }
      });

      // B. Buscar ID del rol Encargado
      const rolEncargado = await tx.rol.findUnique({ where: { nombre: 'ENCARGADO_COMUNIDAD' } });

      // C. Actualizar al usuario (Lo volvemos Jefe y lo unimos)
      const usuarioActualizado = await tx.usuario.update({
        where: { id: idUsuario },
        data: {
          id_comunidad: nuevaComunidad.id,
          id_rol: rolEncargado.id,
          estado_solicitud: 'ACEPTADO', // El jefe se acepta a sí mismo
          tipo_habitante: 'PROPIETARIO' // Asumimos que el jefe es propietario
        }
      });

      return { comunidad: nuevaComunidad, usuario: usuarioActualizado };
    });

    res.status(201).json({
      mensaje: 'Comunidad creada exitosamente',
      codigo: resultado.comunidad.codigo_unico,
      comunidad: resultado.comunidad
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la comunidad' });
  }
});

/**
 * 2. UNIRSE A COMUNIDAD (Para el Habitante)
 * - Busca la comunidad por código
 * - Asigna al usuario a esa comunidad
 * - Lo deja en estado PENDIENTE para que el jefe lo apruebe
 */
app.post('/api/comunidades/unirse', verificarToken, async (req, res) => {
  try {
    const { codigo, numero_casa, tipo_habitante } = req.body;
    const idUsuario = req.usuario.id;
    const nombreSolicitante = req.usuario.email; // O busca el nombre completo si prefieres

    // 1. Buscar Comunidad
    const comunidad = await prisma.comunidad.findUnique({ where: { codigo_unico: codigo } });
    if (!comunidad) return res.status(404).json({ error: 'Código inválido' });

    // 2. Actualizar Usuario (Solicitud Pendiente)
    await prisma.usuario.update({
      where: { id: idUsuario },
      data: {
        id_comunidad: comunidad.id,
        estado_solicitud: 'PENDIENTE',
        numero_casa,
        tipo_habitante
      }
    });

    // 3. --- NOTIFICACIÓN AL GESTOR ---
    // Buscamos quién es el encargado de esta comunidad
    const encargado = await prisma.usuario.findFirst({
        where: {
            id_comunidad: comunidad.id,
            rol: { nombre: 'ENCARGADO_COMUNIDAD' }
        }
    });

    if (encargado) {
        await enviarCorreo(
            encargado.email,
            "Nueva Solicitud de Ingreso - Oikos",
            "Un vecino quiere unirse",
            `<p>El usuario <strong>${nombreSolicitante}</strong> (Casa: ${numero_casa}) ha solicitado unirse a "${comunidad.nombre}".</p>
             <p>Por favor, ingresa a tu panel para Aceptar o Rechazar la solicitud.</p>`
        );
    }

    res.json({ mensaje: 'Solicitud enviada y notificada al encargado.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al unirse' });
  }
});

/**
 * REGISTRAR UN PAGO
 */
app.post('/api/pagos', verificarToken, async (req, res) => {
  try {
    const { monto, concepto, referencia } = req.body;
    const idUsuario = req.usuario.id;

    const nuevoPago = await prisma.pago.create({
      data: {
        monto,
        concepto,
        referencia,
        estado: 'PENDIENTE',
        id_usuario: idUsuario
        // nota: comprobante_url lo manejaremos luego con subida de archivos
      }
    });

    res.status(201).json(nuevoPago);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar el pago' });
  }
});

/**
 * VER EL MURO (ANUNCIOS) DE MI COMUNIDAD
 * Solo muestra anuncios de la comunidad a la que pertenezco
 */
app.get('/api/anuncios', verificarToken, async (req, res) => {
  try {
    // 1. Averiguar de qué comunidad es el usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id }
    });

    if (!usuario.id_comunidad) {
      return res.status(400).json({ error: 'No perteneces a ninguna comunidad' });
    }

    // 2. Buscar anuncios de la comunidad actual
    const anuncios = await prisma.anuncio.findMany({
      where: { id_comunidad: usuario.id_comunidad },
      orderBy: { fecha_public: 'desc' }, // Los más nuevos primero
      include: { autor: { select: { primer_nombre: true, primer_apellido: true } } } // Mostrar quién escribió
    });

    res.json(anuncios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener anuncios' });
  }
});

app.post('/api/incidencias', verificarToken, async (req, res) => {
    try {
        const { titulo, descripcion, foto_url } = req.body;
        const idUsuario = req.usuario.id;

        // 1. Obtener datos del usuario para saber su comunidad
        const usuario = await prisma.usuario.findUnique({ 
            where: { id: idUsuario },
            include: { comunidad: true }
        });

        if (!usuario.id_comunidad) return res.status(400).json({ error: 'No tienes comunidad' });

        // 2. Crear la incidencia
        const nuevaIncidencia = await prisma.incidencia.create({
            data: {
                titulo,
                descripcion,
                foto_url,
                id_usuario: idUsuario,
                estado: 'ABIERTO' // Default del Enum
            }
        });

        // 3. --- NOTIFICACIÓN AL GESTOR ---
        const encargado = await prisma.usuario.findFirst({
            where: {
                id_comunidad: usuario.id_comunidad,
                rol: { nombre: 'ENCARGADO_COMUNIDAD' }
            }
        });

        if (encargado) {
            await enviarCorreo(
                encargado.email,
                `Nuevo Reporte: ${titulo}`,
                "Se ha reportado una incidencia",
                `<p><strong>Vecino:</strong> ${usuario.primer_nombre} ${usuario.primer_apellido}</p>
                <p><strong>Problema:</strong> ${descripcion}</p>
                <p>Revisa el panel de incidencias para gestionarlo.</p>`
            );
        }

        res.status(201).json(nuevaIncidencia);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear reporte' });
    }
});

// --- ENDPOINTS DE PERFIL ---

/**
 * 1. OBTENER DATOS COMPLETOS DEL PERFIL
 * Trae usuario, comunidad y pagos recientes
 */
app.get('/api/perfil', verificarToken, async (req, res) => {
    try {
        const idUsuario = req.usuario.id;

        const usuario = await prisma.usuario.findUnique({
            where: { id: idUsuario },
            include: {
                comunidad: true, // Traer datos de su edificio
                pagos: {         // Traer sus últimos 5 pagos
                    take: 5,
                    orderBy: { fecha_pago: 'desc' }
                }
            }
        });

        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        // Ocultar contraseña antes de enviar
        const { password_hash, ...datosSeguros } = usuario;
        res.json(datosSeguros);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al cargar perfil' });
    }
});

/**
 * 2. SUBIR FOTO DE PERFIL
 */
app.post('/api/perfil/foto', verificarToken, upload.single('foto'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No se subió ninguna imagen' });

        const idUsuario = req.usuario.id;
        // Construir la URL de la imagen (ajusta el puerto si es necesario)
        const fotoUrl = `http://localhost:3000/uploads/${req.file.filename}`;

        // Actualizar BD
        await prisma.usuario.update({
            where: { id: idUsuario },
            data: { foto_perfil_url: fotoUrl }
        });

        res.json({ mensaje: 'Foto actualizada', url: fotoUrl });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al subir la foto' });
    }
});

// --- ENDPOINTS DEL FORO ---

/**
 * 1. OBTENER POSTS (Solo de mi comunidad)
 */
app.get('/api/foro', verificarToken, async (req, res) => {
    try {
        const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });
        
        if (!usuario.id_comunidad) {
            return res.status(403).json({ error: 'Debes pertenecer a una comunidad para ver el foro.' });
        }

        const posts = await prisma.post.findMany({
            where: { id_comunidad: usuario.id_comunidad },
            include: {
                usuario: { select: { primer_nombre: true, foto_perfil_url: true } }, // Datos del autor
                likes: { where: { id_usuario: req.usuario.id } } // Para saber si YO le di like
            },
            orderBy: { fecha_creacion: 'asc' } // Traemos los viejos primero para meterlos a la Pila
        });

        // Formateamos para el frontend
        const postsFormateados = posts.map(p => ({
            ...p,
            dio_like: p.likes.length > 0 // True si le di like
        }));

        res.json(postsFormateados);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error obteniendo posts' });
    }
});

/**
 * 2. CREAR POST
 */
app.post('/api/foro', verificarToken, async (req, res) => {
    try {
        const { titulo, contenido } = req.body;
        const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });

        if (!usuario.id_comunidad) {
            return res.status(403).json({ error: 'No tienes comunidad asignada.' });
        }

        const nuevoPost = await prisma.post.create({
            data: {
                titulo,
                contenido,
                id_usuario: usuario.id,
                id_comunidad: usuario.id_comunidad
            },
            include: { // Devolvemos datos del autor para mostrarlo al instante
                usuario: { select: { primer_nombre: true, foto_perfil_url: true } }
            }
        });

        res.status(201).json(nuevoPost);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al publicar' });
    }
});

/**
 * 3. DAR / QUITAR LIKE
 */
app.post('/api/foro/:id/like', verificarToken, async (req, res) => {
    try {
        const idPost = parseInt(req.params.id);
        const idUsuario = req.usuario.id;

        // Verificar si ya existe el like
        const existeLike = await prisma.like.findUnique({
            where: { id_usuario_id_post: { id_usuario: idUsuario, id_post: idPost } }
        });

        if (existeLike) {
            // QUITAR LIKE (Dislike)
            await prisma.like.delete({
                where: { id_usuario_id_post: { id_usuario: idUsuario, id_post: idPost } }
            });
            await prisma.post.update({
                where: { id: idPost },
                data: { cantidad_likes: { decrement: 1 } }
            });
            res.json({ dio_like: false });
        } else {
            // DAR LIKE
            await prisma.like.create({
                data: { id_usuario: idUsuario, id_post: idPost }
            });
            await prisma.post.update({
                where: { id: idPost },
                data: { cantidad_likes: { increment: 1 } }
            });
            res.json({ dio_like: true });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en like' });
    }
});

// Iniciar servidor
app.listen(port, async () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  await inicializarRoles(); // <--- IMPORTANTE: Esto crea los roles
});