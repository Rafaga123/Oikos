let incidencias = [];
let incidenciaSeleccionada = null;

document.addEventListener("DOMContentLoaded", () => {
  inicializarUI();
  cargarIncidencias();
});

function inicializarUI() {
  if (window.jQuery) {
    $(".ui.dropdown").dropdown({ placeholder: "auto" });
  }

  $(".ui.sidebar").sidebar({ context: $(".pusher"), transition: "overlay" });
  $("#sidebar-toggle").on("click", () => $(".ui.sidebar").sidebar("toggle"));

  $("#status-filter, #category-filter, #date-filter").on(
    "change",
    aplicarFiltros,
  );
  $("#reset-filters").on("click", (e) => {
    e.preventDefault();
    $("#status-filter").dropdown("set selected", "all");
    $("#category-filter").dropdown("set selected", "all");
    $("#date-filter").dropdown("set selected", "all");
    aplicarFiltros();
  });

  $("#mark-all-reviewed").on("click", marcarTodasRevisadas);

  $(document).on("click", ".btn-detalles", (e) => {
    const id = parseInt($(e.currentTarget).data("id"));
    abrirModalDetalles(id);
  });

  $(document).on("click", ".btn-resolver", async (e) => {
    const id = parseInt($(e.currentTarget).data("id"));
    await actualizarEstado(id, "RESUELTO");
  });

  $(document).on("click", ".btn-revision", async (e) => {
    const id = parseInt($(e.currentTarget).data("id"));
    await actualizarEstado(id, "EN_PROGRESO");
  });

  $(document).on("click", ".btn-rechazar", async (e) => {
    const id = parseInt($(e.currentTarget).data("id"));
    await actualizarEstado(id, "CERRADO");
  });

  $("#resolve-request-btn").on("click", async () => {
    if (!incidenciaSeleccionada) return;
    await actualizarEstado(incidenciaSeleccionada.id, "RESUELTO");
    $("#request-details-modal").modal("hide");
  });
}

async function cargarIncidencias() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/gestor/incidencias", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Error al cargar incidencias");

    incidencias = await res.json();
    aplicarFiltros();
  } catch (error) {
    console.error(error);
    $("#requests-list").html(
      '<div class="ui negative message">No se pudieron cargar las incidencias.</div>',
    );
  }
}

function aplicarFiltros() {
  const statusFilter = $("#status-filter").val();
  const categoryFilter = $("#category-filter").val();
  const dateFilter = $("#date-filter").val();

  let filtradas = [...incidencias];

  if (statusFilter !== "all") {
    filtradas = filtradas.filter(
      (i) => mapEstado(i.estado).key === statusFilter,
    );
  }

  if (categoryFilter !== "all") {
    filtradas = filtradas.filter(
      (i) => normalizarCategoria(i.categoria) === categoryFilter,
    );
  }

  if (dateFilter !== "all") {
    filtradas = filtradas.filter((i) =>
      filtrarPorFecha(i.fecha_reporte, dateFilter),
    );
  }

  actualizarEstadisticas();
  renderizarLista(filtradas);
}

function renderizarLista(lista) {
  const contenedor = $("#requests-list");
  contenedor.empty();

  if (!lista.length) {
    contenedor.html(`
            <div class="empty-state">
                <i class="inbox icon"></i>
                <h3>No hay solicitudes pendientes</h3>
                <p>No se encontraron incidencias con los filtros actuales.</p>
            </div>
        `);
    $("#requests-count").text("0 solicitudes encontradas");
    return;
  }

  $("#requests-count").text(`${lista.length} solicitudes encontradas`);

  lista.forEach((incidencia) => {
    const estado = mapEstado(incidencia.estado);
    const categoria = normalizarCategoria(incidencia.categoria);
    const categoriaClase = `category-${categoria}`;
    const fecha = formatearFecha(incidencia.fecha_reporte);
    const nombre = incidencia.usuario
      ? `${incidencia.usuario.primer_nombre} ${incidencia.usuario.primer_apellido}`
      : "Habitante";
    const casa =
      incidencia.usuario && incidencia.usuario.numero_casa
        ? `Casa ${incidencia.usuario.numero_casa}`
        : "Sin casa";

    const acciones = `
            <button class="ui tiny button btn-detalles" data-id="${incidencia.id}">
                <i class="eye icon"></i> Ver detalles
            </button>
            ${
              incidencia.estado !== "RESUELTO"
                ? `
        ${
          incidencia.estado === "ABIERTO"
            ? `
        <button class="ui tiny blue button btn-revision" data-id="${incidencia.id}">
          <i class="sync alternate icon"></i> En revisión
        </button>`
            : ""
        }
            <button class="ui tiny green button btn-resolver" data-id="${incidencia.id}">
                <i class="check icon"></i> Marcar Resuelta
            </button>`
                : ""
            }
        ${
          incidencia.estado !== "CERRADO"
            ? `
        <button class="ui tiny red button btn-rechazar" data-id="${incidencia.id}">
          <i class="times icon"></i> Rechazar
        </button>`
            : ""
        }
        `;

    const html = `
            <div class="request-item ${estado.key === "resuelta" ? "resuelta" : ""}">
                <div class="request-header">
                    <div class="request-title">${incidencia.titulo || "Incidencia"}</div>
                    <div>
                        <span class="request-category ${categoriaClase}">${incidencia.categoria || "Otros"}</span>
                        <span class="status-badge ${estado.badge}">${estado.label}</span>
                    </div>
                </div>

                <div class="request-content">${incidencia.descripcion || "Sin descripción"}</div>

                <div class="request-meta">
                    <div class="request-info">
                        <span><i class="user icon"></i> ${nombre}</span>
                        <span><i class="home icon"></i> ${casa}</span>
                        <span><i class="calendar icon"></i> ${fecha}</span>
                    </div>
                    <div class="request-actions">
                        ${acciones}
                    </div>
                </div>
            </div>
        `;

    contenedor.append(html);
  });
}

function actualizarEstadisticas() {
  const pendientes = incidencias.filter((i) => i.estado === "ABIERTO").length;
  const revision = incidencias.filter((i) => i.estado === "EN_PROGRESO").length;
  const resueltas = incidencias.filter((i) => i.estado === "RESUELTO").length;
  const rechazadas = incidencias.filter((i) => i.estado === "CERRADO").length;

  $("#pending-count").text(pendientes);
  $("#review-count").text(revision);
  $("#resolved-count").text(resueltas);
  $("#rejected-count").text(rechazadas);
}

function abrirModalDetalles(id) {
  const incidencia = incidencias.find((i) => i.id === id);
  if (!incidencia) return;

  incidenciaSeleccionada = incidencia;
  const estado = mapEstado(incidencia.estado);
  const fecha = formatearFecha(incidencia.fecha_reporte, true);
  const nombre = incidencia.usuario
    ? `${incidencia.usuario.primer_nombre} ${incidencia.usuario.primer_apellido}`
    : "Habitante";
  const casa =
    incidencia.usuario && incidencia.usuario.numero_casa
      ? `Casa ${incidencia.usuario.numero_casa}`
      : "Sin casa";

  $("#modal-title").text(incidencia.titulo || "Detalles de la Solicitud");
  $("#request-details-content").html(`
        <div class="details-section">
            <span class="details-label">Estado</span>
            <div class="details-value">${estado.label}</div>
        </div>
        <div class="details-section">
            <span class="details-label">Categoría</span>
            <div class="details-value">${incidencia.categoria || "Otros"}</div>
        </div>
        <div class="details-section">
            <span class="details-label">Importancia</span>
            <div class="details-value">${incidencia.importancia || "Sin prioridad"}</div>
        </div>
        <div class="details-section">
            <span class="details-label">Descripción</span>
            <div class="details-value">${incidencia.descripcion || "Sin descripción"}</div>
        </div>
        <div class="details-section">
            <span class="details-label">Reportado por</span>
            <div class="details-value">${nombre} · ${casa}</div>
        </div>
        <div class="details-section">
            <span class="details-label">Fecha</span>
            <div class="details-value">${fecha}</div>
        </div>
    `);
  $("#request-details-content").show();
  $("#resolve-request-btn").toggle(
    incidencia.estado !== "RESUELTO" && incidencia.estado !== "CERRADO",
  );
  $("#request-details-modal").modal("show");
}

async function marcarTodasRevisadas() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch(
      "http://localhost:3000/api/gestor/incidencias/revisar-todo",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo actualizar");

    await Swal.fire(
      "Listo",
      data.mensaje || "Incidencias actualizadas.",
      "success",
    );
    cargarIncidencias();
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "No se pudo marcar como revisadas.", "error");
  }
}

async function actualizarEstado(id, estado) {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch(
      `http://localhost:3000/api/gestor/incidencias/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado }),
      },
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo actualizar");

    await Swal.fire(
      "Actualizado",
      "Estado actualizado correctamente.",
      "success",
    );
    cargarIncidencias();
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "No se pudo actualizar el estado.", "error");
  }
}

function mapEstado(estado) {
  switch (estado) {
    case "ABIERTO":
      return {
        key: "pendiente",
        label: "Pendiente",
        badge: "status-pendiente",
      };
    case "EN_PROGRESO":
      return {
        key: "revision",
        label: "En Revisión",
        badge: "status-revision",
      };
    case "RESUELTO":
      return { key: "resuelta", label: "Resuelta", badge: "status-resuelta" };
    case "CERRADO":
      return {
        key: "rechazada",
        label: "Rechazada",
        badge: "status-rechazada",
      };
    default:
      return {
        key: "pendiente",
        label: "Pendiente",
        badge: "status-pendiente",
      };
  }
}

function normalizarCategoria(categoria) {
  const texto = (categoria || "otros").toString().trim().toLowerCase();
  if (texto.includes("manten")) return "mantenimiento";
  if (texto.includes("ruido")) return "ruido";
  if (texto.includes("limpieza")) return "limpieza";
  if (texto.includes("seguridad")) return "seguridad";
  return "otros";
}

function filtrarPorFecha(fecha, tipo) {
  const fechaReporte = new Date(fecha);
  const ahora = new Date();
  const diferencia = ahora - fechaReporte;
  const unDia = 1000 * 60 * 60 * 24;

  if (tipo === "today") {
    return fechaReporte.toDateString() === ahora.toDateString();
  }
  if (tipo === "week") {
    return diferencia <= unDia * 7;
  }
  if (tipo === "month") {
    return diferencia <= unDia * 30;
  }
  if (tipo === "older") {
    return diferencia > unDia * 30;
  }
  return true;
}

function formatearFecha(fecha, conHora = false) {
  const opciones = conHora
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" };
  try {
    return new Date(fecha).toLocaleString("es-VE", opciones);
  } catch (error) {
    return fecha;
  }
}
