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
      primer_apellido, segundo_apellido,
      fecha_nacimiento, telefono
    } = req.body;

    const telefonoNormalizado = typeof telefono === 'string' ? telefono.replace(/[\s-]/g, '') : '';
    const fechaNacimientoDate = fecha_nacimiento ? new Date(fecha_nacimiento) : null;

    // 2. Validaciones
    if (!cedula || !email || !password || !primer_nombre || !primer_apellido || !fechaNacimientoDate || !telefonoNormalizado) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    if (Number.isNaN(fechaNacimientoDate.getTime()) || fechaNacimientoDate > new Date()) {
      return res.status(400).json({ error: 'Fecha de nacimiento no válida' });
    }
    if (!/^\+\d{8,15}$/.test(telefonoNormalizado)) {
      return res.status(400).json({ error: 'Teléfono no válido. Debe iniciar con + y tener entre 8 y 15 dígitos.' });
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
        fecha_nacimiento: fechaNacimientoDate,
        telefono: telefonoNormalizado,
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
      orderBy: { fecha_publicacion: "desc", }, // Los más nuevos primero
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
        const { titulo, descripcion, categoria, importancia, foto_url } = req.body;
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
                categoria,     
                importancia,   
                foto_url,
                id_usuario: idUsuario,
                estado: 'ABIERTO'
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

// ----- ENDPOINTS ACEPTAR HABITANTE NUEVO A LA COMUNIDAD ----

/**
 * 1. OBTENER SOLICITUDES PENDIENTES (Solo para el Gestor)
 */
app.get('/api/gestor/solicitudes', verificarToken, async (req, res) => {
    try {
        const idGestor = req.usuario.id;

        // 1. Averiguar la comunidad del gestor
        const gestor = await prisma.usuario.findUnique({ where: { id: idGestor } });
        
        if (!gestor.id_comunidad) {
            return res.status(403).json({ error: 'No gestionas ninguna comunidad.' });
        }

        // 2. Buscar usuarios PENDIENTES de esa comunidad
        // Filtramos para que no se traiga a sí mismo ni a otros aprobados
        const solicitudes = await prisma.usuario.findMany({
            where: {
                id_comunidad: gestor.id_comunidad,
                estado_solicitud: { in: ['PENDIENTE', 'RECHAZADO', 'ACEPTADO'] }, // Traemos historial también si quieres
                rol: { nombre: 'HABITANTE' } // Solo habitantes normales
            },
            select: {
                id: true,
                primer_nombre: true,
                primer_apellido: true,
                email: true,
                telefono: true,
                numero_casa: true,     // Casa solicitada
                tipo_habitante: true,  // Propietario/Inquilino
                estado_solicitud: true,
                fecha_registro: true,
                foto_perfil_url: true
            },
            orderBy: { fecha_registro: 'desc' }
        });

        res.json(solicitudes);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al cargar solicitudes' });
    }
});

/**
 * 2. APROBAR O RECHAZAR SOLICITUD
 */
app.post('/api/gestor/responder-solicitud', verificarToken, async (req, res) => {
    try {
        const { idUsuario, accion, motivo } = req.body; // accion: 'APROBAR' o 'RECHAZAR'
        const idGestor = req.usuario.id;

        // Validaciones básicas
        if (!['APROBAR', 'RECHAZAR'].includes(accion)) {
            return res.status(400).json({ error: 'Acción no válida' });
        }

        // Actualizar el estado del usuario
        const nuevoEstado = accion === 'APROBAR' ? 'ACEPTADO' : 'RECHAZADO';
        
        // Si es RECHAZADO, podrías querer borrarle el id_comunidad para que pueda pedir otra vez
        // Pero por ahora solo cambiamos el estado para mantener el registro.

        const usuarioActualizado = await prisma.usuario.update({
            where: { id: parseInt(idUsuario) },
            data: { 
                estado_solicitud: nuevoEstado,
                // Si rechazamos, guardamos el motivo en algún log o enviamos correo (opcional)
            }
        });

        // NOTIFICAR POR CORREO (Usando la función que creamos antes)
        const asunto = accion === 'APROBAR' ? '¡Bienvenido a la Comunidad!' : 'Solicitud Rechazada';
        const mensaje = accion === 'APROBAR' 
            ? `<p>Felicidades, has sido aceptado en la comunidad. Ya puedes iniciar sesión y acceder a todos los servicios.</p>`
            : `<p>Tu solicitud ha sido rechazada por el gestor.</p><p><strong>Motivo:</strong> ${motivo || 'No especificado'}</p>`;

        await enviarCorreo(
            usuarioActualizado.email,
            asunto,
            `Respuesta a tu solicitud`,
            mensaje
        );

        res.json({ mensaje: `Solicitud ${accion === 'APROBAR' ? 'aprobada' : 'rechazada'} correctamente` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar solicitud' });
    }
});

// --- GESTIÓN DE HABITANTES (PANEL DEL ENCARGADO) ---

/**
 * 1. LISTAR TODOS LOS HABITANTES (De mi comunidad)
 */
app.get('/api/gestor/habitantes', verificarToken, async (req, res) => {
    try {
        const idGestor = req.usuario.id;
        // Obtener comunidad del gestor
        const gestor = await prisma.usuario.findUnique({ where: { id: idGestor } });
        
        if (!gestor.id_comunidad) return res.status(403).json({ error: 'No tienes comunidad.' });

        // Traer todos los usuarios de esa comunidad (menos al gestor mismo si quieres)
        const habitantes = await prisma.usuario.findMany({
            where: { id_comunidad: gestor.id_comunidad },
            include: {
                rol: true,
                pagos: {
                    orderBy: { fecha_pago: 'desc' },
                    take: 5
                }
            }
        });

        res.json(habitantes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al listar habitantes' });
    }
});

/**
 * 2. EDITAR HABITANTE
 */
app.put('/api/gestor/habitante/:id', verificarToken, async (req, res) => {
    try {
        const idHabitante = parseInt(req.params.id);
        const { nombre, apellido, cedula, correo, estado_solicitud } = req.body; // 'estado' en el frontend es 'estado_solicitud' en BD?
        
        await prisma.usuario.update({
            where: { id: idHabitante },
            data: {
                primer_nombre: nombre,
                primer_apellido: apellido,
                // cedula: cedula,  <--- ELIMINADO (No se debe editar)
                // email: correo,   <--- ELIMINADO (No se debe editar)
                estado_solicitud: estado_solicitud === 'activo' ? 'ACEPTADO' : 'RECHAZADO'
            }
        });
// ...

        res.json({ mensaje: 'Habitante actualizado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar habitante' });
    }
});

/**
 * 3. AGREGAR PAGO (Manualmente por el Gestor)
 */
app.post('/api/gestor/pagos', verificarToken, async (req, res) => {
    try {
        const { id_usuario, monto, fecha, metodo, banco, estatus } = req.body;
        
        // Crear el pago
        await prisma.pago.create({
            data: {
                id_usuario: parseInt(id_usuario),
                monto: parseFloat(monto),
                fecha_pago: new Date(fecha),
                concepto: `Pago registrado por Gestor (${metodo})`,
                referencia: banco || 'Efectivo',
                estado: estatus === 'validado' ? 'APROBADO' : (estatus === 'rechazado' ? 'RECHAZADO' : 'PENDIENTE')
            }
        });

        res.json({ mensaje: 'Pago registrado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar pago' });
    }
});

/**
 * 4. PROMOVER A GESTOR (Dar permisos)
 */
app.post('/api/gestor/promover/:id', verificarToken, async (req, res) => {
    try {
        const idUsuario = parseInt(req.params.id);
        
        // Buscar el rol de ENCARGADO
        const rolEncargado = await prisma.rol.findUnique({ where: { nombre: 'ENCARGADO_COMUNIDAD' } });
        
        await prisma.usuario.update({
            where: { id: idUsuario },
            data: { id_rol: rolEncargado.id }
        });

        res.json({ mensaje: 'Usuario promovido a Encargado correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al promover usuario' });
    }
});

// --- GESTIÓN DE INCIDENCIAS (Quejas y Solicitudes) ---

/**
 * 1. LISTAR INCIDENCIAS (Del edificio del gestor)
 */
app.get('/api/gestor/incidencias', verificarToken, async (req, res) => {
    try {
        const idGestor = req.usuario.id;
        const gestor = await prisma.usuario.findUnique({ where: { id: idGestor } });

        if (!gestor.id_comunidad) return res.status(403).json({ error: 'No tienes comunidad.' });

        // Buscar usuarios de la comunidad para filtrar sus incidencias
        // O mejor: buscar incidencias donde el usuario autor pertenezca a la comunidad
        const incidencias = await prisma.incidencia.findMany({
            where: {
                usuario: {
                    id_comunidad: gestor.id_comunidad
                }
            },
            include: {
                usuario: {
                    select: {
                        primer_nombre: true,
                        primer_apellido: true,
                        numero_casa: true
                    }
                }
            },
            orderBy: { fecha_reporte: 'desc' }
        });

        res.json(incidencias);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al cargar incidencias' });
    }
});

/**
 * 2. CAMBIAR ESTADO DE INCIDENCIA
 */
app.put('/api/gestor/incidencias/:id', verificarToken, async (req, res) => {
    try {
        const idIncidencia = parseInt(req.params.id);
        const { estado } = req.body; // ABIERTO, EN_PROGRESO, RESUELTO, CERRADO

        // Validar que el estado sea uno de los permitidos en el ENUM de Prisma
        const estadosValidos = ['ABIERTO', 'EN_PROGRESO', 'RESUELTO', 'CERRADO'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ error: 'Estado no válido' });
        }

        const incidenciaActualizada = await prisma.incidencia.update({
            where: { id: idIncidencia },
            data: { estado: estado }
        });

        res.json({ mensaje: 'Estado actualizado', incidencia: incidenciaActualizada });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar incidencia' });
    }
});

/**
 * 3. MARCAR TODO COMO REVISADO (En realidad, pasar de ABIERTO a EN_PROGRESO)
 */
app.post('/api/gestor/incidencias/revisar-todo', verificarToken, async (req, res) => {
    try {
        const idGestor = req.usuario.id;
        const gestor = await prisma.usuario.findUnique({ where: { id: idGestor } });

        // Actualizar masivamente todas las incidencias ABIERTAS de esa comunidad a EN_PROGRESO
        const resultado = await prisma.incidencia.updateMany({
            where: {
                estado: 'ABIERTO',
                usuario: { id_comunidad: gestor.id_comunidad }
            },
            data: { estado: 'EN_PROGRESO' }
        });

        res.json({ mensaje: `Se marcaron ${resultado.count} solicitudes como revisadas.` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error masivo' });
    }
});

/**
 * 4. OBTENER MIS REPORTES (Para el Habitante)
 */
app.get('/api/incidencias/mis-reportes', verificarToken, async (req, res) => {
    try {
        const idUsuario = req.usuario.id;

        const misReportes = await prisma.incidencia.findMany({
            where: { id_usuario: idUsuario },
            orderBy: { fecha_reporte: 'desc' }
        });

        res.json(misReportes);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al cargar tus reportes' });
    }
});

// --- GESTIÓN DE CONTENIDO (ANUNCIOS Y ENCUESTAS) ---

/**
 * 1. CREAR ANUNCIO
 */
app.post('/api/gestor/anuncios', verificarToken, async (req, res) => {
    try {
        const { titulo, contenido, categoria, fecha_expiracion, prioridad } = req.body;
        const idGestor = req.usuario.id;

        // Verificar comunidad
        const gestor = await prisma.usuario.findUnique({ where: { id: idGestor } });
        if (!gestor.id_comunidad) return res.status(403).json({ error: 'No tienes comunidad.' });

        const nuevoAnuncio = await prisma.anuncio.create({
            data: {
                titulo,
                contenido,
                categoria,
                prioridad: prioridad || false,
                fecha_expiracion: fecha_expiracion ? new Date(fecha_expiracion) : null,
                id_comunidad: gestor.id_comunidad,
                id_autor: idGestor
            }
        });

        res.status(201).json({ mensaje: 'Anuncio publicado', anuncio: nuevoAnuncio });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear anuncio' });
    }
});

/**
 * 2. CREAR ENCUESTA (CORREGIDO)
 */
app.post('/api/gestor/encuestas', verificarToken, async (req, res) => {
    try {
        const { titulo, descripcion, fecha_fin, tipo_voto, opciones } = req.body;
        const idGestor = req.usuario.id;

        const gestor = await prisma.usuario.findUnique({ where: { id: idGestor } });
        if (!gestor.id_comunidad) return res.status(403).json({ error: 'No tienes comunidad.' });

        // --- VALIDACIÓN DE FECHA (NUEVO) ---
        if (!fecha_fin) {
            return res.status(400).json({ error: 'Debes seleccionar una fecha de cierre.' });
        }

        const fechaCierre = new Date(fecha_fin);

        // Verificar si la fecha es válida matemáticamente
        if (isNaN(fechaCierre.getTime())) {
            return res.status(400).json({ error: 'La fecha de cierre no es válida.' });
        }
        // -----------------------------------

        // Crear encuesta
        const nuevaEncuesta = await prisma.encuesta.create({
            data: {
                titulo,
                descripcion,
                fecha_fin: fechaCierre, // Usamos la fecha ya validada
                tipo_voto,
                id_comunidad: gestor.id_comunidad,
                opciones: {
                    create: opciones.map(txt => ({ texto: txt }))
                }
            }
        });

        res.status(201).json({ mensaje: 'Encuesta creada', encuesta: nuevaEncuesta });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear encuesta: ' + error.message });
    }
});

/**
 * OBTENER ANUNCIOS (Para el Habitante - Home Page)
 */
app.get('/api/anuncios', verificarToken, async (req, res) => {
    try {
        const idUsuario = req.usuario.id;

        // 1. Obtener comunidad del usuario
        const usuario = await prisma.usuario.findUnique({ where: { id: idUsuario } });
        
        if (!usuario.id_comunidad) {
            return res.json([]); // Si no tiene comunidad, devuelve lista vacía
        }

        // 2. Buscar anuncios válidos
        const anuncios = await prisma.anuncio.findMany({
            where: {
                id_comunidad: usuario.id_comunidad,
                // Que no tenga fecha de expiración O que la fecha sea futura
                OR: [
                    { fecha_expiracion: null },
                    { fecha_expiracion: { gte: new Date() } }
                ]
            },
            orderBy: [
                { prioridad: 'desc' },       // Primero los urgentes
                { fecha_publicacion: 'desc' } // Luego los más nuevos
            ],
            take: 5 // Límite de 5 anuncios para el carrusel
        });

        res.json(anuncios);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al cargar anuncios' });
    }
});

// --- ENCUESTAS PARA EL HABITANTE ---

/**
 * 1. LISTAR ENCUESTAS ACTIVAS
 */
app.get('/api/encuestas', verificarToken, async (req, res) => {
    try {
        const idUsuario = req.usuario.id;
        const usuario = await prisma.usuario.findUnique({ where: { id: idUsuario } });

        if (!usuario.id_comunidad) return res.json([]);

        const encuestas = await prisma.encuesta.findMany({
            where: {
                id_comunidad: usuario.id_comunidad,
                fecha_fin: { gte: new Date() } // Solo futuras
            },
            include: {
                _count: { select: { votos: true } } // Contar cuántos han votado
            }
        });

        // Marcar si el usuario YA votó en alguna
        const misVotos = await prisma.votoEncuesta.findMany({
            where: { 
                id_usuario: idUsuario,
                id_encuesta: { in: encuestas.map(e => e.id) }
            }
        });

        const resultado = encuestas.map(e => ({
            ...e,
            yaVote: misVotos.some(v => v.id_encuesta === e.id),
            totalVotos: e._count.votos
        }));

        res.json(resultado);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error cargando encuestas' });
    }
});

/**
 * 2. OBTENER DETALLE DE UNA ENCUESTA (Para responderla)
 */
app.get('/api/encuestas/:id', verificarToken, async (req, res) => {
    try {
        const idEncuesta = parseInt(req.params.id);
        const encuesta = await prisma.encuesta.findUnique({
            where: { id: idEncuesta },
            include: { opciones: true }
        });
        res.json(encuesta);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error cargando encuesta' });
    }
});

/**
 * 3. VOTAR
 */
app.post('/api/encuestas/:id/votar', verificarToken, async (req, res) => {
    try {
        const idEncuesta = parseInt(req.params.id);
        const idUsuario = req.usuario.id;
        const { idOpcion } = req.body; // Recibimos el ID de la opción elegida

        // Verificar si ya votó (doble seguridad)
        const votoExistente = await prisma.votoEncuesta.findUnique({
            where: {
                id_usuario_id_encuesta: { id_usuario: idUsuario, id_encuesta: idEncuesta }
            }
        });

        if (votoExistente) return res.status(400).json({ error: 'Ya votaste en esta encuesta.' });

        await prisma.votoEncuesta.create({
            data: {
                id_usuario: idUsuario,
                id_encuesta: idEncuesta,
                id_opcion: parseInt(idOpcion)
            }
        });

        res.json({ mensaje: 'Voto registrado' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al votar' });
    }
});

// Iniciar servidor
app.listen(port, async () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  await inicializarRoles(); // <--- IMPORTANTE: Esto crea los roles
});