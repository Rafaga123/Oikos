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
  const rolesNecesarios = ['ADMINISTRADOR', 'ENCARGADO_COMUNIDAD', 'HABITANTE'];
  
  console.log("🔄 Verificando roles en la base de datos...");
  
  for (const nombreRol of rolesNecesarios) {
    const existe = await prisma.rol.findUnique({
      where: { nombre: nombreRol } // Prisma sabe que esto es un Enum
    });
    
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
 * Adaptado a la nueva tabla Usuario de Oikos
 */
app.post('/api/registro', async (req, res) => {
  try {
    const { 
      cedula, email, password, 
      primer_nombre, segundo_nombre, 
      primer_apellido, segundo_apellido, 
      fecha_nacimiento 
    } = req.body;

    // 1. Validaciones básicas
    if (!cedula || !email || !password || !primer_nombre || !primer_apellido) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // 2. Buscar el ID del rol "HABITANTE"
    // Ya no usamos el ID 3 fijo, lo buscamos por nombre para ser seguros
    const rolHabitante = await prisma.rol.findUnique({
      where: { nombre: 'HABITANTE' }
    });

    if (!rolHabitante) {
      return res.status(500).json({ error: 'Error del sistema: El rol HABITANTE no existe.' });
    }

    // 3. Encriptar contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // 4. Crear usuario
    // Nota: 'estado_solicitud' se pone en 'SIN_COMUNIDAD' por defecto en la BD
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
        id_rol: rolHabitante.id,
        // id_comunidad se queda en null
      }
    });

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: { id: nuevoUsuario.id, email: nuevoUsuario.email }
    });

  } catch (error) {
    console.error("Error en registro:", error);
    
    // Manejo de errores de Prisma (P2002 es violación de campo único)
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
 * Ahora devuelve el estado de la solicitud para redirigir correctamente
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
    // Incluimos el estado_solicitud en el token por si acaso
    const token = jwt.sign(
      { 
        id: userFound.id, 
        rol: userFound.rol.nombre,
        estado: userFound.estado_solicitud 
      }, 
      process.env.JWT_SECRET || 'secreto_super_seguro', 
      { expiresIn: '1d' }
    );

    // 4. Responder con datos clave para el frontend
    res.json({
      mensaje: 'Bienvenido',
      token,
      usuario: {
        id: userFound.id,
        nombre: userFound.primer_nombre,
        apellido: userFound.primer_apellido,
        rol: userFound.rol.nombre,
        estado_solicitud: userFound.estado_solicitud, // ¡CRUCIAL PARA LA REDIRECCIÓN!
        id_comunidad: userFound.id_comunidad
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
});

// Iniciar servidor y crear roles si no existen
app.listen(port, async () => {
  console.log(`🚀 Servidor Oikos corriendo en http://localhost:${port}`);
  await inicializarRoles(); // <--- La magia ocurre aquí
});