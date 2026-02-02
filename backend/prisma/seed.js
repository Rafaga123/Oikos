// backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
console.log('🌱 Iniciando sembrado de datos (Seeding)...');

  // 1. Asegurar Roles
const roles = ['ADMINISTRADOR', 'ENCARGADO_COMUNIDAD', 'HABITANTE'];
for (const nombre of roles) {
    await prisma.rol.upsert({
        where: { nombre: nombre },
        update: {},
        create: { nombre: nombre },
    });
}
    const rolAdmin = await prisma.rol.findUnique({ where: { nombre: 'ADMINISTRADOR' } });
    const rolGestor = await prisma.rol.findUnique({ where: { nombre: 'ENCARGADO_COMUNIDAD' } });
    const rolHabitante = await prisma.rol.findUnique({ where: { nombre: 'HABITANTE' } });

  // 2. Crear Comunidad Demo
    const codigoComunidad = 'DEMO2026';
    const comunidad = await prisma.comunidad.upsert({
    where: { codigo_unico: codigoComunidad },
    update: {},
    create: {
        nombre: 'Residencias El Paraíso (Demo)',
        direccion: 'Av. Universidad, Frente al Campus',
        codigo_unico: codigoComunidad,
    },
    });
console.log(`🏢 Comunidad creada: ${comunidad.nombre}`);

  // Password genérico para todos: "123456"
const passwordHash = await bcrypt.hash('123456', 10);

  // 3. Crear el Gestor (Tu usuario principal para la demo)
const gestor = await prisma.usuario.upsert({
    where: { email: 'gestor@demo.com' },
    update: {},
    create: {
        cedula: 'V-1000000',
        email: 'gestor@demo.com',
        password_hash: passwordHash,
        primer_nombre: 'Carlos',
        primer_apellido: 'Gestor',
        id_rol: rolGestor.id,
        id_comunidad: comunidad.id,
        estado_solicitud: 'ACEPTADO',
        tipo_habitante: 'PROPIETARIO',
        numero_casa: 'A-01',
        telefono: '+584120000000'
    },
});
console.log('👤 Gestor creado: gestor@demo.com / 123456');

  // 4. Crear Habitantes Ficticios (5 vecinos variados)
    const vecinosData = [
    { nombre: 'Ana', apellido: 'Pérez', casa: 'B-02', email: 'ana@demo.com', cedula: 'V-20001', tipo: 'PROPIETARIO' },
    { nombre: 'Luis', apellido: 'Gómez', casa: 'C-05', email: 'luis@demo.com', cedula: 'V-20002', tipo: 'INQUILINO' },
    { nombre: 'María', apellido: 'Rodríguez', casa: 'A-04', email: 'maria@demo.com', cedula: 'V-20003', tipo: 'PROPIETARIO' },
    { nombre: 'Pedro', apellido: 'Sánchez', casa: 'PH-1', email: 'pedro@demo.com', cedula: 'V-20004', tipo: 'FAMILIAR' },
    { nombre: 'Sofia', apellido: 'Méndez', casa: 'B-10', email: 'sofia@demo.com', cedula: 'V-20005', tipo: 'PROPIETARIO' } // Esta será la "conflictiva"
];

const vecinos = [];
for (const v of vecinosData) {
    const vecino = await prisma.usuario.upsert({
        where: { email: v.email },
        update: {},
        create: {
            cedula: v.cedula,
            email: v.email,
            password_hash: passwordHash,
            primer_nombre: v.nombre,
            primer_apellido: v.apellido,
            id_rol: rolHabitante.id,
            id_comunidad: comunidad.id,
            estado_solicitud: 'ACEPTADO',
            tipo_habitante: v.tipo,
            numero_casa: v.casa,
            fecha_registro: new Date('2025-01-15') // Para que se vea antigüedad
        },
    });
    vecinos.push(vecino);
}
console.log(`👥 ${vecinos.length} vecinos creados.`);

  // 5. Cuentas Bancarias
await prisma.cuentaBancaria.createMany({
    data: [
        { banco: 'Banco Mercantil', numero_cuenta: '0105-0000-00-1234567890', titular: 'Condominio El Paraíso', cedula_rif: 'J-123456789', tipo_cuenta: 'Corriente', id_comunidad: comunidad.id },
        { banco: 'Banesco', numero_cuenta: '0134-1111-22-3333444455', titular: 'Condominio El Paraíso', cedula_rif: 'J-123456789', tipo_cuenta: 'Pago Móvil', telefono: '04141234567', id_comunidad: comunidad.id }
    ]
});

  // 6. Pagos (Historial para las gráficas)
  // Vamos a crear pagos pasados y uno pendiente
  const pagos = [
    { usuario: vecinos[0], monto: 50.00, concepto: 'Condominio Enero', estado: 'APROBADO', fecha: new Date('2026-01-05') },
    { usuario: vecinos[1], monto: 50.00, concepto: 'Condominio Enero', estado: 'APROBADO', fecha: new Date('2026-01-07') },
    { usuario: vecinos[2], monto: 50.00, concepto: 'Condominio Enero', estado: 'APROBADO', fecha: new Date('2026-01-10') },
    { usuario: vecinos[3], monto: 20.00, concepto: 'Multa Ruido', estado: 'RECHAZADO', fecha: new Date('2026-01-12'), nota: 'Referencia bancaria ilegible' },
    { usuario: vecinos[0], monto: 50.00, concepto: 'Condominio Febrero', estado: 'PENDIENTE', fecha: new Date() }, // Ana acaba de pagar
  ];

  for (const p of pagos) {
    await prisma.pago.create({
      data: {
        id_usuario: p.usuario.id,
        monto: p.monto,
        concepto: p.concepto,
        estado: p.estado,
        fecha_pago: p.fecha,
        referencia: 'REF-' + Math.floor(Math.random() * 10000),
        metodo_pago: 'Pago Movil',
        nota_admin: p.nota || null
      }
    });
  }
  console.log('💰 Historial de pagos generado.');

  // 7. Incidencias (Reportes)
  await prisma.incidencia.create({
    data: {
      titulo: 'Ascensor Torre B averiado',
      descripcion: 'El ascensor hace un ruido extraño y no abre en el piso 3.',
      categoria: 'Mantenimiento',
      importancia: 'Alta',
      estado: 'EN_PROGRESO',
      id_usuario: vecinos[1].id // Reportado por Luis
    }
  });
  await prisma.incidencia.create({
    data: {
      titulo: 'Bombillo quemado en pasillo',
      descripcion: 'Entrada principal sin luz.',
      categoria: 'Electricidad',
      importancia: 'Media',
      estado: 'ABIERTO', // Nuevo reporte para que el gestor lo vea
      id_usuario: vecinos[0].id // Ana
    }
  });

  // 8. Anuncios y Noticias
  await prisma.anuncio.create({
    data: {
      titulo: '¡Bienvenidos a la nueva plataforma Oikos!',
      contenido: 'Estimados vecinos, ahora gestionaremos todo por aquí.',
      categoria: 'General',
      prioridad: true,
      fecha_publicacion: new Date(),
      id_comunidad: comunidad.id,
      id_autor: gestor.id
    }
  });
  await prisma.anuncio.create({
    data: {
      titulo: 'Corte de agua programado',
      contenido: 'Por mantenimiento de bombas, no habrá agua el martes de 8am a 12pm.',
      categoria: 'Servicios',
      prioridad: false,
      fecha_publicacion: new Date('2026-01-20'),
      id_comunidad: comunidad.id,
      id_autor: gestor.id
    }
  });

  // 9. Foro Social (Chismes y Ventas)
  const post1 = await prisma.post.create({
    data: {
      titulo: 'Vendo bicicleta de montaña',
      contenido: 'Usada pero en buen estado. Precio negociable. Ver en Casa B-02',
      id_usuario: vecinos[0].id,
      id_comunidad: comunidad.id,
      likes: { create: [{ id_usuario: vecinos[1].id }, { id_usuario: vecinos[2].id }] } // 2 likes
    }
  });

  await prisma.post.create({
    data: {
      titulo: '¿Alguien sabe a qué hora pasa el aseo?',
      contenido: 'Llevo dias esperando y nada.',
      id_usuario: vecinos[4].id, // Sofia pregunta
      id_comunidad: comunidad.id
    }
  });

  // 10. Encuestas
  const encuesta = await prisma.encuesta.create({
    data: {
    titulo: '¿De qué color pintamos la fachada?',
    descripcion: 'Elige tu opción favorita para este año.',
    fecha_inicio: new Date(),
      fecha_fin: new Date(new Date().setDate(new Date().getDate() + 7)), // Termina en 1 semana
    tipo_voto: 'single',
    id_comunidad: comunidad.id,
    opciones: {
        create: [
        { texto: 'Blanco Hueso' },
        { texto: 'Azul Cielo' },
        { texto: 'Terracota' }
        ]
    }
    },
    include: { opciones: true }
});

  // Votar en la encuesta
await prisma.votoEncuesta.create({ data: { id_usuario: vecinos[0].id, id_encuesta: encuesta.id, id_opcion: encuesta.opciones[0].id } });
await prisma.votoEncuesta.create({ data: { id_usuario: vecinos[1].id, id_encuesta: encuesta.id, id_opcion: encuesta.opciones[2].id } });
await prisma.votoEncuesta.create({ data: { id_usuario: vecinos[2].id, id_encuesta: encuesta.id, id_opcion: encuesta.opciones[0].id } });

console.log('✅ Base de datos poblada exitosamente.');
}

main()
.catch((e) => {
    console.error(e);
    process.exit(1);
})
.finally(async () => {
    await prisma.$disconnect();
});