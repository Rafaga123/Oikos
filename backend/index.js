// backend/index.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');

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

// Configuración de Nodemailer (Gmail SMTP)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER, // <--- Lee del archivo .env
    pass: process.env.EMAIL_PASS  // <--- Lee del archivo .env
  },
  logger: true,
  debug: true
});

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

    // Buscar usuario;
    const user = await prisma.usuario.findUnique({ where: { email } });

    // Generar token solo si el usuario existe
    let previewUrl = null;
    let resetUrl = null;
    if (user) {
      const token = buildResetToken({ id: user.id, tipo: 'RESET' });

      // URL de frontend 
      resetUrl = `http://localhost/proyectoquinto/Pages/restablecer.html?token=${encodeURIComponent(token)}`;

      const info = await transporter.sendMail({
        from: `"Soporte Oikos" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Restablecer contraseña',
        text: `Para restablecer tu contraseña, visita: ${resetUrl}\nEste enlace expira en 1 hora.`,
        html: `<p>Para restablecer tu contraseña, haz clic en el siguiente enlace:</p>
              <p><a href="${resetUrl}">Restablecer contraseña</a></p>
              <p>El enlace expira en 1 hora.</p>`
      });
      console.log('Password reset email enviado:', { messageId: info.messageId, response: info.response, resetUrl });
      if (nodemailer.getTestMessageUrl) {
        previewUrl = nodemailer.getTestMessageUrl(info);
      }
    }

    // Respuesta genérica
    res.json({ mensaje: 'Si el correo existe, se envió un enlace.', resetUrl, previewUrl });
  } catch (error) {
    console.error('Error en forgot password:', error);
    res.status(200).json({ mensaje: 'Si el correo existe, se envió un enlace.' });
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
    const codigo_unico = `RES-${aleatorio}`;

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
    const { codigo, tipo_habitante, numero_casa } = req.body;
    const idUsuario = req.usuario.id;

    if (!codigo) return res.status(400).json({ error: 'El código es obligatorio' });

    // A. Buscar la comunidad
    const comunidad = await prisma.comunidad.findUnique({
      where: { codigo_unico: codigo }
    });

    if (!comunidad) {
      return res.status(404).json({ error: 'No existe ninguna comunidad con ese código' });
    }

    // B. Actualizar usuario
    await prisma.usuario.update({
      where: { id: idUsuario },
      data: {
        id_comunidad: comunidad.id,
        estado_solicitud: 'PENDIENTE', // Queda esperando aprobación
        tipo_habitante: tipo_habitante || 'OTRO',
        numero_casa: numero_casa
      }
    });

    res.json({ mensaje: 'Solicitud enviada. Espera a que el encargado te acepte.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al unirse a la comunidad' });
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

// Iniciar servidor
app.listen(port, async () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  await inicializarRoles(); // <--- IMPORTANTE: Esto crea los roles
  transporter.verify((error, success) => {
    if (error) {
      console.error('SMTP no disponible para enviar correos:', error);
    } else {
      console.log('SMTP listo para enviar correos');
    }
  });
});