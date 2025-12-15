// backend/index.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// --- FUNCIÓN DE INICIALIZACIÓN (Se ejecuta al iniciar el servidor) ---
async function inicializarRoles() {
  // Estos nombres deben coincidir EXACTAMENTE con tu enum RolNombre en schema.prisma
  const rolesNecesarios = ['ADMINISTRADOR', 'ENCARGADO_COMUNIDAD', 'HABITANTE'];
  
  console.log("🔄 Verificando roles en la base de datos...");
  
  for (const nombreRol of rolesNecesarios) {
    // Buscamos si el rol ya existe
    const existe = await prisma.rol.findUnique({
      where: { nombre: nombreRol } 
    });
    
    // Si no existe, lo creamos
    if (!existe) {
      await prisma.rol.create({ data: { nombre: nombreRol } });
      console.log(`✅ Rol creado: ${nombreRol}`);
    }
  }
  console.log("✨ Sistema de roles listo.");
}

// --- ENDPOINTS ---

/**
 * REGISTRO DE USUARIO
 */
app.post('/api/registro', async (req, res) => {
  try {
    const { 
      cedula, email, password, 
      primer_nombre, segundo_nombre, 
      primer_apellido, segundo_apellido, 
      fecha_nacimiento,
      telefono,
      numero_casa,
      tipo_habitante,
      foto_perfil_url
    } = req.body;

    // 1. Validaciones básicas
    if (!cedula || !email || !password || !primer_nombre || !primer_apellido) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // 1.1 Validaciones adicionales opcionales
    if (telefono && !/^\+?\d{7,15}$/.test(telefono)) {
      return res.status(400).json({ error: 'Teléfono no válido' });
    }
    if (numero_casa && !/^[A-Za-z0-9-]{1,10}$/.test(numero_casa)) {
      return res.status(400).json({ error: 'Número de casa no válido' });
    }
    if (tipo_habitante && !['PROPIETARIO','INQUILINO','FAMILIAR','OTRO'].includes(tipo_habitante)) {
      return res.status(400).json({ error: 'Tipo de habitante no válido' });
    }

    // 2. Buscar el ID del rol "HABITANTE"
    const rolHabitante = await prisma.rol.findUnique({
      where: { nombre: 'HABITANTE' }
    });

    if (!rolHabitante) {
      return res.status(500).json({ error: 'Error del sistema: El rol HABITANTE no existe.' });
    }

    // 3. Encriptar contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // 4. Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        cedula,
        email,
        password_hash,
        primer_nombre,
        segundo_nombre: segundo_nombre || null,
        primer_apellido,
        segundo_apellido: segundo_apellido || null,
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
        telefono: telefono || null,
        numero_casa: numero_casa || null,
        tipo_habitante: tipo_habitante || null,
        foto_perfil_url: foto_perfil_url || null,
        id_rol: rolHabitante.id,
        estado_solicitud: 'SIN_COMUNIDAD' // Valor por defecto del Enum
      }
    });

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: { id: nuevoUsuario.id, email: nuevoUsuario.email }
    });

  } catch (error) {
    console.error("Error en registro:", error);
    
    if (error.code === 'P2002') {
      const target = error.meta?.target || "";
      if (target.includes('email')) return res.status(400).json({ error: 'El correo ya está registrado' });
      if (target.includes('cedula')) return res.status(400).json({ error: 'La cédula ya está registrada' });
    }
    
    res.status(500).json({ error: 'Error interno al registrar usuario' });
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
 * CREAR COMUNIDAD
 */
app.post('/api/comunidades', async (req, res) => {
  try {
    const { nombre, codigo_unico, direccion } = req.body;

    if (!nombre || !codigo_unico) {
      return res.status(400).json({ error: 'Nombre y código único son obligatorios' });
    }

    const nuevaComunidad = await prisma.comunidad.create({
      data: {
        nombre,
        codigo_unico,
        direccion: direccion || null
      }
    });

    res.status(201).json({ mensaje: 'Comunidad creada', comunidad: nuevaComunidad });
  } catch (error) {
    console.error('Error al crear comunidad:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El código único ya está en uso' });
    }
    res.status(500).json({ error: 'Error interno al crear comunidad' });
  }
});

/**
 * UNIRSE A UNA COMUNIDAD
 */
app.post('/api/comunidades/unirse', async (req, res) => {
  try {
    const { cedula, codigo_unico } = req.body;

    if (!cedula || !codigo_unico) {
      return res.status(400).json({ error: 'Cédula y código de comunidad son obligatorios' });
    }

    const usuario = await prisma.usuario.findUnique({ where: { cedula } });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (usuario.id_comunidad) {
      return res.status(400).json({ error: 'El usuario ya pertenece a una comunidad' });
    }

    const comunidad = await prisma.comunidad.findUnique({ where: { codigo_unico } });
    if (!comunidad) {
      return res.status(404).json({ error: 'Código de comunidad no válido' });
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        id_comunidad: comunidad.id,
        estado_solicitud: 'PENDIENTE'
      }
    });

    res.json({ mensaje: 'Solicitud enviada a la comunidad', comunidad: { id: comunidad.id, nombre: comunidad.nombre } });
  } catch (error) {
    console.error('Error al unirse a comunidad:', error);
    res.status(500).json({ error: 'Error interno al unirse a comunidad' });
  }
});

// Iniciar servidor
app.listen(port, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
  await inicializarRoles(); // <--- IMPORTANTE: Esto crea los roles
});