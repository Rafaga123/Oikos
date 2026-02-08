// backend/prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando sembrado de datos (Seeding)...");

  // 1. Asegurar Roles
  const roles = ["ADMINISTRADOR", "ENCARGADO_COMUNIDAD", "HABITANTE"];
  for (const nombre of roles) {
    await prisma.rol.upsert({
      where: { nombre: nombre },
      update: {},
      create: { nombre: nombre },
    });
  }
  const rolAdmin = await prisma.rol.findUnique({
    where: { nombre: "ADMINISTRADOR" },
  });
  const rolGestor = await prisma.rol.findUnique({
    where: { nombre: "ENCARGADO_COMUNIDAD" },
  });
  const rolHabitante = await prisma.rol.findUnique({
    where: { nombre: "HABITANTE" },
  });

  // 2. Crear Comunidad Demo
  const codigoComunidad = "DEMO2026";
  const comunidad = await prisma.comunidad.upsert({
    where: { codigo_unico: codigoComunidad },
    update: {},
    create: {
      nombre: "Residencias El Paraíso (Demo)",
      direccion: "Av. Universidad, Frente al Campus",
      codigo_unico: codigoComunidad,
    },
  });
  console.log(`🏢 Comunidad creada: ${comunidad.nombre}`);

  // Password genérico para todos: "123456"
  const passwordHash = await bcrypt.hash("123456", 10);

  // 3. Crear el Gestor (Tu usuario principal para la demo)
  const gestor = await prisma.usuario.upsert({
    where: { email: "gestor@demo.com" },
    update: {},
    create: {
      cedula: "V-1000000",
      email: "gestor@demo.com",
      password_hash: passwordHash,
      primer_nombre: "Carlos",
      primer_apellido: "Gestor",
      id_rol: rolGestor.id,
      id_comunidad: comunidad.id,
      estado_solicitud: "ACEPTADO",
      tipo_habitante: "PROPIETARIO",
      numero_casa: "A-01",
      telefono: "+584120000000",
    },
  });
  console.log("👤 Gestor creado: gestor@demo.com / 123456");

  // 3.1 Crear Admin para pruebas
  const admin = await prisma.usuario.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      cedula: "V-9999999",
      email: "admin@demo.com",
      password_hash: passwordHash,
      primer_nombre: "Andrea",
      primer_apellido: "Admin",
      id_rol: rolAdmin.id,
      id_comunidad: comunidad.id,
      estado_solicitud: "ACEPTADO",
      tipo_habitante: "PROPIETARIO",
      numero_casa: "ADM-01",
      telefono: "+584121111111",
    },
  });
  console.log("🛡️ Admin creado: admin@demo.com / 123456");

  // 4. Crear Habitantes Ficticios (5 vecinos variados)
  const vecinosData = [
    {
      nombre: "Ana",
      apellido: "Pérez",
      casa: "B-02",
      email: "ana@demo.com",
      cedula: "V-20001",
      tipo: "PROPIETARIO",
      telefono: "0414-1111111",
    },
    {
      nombre: "Luis",
      apellido: "Gómez",
      casa: "C-05",
      email: "luis@demo.com",
      cedula: "V-20002",
      tipo: "INQUILINO",
      telefono: "0414-2222222",
    },
    {
      nombre: "María",
      apellido: "Rodríguez",
      casa: "A-04",
      email: "maria@demo.com",
      cedula: "V-20003",
      tipo: "PROPIETARIO",
      telefono: "0414-3333333",
    },
    {
      nombre: "Pedro",
      apellido: "Sánchez",
      casa: "PH-1",
      email: "pedro@demo.com",
      cedula: "V-20004",
      tipo: "FAMILIAR",
      telefono: "0414-4444444",
    },
    {
      nombre: "Sofia",
      apellido: "Méndez",
      casa: "B-10",
      email: "sofia@demo.com",
      cedula: "V-20005",
      tipo: "PROPIETARIO",
      telefono: "0414-5555555",
    }, // Esta será la "conflictiva"
    {
      nombre: "Jorge",
      apellido: "López",
      casa: "C-12",
      email: "jorge@demo.com",
      cedula: "V-20006",
      tipo: "INQUILINO",
      telefono: "0414-6666666",
    },
    {
      nombre: "Camila",
      apellido: "Ramos",
      casa: "A-06",
      email: "camila@demo.com",
      cedula: "V-20007",
      tipo: "PROPIETARIO",
      telefono: "0414-7777777",
    },
    {
      nombre: "Diego",
      apellido: "Suárez",
      casa: "B-08",
      email: "diego@demo.com",
      cedula: "V-20008",
      tipo: "OTRO",
      telefono: "0414-8888888",
    },
    {
      nombre: "Valentina",
      apellido: "Torres",
      casa: "PH-2",
      email: "vale@demo.com",
      cedula: "V-20009",
      tipo: "FAMILIAR",
      telefono: "0414-9999999",
    },
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
        estado_solicitud: "ACEPTADO",
        tipo_habitante: v.tipo,
        numero_casa: v.casa,
        fecha_registro: new Date("2025-01-15"), // Para que se vea antigüedad
        telefono: v.telefono || null,
      },
    });
    vecinos.push(vecino);
  }
  console.log(`👥 ${vecinos.length} vecinos creados.`);

  // 5. Cuentas Bancarias
  const cuentasCount = await prisma.cuentaBancaria.count({
    where: { id_comunidad: comunidad.id },
  });
  if (cuentasCount === 0) {
    await prisma.cuentaBancaria.createMany({
      data: [
        {
          banco: "Banco Mercantil",
          numero_cuenta: "0105-0000-00-1234567890",
          titular: "Condominio El Paraíso",
          cedula_rif: "J-123456789",
          tipo_cuenta: "Corriente",
          id_comunidad: comunidad.id,
          logo_url: "/uploads/bancos/mercantil.png",
        },
        {
          banco: "Banesco",
          numero_cuenta: "0134-1111-22-3333444455",
          titular: "Condominio El Paraíso",
          cedula_rif: "J-123456789",
          tipo_cuenta: "Pago Móvil",
          telefono: "04141234567",
          id_comunidad: comunidad.id,
          logo_url: "/uploads/bancos/banesco.png",
        },
        {
          banco: "Banco de Venezuela",
          numero_cuenta: "0102-2222-33-4444555566",
          titular: "Condominio El Paraíso",
          cedula_rif: "J-123456789",
          tipo_cuenta: "Ahorro",
          id_comunidad: comunidad.id,
          logo_url: "/uploads/bancos/bdv.png",
        },
      ],
    });
  }

  // 5.1 Reglas y Reglamento
  const reglas = [
    {
      titulo: "Horario de ruidos",
      contenido: "Evitar ruidos excesivos después de las 10:00pm.",
      categoria: "convivencia",
    },
    {
      titulo: "Mascotas en áreas comunes",
      contenido: "Las mascotas deben circular con correa.",
      categoria: "convivencia",
    },
    {
      titulo: "Uso de piscina",
      contenido: "Obligatorio ducharse antes de entrar a la piscina.",
      categoria: "seguridad",
    },
    {
      titulo: "Estacionamiento",
      contenido: "Solo vehículos autorizados en puestos asignados.",
      categoria: "seguridad",
    },
    {
      titulo: "Manejo de desechos",
      contenido: "Sacar la basura en los horarios establecidos.",
      categoria: "mantenimiento",
    },
    {
      titulo: "Eventos en salón",
      contenido: "Reservas con mínimo 48h de anticipación.",
      categoria: "convivencia",
    },
  ];

  for (const r of reglas) {
    const existe = await prisma.regla.findFirst({
      where: { titulo: r.titulo, id_comunidad: comunidad.id },
    });
    if (!existe) {
      await prisma.regla.create({ data: { ...r, id_comunidad: comunidad.id } });
    }
  }

  // 6. Pagos (Historial para las gráficas)
  // Vamos a crear pagos pasados y uno pendiente
  const pagos = [
    {
      usuario: vecinos[0],
      monto: 50.0,
      concepto: "Condominio Enero",
      estado: "APROBADO",
      fecha: new Date("2026-01-05"),
    },
    {
      usuario: vecinos[1],
      monto: 50.0,
      concepto: "Condominio Enero",
      estado: "APROBADO",
      fecha: new Date("2026-01-07"),
    },
    {
      usuario: vecinos[2],
      monto: 50.0,
      concepto: "Condominio Enero",
      estado: "APROBADO",
      fecha: new Date("2026-01-10"),
    },
    {
      usuario: vecinos[3],
      monto: 20.0,
      concepto: "Multa Ruido",
      estado: "RECHAZADO",
      fecha: new Date("2026-01-12"),
      nota: "Referencia bancaria ilegible",
    },
    {
      usuario: vecinos[0],
      monto: 50.0,
      concepto: "Condominio Febrero",
      estado: "PENDIENTE",
      fecha: new Date(),
    }, // Ana acaba de pagar
    {
      usuario: vecinos[4],
      monto: 50.0,
      concepto: "Condominio Febrero",
      estado: "EN_REVISION",
      fecha: new Date(),
      nota: "Comprobante borroso",
    },
    {
      usuario: vecinos[5],
      monto: 50.0,
      concepto: "Condominio Diciembre",
      estado: "APROBADO",
      fecha: new Date("2025-12-28"),
    },
    {
      usuario: vecinos[6],
      monto: 75.0,
      concepto: "Reparación portón",
      estado: "APROBADO",
      fecha: new Date("2026-01-15"),
    },
    {
      usuario: vecinos[7],
      monto: 50.0,
      concepto: "Condominio Enero",
      estado: "APROBADO",
      fecha: new Date("2026-01-09"),
    },
  ];

  for (const p of pagos) {
    const existePago = await prisma.pago.findFirst({
      where: {
        id_usuario: p.usuario.id,
        concepto: p.concepto,
        fecha_pago: p.fecha,
      },
    });
    if (!existePago) {
      await prisma.pago.create({
        data: {
          id_usuario: p.usuario.id,
          monto: p.monto,
          concepto: p.concepto,
          estado: p.estado,
          fecha_pago: p.fecha,
          referencia: "REF-" + Math.floor(Math.random() * 10000),
          metodo_pago: "Pago Movil",
          banco_origen: "Banesco",
          banco_destino: "Banco Mercantil",
          nota_admin: p.nota || null,
        },
      });
    }
  }
  console.log("💰 Historial de pagos generado.");

  // 7. Incidencias (Reportes)
  const incidencias = [
    {
      titulo: "Ascensor Torre B averiado",
      descripcion: "El ascensor hace un ruido extraño y no abre en el piso 3.",
      categoria: "Mantenimiento",
      importancia: "Alta",
      estado: "EN_PROGRESO",
      usuario: vecinos[1],
    },
    {
      titulo: "Bombillo quemado en pasillo",
      descripcion: "Entrada principal sin luz.",
      categoria: "Electricidad",
      importancia: "Media",
      estado: "ABIERTO",
      usuario: vecinos[0],
    },
    {
      titulo: "Fuga de agua en estacionamiento",
      descripcion: "Se observa una fuga constante cerca del puesto C-07.",
      categoria: "Servicios",
      importancia: "Alta",
      estado: "ABIERTO",
      usuario: vecinos[6],
    },
    {
      titulo: "Portón eléctrico lento",
      descripcion:
        "El portón tarda demasiado en cerrar, posible riesgo de seguridad.",
      categoria: "Seguridad",
      importancia: "Media",
      estado: "RESUELTO",
      usuario: vecinos[5],
    },
  ];

  for (const i of incidencias) {
    const existeInc = await prisma.incidencia.findFirst({
      where: { titulo: i.titulo, id_usuario: i.usuario.id },
    });
    if (!existeInc) {
      await prisma.incidencia.create({
        data: {
          titulo: i.titulo,
          descripcion: i.descripcion,
          categoria: i.categoria,
          importancia: i.importancia,
          estado: i.estado,
          id_usuario: i.usuario.id,
        },
      });
    }
  }

  // 8. Anuncios y Noticias
  const anuncios = [
    {
      titulo: "¡Bienvenidos a la nueva plataforma Oikos!",
      contenido: "Estimados vecinos, ahora gestionaremos todo por aquí.",
      categoria: "General",
      prioridad: true,
      fecha: new Date(),
      autor: gestor.id,
    },
    {
      titulo: "Corte de agua programado",
      contenido:
        "Por mantenimiento de bombas, no habrá agua el martes de 8am a 12pm.",
      categoria: "Servicios",
      prioridad: false,
      fecha: new Date("2026-01-20"),
      autor: gestor.id,
    },
    {
      titulo: "Jornada de fumigación",
      contenido:
        "Fumigación general el jueves a las 9am. Mantener ventanas cerradas.",
      categoria: "Mantenimiento",
      prioridad: false,
      fecha: new Date("2026-02-02"),
      autor: gestor.id,
    },
    {
      titulo: "Reunión de condominio",
      contenido: "Asamblea general el sábado a las 5pm en el salón de eventos.",
      categoria: "General",
      prioridad: true,
      fecha: new Date("2026-02-05"),
      autor: admin.id,
    },
  ];

  for (const a of anuncios) {
    const existeAnuncio = await prisma.anuncio.findFirst({
      where: { titulo: a.titulo, id_comunidad: comunidad.id },
    });
    if (!existeAnuncio) {
      await prisma.anuncio.create({
        data: {
          titulo: a.titulo,
          contenido: a.contenido,
          categoria: a.categoria,
          prioridad: a.prioridad,
          fecha_publicacion: a.fecha,
          id_comunidad: comunidad.id,
          id_autor: a.autor,
        },
      });
    }
  }

  // 9. Foro Social (Chismes y Ventas)
  const postsData = [
    {
      titulo: "Vendo bicicleta de montaña",
      contenido:
        "Usada pero en buen estado. Precio negociable. Ver en Casa B-02",
      usuario: vecinos[0],
      likes: [vecinos[1], vecinos[2]],
      cantidad_likes: 2,
    },
    {
      titulo: "¿Alguien sabe a qué hora pasa el aseo?",
      contenido: "Llevo días esperando y nada.",
      usuario: vecinos[4],
      likes: [],
      cantidad_likes: 0,
    },
    {
      titulo: "Cambio de bombillo en pasillo",
      contenido: "Ya reporté el bombillo, gracias a todos.",
      usuario: vecinos[1],
      likes: [vecinos[0]],
      cantidad_likes: 1,
    },
    {
      titulo: "Busco profesor de música",
      contenido: "Para clases a niños, interesados escribir por interno.",
      usuario: vecinos[6],
      likes: [vecinos[2], vecinos[3]],
      cantidad_likes: 2,
    },
  ];

  const postsCreados = [];
  for (const p of postsData) {
    let post = await prisma.post.findFirst({
      where: { titulo: p.titulo, id_usuario: p.usuario.id },
    });
    if (!post) {
      post = await prisma.post.create({
        data: {
          titulo: p.titulo,
          contenido: p.contenido,
          id_usuario: p.usuario.id,
          id_comunidad: comunidad.id,
          cantidad_likes: p.cantidad_likes,
        },
      });
    } else {
      post = await prisma.post.update({
        where: { id: post.id },
        data: { cantidad_likes: p.cantidad_likes },
      });
    }
    postsCreados.push({ post, likes: p.likes });
  }

  for (const p of postsCreados) {
    if (p.likes.length > 0) {
      await prisma.like.createMany({
        data: p.likes.map((u) => ({ id_usuario: u.id, id_post: p.post.id })),
        skipDuplicates: true,
      });
    }
  }

  // 10. Encuestas
  let encuesta = await prisma.encuesta.findFirst({
    where: {
      titulo: "¿De qué color pintamos la fachada?",
      id_comunidad: comunidad.id,
    },
    include: { opciones: true },
  });
  if (!encuesta) {
    encuesta = await prisma.encuesta.create({
      data: {
        titulo: "¿De qué color pintamos la fachada?",
        descripcion: "Elige tu opción favorita para este año.",
        fecha_inicio: new Date(),
        fecha_fin: new Date(new Date().setDate(new Date().getDate() + 7)), // Termina en 1 semana
        tipo_voto: "single",
        id_comunidad: comunidad.id,
        opciones: {
          create: [
            { texto: "Blanco Hueso" },
            { texto: "Azul Cielo" },
            { texto: "Terracota" },
          ],
        },
      },
      include: { opciones: true },
    });
  }

  let encuesta2 = await prisma.encuesta.findFirst({
    where: {
      titulo: "¿Qué servicio priorizamos este trimestre?",
      id_comunidad: comunidad.id,
    },
    include: { opciones: true },
  });
  if (!encuesta2) {
    encuesta2 = await prisma.encuesta.create({
      data: {
        titulo: "¿Qué servicio priorizamos este trimestre?",
        descripcion: "Vota la inversión más urgente para la comunidad.",
        fecha_inicio: new Date("2026-01-01"),
        fecha_fin: new Date("2026-01-20"),
        tipo_voto: "single",
        id_comunidad: comunidad.id,
        opciones: {
          create: [
            { texto: "Mejoras en seguridad" },
            { texto: "Pintura de áreas comunes" },
            { texto: "Mantenimiento de ascensores" },
          ],
        },
      },
      include: { opciones: true },
    });
  }

  // Votar en la encuesta
  await prisma.votoEncuesta.upsert({
    where: {
      id_usuario_id_encuesta: {
        id_usuario: vecinos[0].id,
        id_encuesta: encuesta.id,
      },
    },
    update: {},
    create: {
      id_usuario: vecinos[0].id,
      id_encuesta: encuesta.id,
      id_opcion: encuesta.opciones[0].id,
    },
  });
  await prisma.votoEncuesta.upsert({
    where: {
      id_usuario_id_encuesta: {
        id_usuario: vecinos[1].id,
        id_encuesta: encuesta.id,
      },
    },
    update: {},
    create: {
      id_usuario: vecinos[1].id,
      id_encuesta: encuesta.id,
      id_opcion: encuesta.opciones[2].id,
    },
  });
  await prisma.votoEncuesta.upsert({
    where: {
      id_usuario_id_encuesta: {
        id_usuario: vecinos[2].id,
        id_encuesta: encuesta.id,
      },
    },
    update: {},
    create: {
      id_usuario: vecinos[2].id,
      id_encuesta: encuesta.id,
      id_opcion: encuesta.opciones[0].id,
    },
  });

  await prisma.votoEncuesta.upsert({
    where: {
      id_usuario_id_encuesta: {
        id_usuario: vecinos[3].id,
        id_encuesta: encuesta2.id,
      },
    },
    update: {},
    create: {
      id_usuario: vecinos[3].id,
      id_encuesta: encuesta2.id,
      id_opcion: encuesta2.opciones[1].id,
    },
  });
  await prisma.votoEncuesta.upsert({
    where: {
      id_usuario_id_encuesta: {
        id_usuario: vecinos[4].id,
        id_encuesta: encuesta2.id,
      },
    },
    update: {},
    create: {
      id_usuario: vecinos[4].id,
      id_encuesta: encuesta2.id,
      id_opcion: encuesta2.opciones[2].id,
    },
  });
  await prisma.votoEncuesta.upsert({
    where: {
      id_usuario_id_encuesta: {
        id_usuario: vecinos[5].id,
        id_encuesta: encuesta2.id,
      },
    },
    update: {},
    create: {
      id_usuario: vecinos[5].id,
      id_encuesta: encuesta2.id,
      id_opcion: encuesta2.opciones[0].id,
    },
  });

  // 11. Áreas comunes y reservas
  async function getOrCreateArea(nombre, descripcion) {
    const existente = await prisma.areaComun.findFirst({
      where: { nombre, id_comunidad: comunidad.id },
    });
    if (existente) return existente;
    return prisma.areaComun.create({
      data: { nombre, descripcion, id_comunidad: comunidad.id },
    });
  }

  const piscina = await getOrCreateArea(
    "Piscina",
    "Área recreativa con horario familiar",
  );
  const salon = await getOrCreateArea(
    "Salón de eventos",
    "Espacio para reuniones y celebraciones",
  );
  const gimnasio = await getOrCreateArea(
    "Gimnasio",
    "Área de ejercicios y máquinas",
  );
  const parque = await getOrCreateArea(
    "Parque infantil",
    "Zona de juegos para niños",
  );

  const reservasData = [
    {
      area: salon,
      usuario: vecinos[0],
      fecha: new Date("2026-02-10"),
      inicio: new Date("2026-02-10T16:00:00"),
      fin: new Date("2026-02-10T20:00:00"),
      estado: "APROBADA",
    },
    {
      area: piscina,
      usuario: vecinos[1],
      fecha: new Date("2026-02-12"),
      inicio: new Date("2026-02-12T10:00:00"),
      fin: new Date("2026-02-12T12:00:00"),
      estado: "PENDIENTE",
    },
    {
      area: gimnasio,
      usuario: vecinos[2],
      fecha: new Date("2026-02-11"),
      inicio: new Date("2026-02-11T07:00:00"),
      fin: new Date("2026-02-11T08:00:00"),
      estado: "APROBADA",
    },
    {
      area: parque,
      usuario: vecinos[3],
      fecha: new Date("2026-02-09"),
      inicio: new Date("2026-02-09T15:00:00"),
      fin: new Date("2026-02-09T17:00:00"),
      estado: "APROBADA",
    },
  ];

  for (const r of reservasData) {
    const existeRes = await prisma.reserva.findFirst({
      where: {
        id_area: r.area.id,
        id_usuario: r.usuario.id,
        fecha_reserva: r.fecha,
      },
    });
    if (!existeRes) {
      await prisma.reserva.create({
        data: {
          id_area: r.area.id,
          id_usuario: r.usuario.id,
          fecha_reserva: r.fecha,
          hora_inicio: r.inicio,
          hora_fin: r.fin,
          estado: r.estado,
        },
      });
    }
  }

  // 12. Horarios y excepciones
  async function getOrCreateHorario(data) {
    const existente = await prisma.horario.findFirst({
      where: { nombre: data.nombre, id_comunidad: comunidad.id },
    });
    if (existente) return existente;
    return prisma.horario.create({
      data: { ...data, id_comunidad: comunidad.id },
    });
  }

  const horarioPiscina = await getOrCreateHorario({
    nombre: "Horario Piscina",
    area: "piscina",
    tipo: "regular",
    dias: JSON.stringify([
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
      "domingo",
    ]),
    hora_inicio: "08:00",
    hora_fin: "19:00",
    estado: "activo",
    capacidad: 30,
    grupo: "familiar",
    descripcion: "Uso general de la piscina",
    restricciones: JSON.stringify(["Gorro", "Ducha previa"]),
  });

  const horarioGym = await getOrCreateHorario({
    nombre: "Horario Gimnasio",
    area: "gimnasio",
    tipo: "regular",
    dias: JSON.stringify(["lunes", "martes", "miercoles", "jueves", "viernes"]),
    hora_inicio: "06:00",
    hora_fin: "21:00",
    estado: "activo",
    capacidad: 15,
    grupo: "adultos",
    descripcion: "Horario regular del gimnasio",
    restricciones: JSON.stringify(["Toalla", "Zapatos deportivos"]),
  });

  const excepciones = [
    {
      horario: horarioPiscina,
      fecha: new Date("2026-02-18"),
      tipo: "mantenimiento",
      descripcion: "Limpieza profunda",
      horario_especial: "12:00 - 16:00",
    },
    {
      horario: horarioGym,
      fecha: new Date("2026-02-20"),
      tipo: "cerrado",
      descripcion: "Falla eléctrica",
      horario_especial: null,
    },
  ];

  for (const e of excepciones) {
    const existeExc = await prisma.excepcionHorario.findFirst({
      where: { id_horario: e.horario.id, fecha: e.fecha },
    });
    if (!existeExc) {
      await prisma.excepcionHorario.create({
        data: {
          id_horario: e.horario.id,
          fecha: e.fecha,
          tipo: e.tipo,
          descripcion: e.descripcion,
          horario_especial: e.horario_especial,
        },
      });
    }
  }

  // 13. Actividades
  const actividades = [
    {
      titulo: "Clase de Yoga",
      tipo: "activity",
      area: "salon",
      fecha: new Date("2026-02-15"),
      hora_inicio: "09:00",
      hora_fin: "10:30",
      descripcion: "Clase abierta para residentes.",
      organizador: "Comité de Bienestar",
      contacto: "0414-1230000",
      max_participantes: 20,
      estado: "confirmed",
    },
    {
      titulo: "Reunión de seguridad",
      tipo: "meeting",
      area: "salon",
      fecha: new Date("2026-02-16"),
      hora_inicio: "18:00",
      hora_fin: "19:30",
      descripcion: "Revisión de protocolos y mejoras.",
      organizador: "Administración",
      contacto: "0414-1230001",
      max_participantes: 30,
      estado: "confirmed",
    },
    {
      titulo: "Mantenimiento de ascensores",
      tipo: "maintenance",
      area: "torres",
      fecha: new Date("2026-02-19"),
      hora_inicio: "08:00",
      hora_fin: "14:00",
      descripcion: "Mantenimiento preventivo anual.",
      organizador: "Empresa Elevatec",
      contacto: "0414-1230002",
      max_participantes: null,
      estado: "pending",
    },
  ];

  for (const a of actividades) {
    const existeAct = await prisma.actividad.findFirst({
      where: { titulo: a.titulo, id_comunidad: comunidad.id },
    });
    if (!existeAct) {
      await prisma.actividad.create({
        data: {
          ...a,
          id_comunidad: comunidad.id,
        },
      });
    }
  }

  // 14. Logs de auditoría
  const logs = [
    {
      accion: "LOGIN",
      detalle_tecnico: "Ingreso exitoso desde IP 192.168.0.12",
      id_usuario: gestor.id,
      id_comunidad: comunidad.id,
    },
    {
      accion: "INSERT_PAGO",
      detalle_tecnico: "Pago creado por Ana Pérez",
      id_usuario: vecinos[0].id,
      id_comunidad: comunidad.id,
    },
    {
      accion: "CREAR_ANUNCIO",
      detalle_tecnico: "Anuncio de fumigación publicado",
      id_usuario: gestor.id,
      id_comunidad: comunidad.id,
    },
  ];

  for (const l of logs) {
    const existeLog = await prisma.logAuditoria.findFirst({
      where: {
        accion: l.accion,
        id_usuario: l.id_usuario,
        id_comunidad: l.id_comunidad,
      },
    });
    if (!existeLog) {
      await prisma.logAuditoria.create({ data: l });
    }
  }

  console.log("✅ Base de datos poblada exitosamente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
