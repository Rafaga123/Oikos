let solicitudes = [];
let currentFilters = { estado: 'all', categoria: 'all', fecha: 'all' };

$(document).ready(function() {
    $('.ui.dropdown').dropdown();
    $('#sidebar-toggle').click(() => $('.ui.sidebar').sidebar('toggle'));

    loadRequestsFromAPI(); // Cargar datos

    // Filtros
    $('#status-filter').change(function() { currentFilters.estado = $(this).val(); renderRequests(); });
    $('#category-filter').change(function() { currentFilters.categoria = $(this).val(); renderRequests(); });
    $('#date-filter').change(function() { currentFilters.fecha = $(this).val(); renderRequests(); });
    
    $('#reset-filters').click(function() {
        $('.ui.dropdown').dropdown('restore defaults');
        currentFilters = { estado: 'all', categoria: 'all', fecha: 'all' };
        renderRequests();
    });
});

async function loadRequestsFromAPI() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:3000/api/gestor/incidencias', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Error API');
        const data = await res.json();
        
        solicitudes = data.map(inc => ({
            id: inc.id,
            titulo: inc.titulo,
            contenido: inc.descripcion,
            categoria: inc.categoria,       // Dato real de BD
            importancia: inc.importancia,   // Dato real de BD
            estado: mapEstadoBD(inc.estado), 
            fecha: inc.fecha_reporte,
            habitante: `${inc.usuario.primer_nombre} ${inc.usuario.primer_apellido}`,
            apartamento: inc.usuario.numero_casa || 'N/A'
        }));

        updateStats();
        renderRequests();
    } catch (error) {
        console.error(error);
        $('#requests-list').html('<div class="ui message red">Error cargando datos</div>');
    }
}

function mapEstadoBD(estadoBD) {
    if (estadoBD === 'ABIERTO') return 'pendiente';
    if (estadoBD === 'EN_PROGRESO') return 'revision';
    if (estadoBD === 'RESUELTO') return 'resuelta';
    if (estadoBD === 'CERRADO') return 'rechazada';
    return 'pendiente';
}

function renderRequests() {
    const list = $('#requests-list');
    list.empty();
    
    // Filtrado (Igual que antes)
    let filtered = solicitudes.filter(s => {
        if (currentFilters.estado !== 'all' && s.estado !== currentFilters.estado) return false;
        if (currentFilters.categoria !== 'all' && s.categoria !== currentFilters.categoria) return false;
        return true; 
    });

    $('#requests-count').text(`${filtered.length} solicitudes`);

    if (filtered.length === 0) {
        list.html('<div class="empty-state"><h3>No hay solicitudes</h3></div>');
        return;
    }

    filtered.forEach(sol => {
        const fechaFmt = new Date(sol.fecha).toLocaleDateString();
        const labelEstado = getStatusLabel(sol.estado);
        // Colores para importancia
        const colorImp = sol.importancia === 'Alto' ? 'red' : (sol.importancia === 'Medio' ? 'yellow' : 'green');
        
        const html = `
            <div class="request-item ${sol.estado}">
                <div class="request-header">
                    <div class="request-title">
                        ${sol.titulo} 
                        <div class="ui horizontal label tiny">${sol.categoria}</div>
                    </div>
                    <div>
                        <span class="ui ${colorImp} label tiny">${sol.importancia}</span>
                        <span class="status-badge status-${sol.estado}">${labelEstado}</span>
                    </div>
                </div>
                
                <div class="request-content" style="margin-top: 10px; font-size: 1.1em;">
                    ${sol.contenido}
                </div>
                
                <div class="request-meta">
                    <div class="request-info">
                        <div><i class="user icon"></i> ${sol.habitante} (${sol.apartamento})</div>
                        <div><i class="calendar icon"></i> ${fechaFmt}</div>
                    </div>
                    
                    <div class="request-actions">
                        ${renderActionButtons(sol)}
                    </div>
                </div>
            </div>
        `;
        list.append(html);
    });
}

function renderActionButtons(sol) {
    let btns = '';
    
    // 1. Botón "En Revisión" (Solo si está pendiente)
    if (sol.estado === 'pendiente') {
        btns += `
            <button class="ui orange basic button" onclick="changeStatus(${sol.id}, 'EN_PROGRESO')">
                <i class="hourglass half icon"></i> En Revisión
            </button>
        `;
    }

    // 2. Botones Resolver/Rechazar (Si no está finalizada)
    if (sol.estado !== 'resuelta' && sol.estado !== 'rechazada') {
        btns += `
            <button class="ui green basic button" onclick="changeStatus(${sol.id}, 'RESUELTO')">
                <i class="check icon"></i> Resolver
            </button>
            <button class="ui red basic button" onclick="changeStatus(${sol.id}, 'CERRADO')">
                <i class="times icon"></i> Rechazar
            </button>
        `;
    }
    return btns;
}

function getStatusLabel(estado) {
    if (estado === 'pendiente') return 'Pendiente';
    if (estado === 'revision') return 'En Revisión';
    if (estado === 'resuelta') return 'Resuelta';
    if (estado === 'rechazada') return 'Rechazada';
    return estado;
}

function updateStats() {
    $('#pending-count').text(solicitudes.filter(s => s.estado === 'pendiente').length);
    $('#review-count').text(solicitudes.filter(s => s.estado === 'revision').length);
    $('#resolved-count').text(solicitudes.filter(s => s.estado === 'resuelta').length);
    $('#rejected-count').text(solicitudes.filter(s => s.estado === 'rechazada').length);
}

window.changeStatus = async function(id, nuevoEstadoBD) {
    try {
        const token = localStorage.getItem('token');
        
        // 1. ACTUALIZACIÓN VISUAL INMEDIATA (Optimista)
        // Buscamos la solicitud en nuestra lista local y la actualizamos
        const index = solicitudes.findIndex(s => s.id === id);
        if (index !== -1) {
            // Convertimos el estado de BD (EN_PROGRESO) al visual (revision)
            solicitudes[index].estado = mapEstadoBD(nuevoEstadoBD);
            
            // Si el estado no es 'ABIERTO', marcamos como revisado automáticamente
            if (nuevoEstadoBD !== 'ABIERTO') {
                solicitudes[index].revisado = true;
            }
            
            // Repintamos la lista inmediatamente para que el usuario vea el cambio
            renderRequests();
            updateStats();
        }

        // 2. ACTUALIZACIÓN EN SEGUNDO PLANO (Base de Datos)
        const res = await fetch(`http://localhost:3000/api/gestor/incidencias/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ estado: nuevoEstadoBD })
        });

        if (res.ok) {
            // Todo salió bien en el servidor, mostramos éxito
            $('body').toast({
                class: 'success',
                message: `Estado actualizado correctamente`
            });
        } else {
            // Si falló el servidor, revertimos el cambio visual y avisamos
            Swal.fire({
                icon: 'error',
                title: 'No se pudo guardar',
                text: 'Hubo un error al guardar en la base de datos.'
            });
            loadRequestsFromAPI(); // Recargamos para volver al estado real
        }

    } catch(e) { 
        console.error(e);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No pudimos comunicarnos con el servidor. Intenta de nuevo.'
        });
    }
};