let solicitudes = []; // Aquí guardaremos los datos reales
let currentFilter = 'all';
let currentSolicitudId = null;

$(document).ready(function() {
    // 1. Inicializar componentes visuales
    $('.ui.dropdown').dropdown();
    $('#detail-modal').modal();
    $('#action-modal').modal();
    
    // Sidebar toggle
    $('#sidebar-toggle').click(() => $('.ui.sidebar').sidebar('toggle'));

    // 2. CARGAR DATOS REALES DEL BACKEND
    loadSolicitudes();

    // Eventos de botones (Igual que tenías, pero adaptado)
    $('.filter-btn').click(function() {
        $('.filter-btn').removeClass('active');
        $(this).addClass('active');
        currentFilter = $(this).data('filter');
        renderSolicitudes(); // Renderizar localmente sin volver a pedir a API
    });
});

async function loadSolicitudes() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:3000/api/gestor/solicitudes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Error al cargar');
        
        // Mapeamos los datos de la BD al formato que usa tu vista
        const data = await res.json();
        
        solicitudes = data.map(u => ({
            id: u.id,
            nombre: `${u.primer_nombre} ${u.primer_apellido}`,
            email: u.email,
            telefono: u.telefono || 'No registrado',
            apartamento: u.numero_casa || 'Sin asignar', // Mapeo de BD
            tipo: u.tipo_habitante || 'Otro',            // Mapeo de BD
            fechaSolicitud: u.fecha_registro,
            // Convertimos el estado de la BD (PENDIENTE, ACEPTADO, RECHAZADO) a tus clases CSS
            estado: mapEstadoBDtoFront(u.estado_solicitud), 
            foto: u.foto_perfil_url || '../Images/default.jpg'
        }));

        renderSolicitudes();

    } catch (error) {
        console.error(error);
        $('#solicitudes-list').html('<div class="ui message red">Error cargando solicitudes</div>');
    }
}

// Función auxiliar para traducir estados
function mapEstadoBDtoFront(estadoBD) {
    if (estadoBD === 'PENDIENTE') return 'pending';
    if (estadoBD === 'ACEPTADO') return 'approved';
    if (estadoBD === 'RECHAZADO') return 'rejected';
    return 'pending';
}

function renderSolicitudes() {
    const list = $('#solicitudes-list');
    list.empty();
    
    // Filtrar
    let filtered = solicitudes;
    if (currentFilter !== 'all') {
        filtered = solicitudes.filter(s => s.estado === currentFilter);
    }
    
    updateStats();

    if (filtered.length === 0) {
        list.html(`<div class="empty-state"><h3>No hay solicitudes</h3><p>No se encontraron registros.</p></div>`);
        return;
    }

    filtered.forEach(solicitud => {
        // Textos para mostrar
        const estadoLabel = { 'pending': 'Pendiente', 'approved': 'Aceptado', 'rejected': 'Rechazado' }[solicitud.estado];
        const fecha = new Date(solicitud.fechaSolicitud).toLocaleDateString();

        const html = `
            <div class="solicitud-item ${solicitud.estado}">
                <div class="solicitud-header">
                    <div class="solicitud-info">
                        <div class="solicitud-name">
                            ${solicitud.nombre}
                            <span class="ui tiny label">${solicitud.tipo}</span>
                        </div>
                        <div class="solicitud-meta">
                            <i class="building icon"></i> Casa: ${solicitud.apartamento} • 
                            <i class="calendar icon"></i> ${fecha}
                        </div>
                    </div>
                    <div class="solicitud-status status-${solicitud.estado}">
                        ${estadoLabel}
                    </div>
                </div>
                
                <div class="solicitud-details">
                    <div class="detail-item"><i class="phone icon"></i> ${solicitud.telefono}</div>
                    <div class="detail-item"><i class="envelope icon"></i> ${solicitud.email}</div>
                    
                    <div class="solicitud-actions" style="margin-top:15px;">
                        ${solicitud.estado === 'pending' ? `
                            <button class="ui green button approve-btn" onclick="openActionModal(${solicitud.id}, 'APROBAR')">
                                <i class="check icon"></i> Aprobar
                            </button>
                            <button class="ui red button reject-btn" onclick="openActionModal(${solicitud.id}, 'RECHAZAR')">
                                <i class="times icon"></i> Rechazar
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        list.append(html);
    });
}

function updateStats() {
    $('#total-solicitudes').text(solicitudes.length);
    $('#pending-solicitudes').text(solicitudes.filter(s => s.estado === 'pending').length);
    $('#approved-solicitudes').text(solicitudes.filter(s => s.estado === 'approved').length);
    $('#rejected-solicitudes').text(solicitudes.filter(s => s.estado === 'rejected').length);
}

// --- LÓGICA DE APROBACIÓN / RECHAZO ---

let accionPendiente = null; // Guardar qué vamos a hacer

window.openActionModal = function(id, accion) {
    currentSolicitudId = id;
    accionPendiente = accion;
    
    // Limpiar campos del modal
    $('#rejection-reason').val('');
    $('#rejection-form').hide();
    
    $('.approve-action').hide();
    $('.reject-action').hide();
    
    $('.confirm-action').show(); 
    
    if (accion === 'APROBAR') {
        $('#action-modal-header').text('Confirmar Aprobación');
        $('#action-message').text('¿Estás seguro de aceptar a este usuario en la comunidad?');
        $('.confirm-action').removeClass('red').addClass('green').html('<i class="check icon"></i> Confirmar Aprobación');
    } else {
        $('#action-modal-header').text('Rechazar Solicitud');
        $('#action-message').text('Indica el motivo del rechazo:');
        $('#rejection-form').show();
        $('.confirm-action').removeClass('green').addClass('red').html('<i class="times icon"></i> Confirmar Rechazo');
    }

    // Asignar el evento click
    $('.confirm-action').off('click').on('click', enviarRespuesta);
    
    // Mostrar el modal
    $('#action-modal').modal('show');
};

async function enviarRespuesta() {
    const token = localStorage.getItem('token');
    const motivo = $('#rejection-reason').val();

    // Si es rechazo, obligar motivo (opcional)
    if (accionPendiente === 'RECHAZAR' && !motivo) {
        alert('Por favor escribe un motivo.');
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/gestor/responder-solicitud', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                idUsuario: currentSolicitudId,
                accion: accionPendiente,
                motivo: motivo
            })
        });

        if (res.ok) {
            alert('Acción realizada con éxito');
            $('#action-modal').modal('hide');
            loadSolicitudes(); // Recargar lista
        } else {
            alert('Error al procesar la solicitud');
        }

    } catch (error) {
        console.error(error);
        alert('Error de conexión');
    }
}