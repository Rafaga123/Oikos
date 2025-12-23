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

    // 2. Buscar anuncios de ESA comunidad
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
});