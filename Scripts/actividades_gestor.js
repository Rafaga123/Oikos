let activities = [];
let currentActivityId = null;

document.addEventListener('DOMContentLoaded', function() {
    // 1. Inicialización
    loadActivities();
    
    // Configurar inputs de fecha (mínimo hoy)
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('activityDate');
    const filterInput = document.getElementById('filterDate');
    
    if(dateInput) dateInput.min = today;
    if(filterInput) filterInput.min = today;
    
    // Hora por defecto (hora siguiente)
    const now = new Date();
    const startTime = `${String(now.getHours() + 1).padStart(2, '0')}:00`;
    const endTime = `${String((now.getHours() + 3) % 24).padStart(2, '0')}:00`;
    
    const startInput = document.getElementById('startTime');
    const endInput = document.getElementById('endTime');
    
    if(startInput) startInput.value = startTime;
    if(endInput) endInput.value = endTime;
    
    // Inicializar contadores de caracteres
    updateCharCounter('titleCounter', 0, 100);
    updateCharCounter('descCounter', 0, 500);
});

// ==========================================
//  LÓGICA DE API (CRUD)
// ==========================================

async function loadActivities() {
    const token = localStorage.getItem('token');
    const listContainer = document.getElementById('activitiesList');
    
    // Loader mientras carga
    if(listContainer) listContainer.innerHTML = '<div class="ui active centered inline loader" style="margin-top: 50px;"></div>';

    try {
        const res = await fetch('http://localhost:3000/api/actividades', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if(res.ok) {
            const data = await res.json();
            
            // Mapeo de datos (Backend -> Frontend)
            activities = data.map(a => ({
                id: a.id,
                title: a.titulo,
                type: a.tipo,
                area: a.area,
                date: a.fecha.split('T')[0], // Convertir ISO a YYYY-MM-DD
                startTime: a.hora_inicio,
                endTime: a.hora_fin,
                description: a.descripcion,
                organizer: a.organizador,
                contact: a.contacto,
                maxParticipants: a.max_participantes,
                status: a.estado,
                createdAt: a.fecha_creacion
            }));
            
            renderActivities();
            updateStats();
            loadUpcomingActivities();
        } else {
            console.error('Error al cargar actividades');
            if(listContainer) listContainer.innerHTML = '<div class="ui error message">No se pudieron cargar los datos.</div>';
        }
    } catch(e) { 
        console.error(e);
        if(listContainer) listContainer.innerHTML = '<div class="ui error message">Error de conexión.</div>';
    }
}

async function saveActivity() {
    const form = document.getElementById('activityForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    
    if (startTime >= endTime) {
        alert('La hora de fin debe ser mayor que la hora de inicio');
        return;
    }
    
    const payload = {
        title: document.getElementById('activityTitle').value.trim(),
        type: document.getElementById('activityType').value,
        area: document.getElementById('activityArea').value,
        date: document.getElementById('activityDate').value,
        startTime: startTime,
        endTime: endTime,
        description: document.getElementById('activityDescription').value.trim(),
        organizer: document.getElementById('organizerName').value.trim(),
        contact: document.getElementById('organizerContact').value.trim() || null,
        maxParticipants: document.getElementById('maxParticipants').value,
        status: document.getElementById('activityStatus').value
    };

    const token = localStorage.getItem('token');
    const url = currentActivityId 
        ? `http://localhost:3000/api/gestor/actividades/${currentActivityId}`
        : 'http://localhost:3000/api/gestor/actividades';
    const method = currentActivityId ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if(res.ok) {
            closeModal('newActivity');
            
            // Simulación de notificación si el check está activo
            if (document.getElementById('sendNotification').checked) {
                showMessage('Notificación enviada a los residentes', 'info');
            } else {
                showMessage('Actividad guardada exitosamente', 'success');
            }
            
            loadActivities(); // Recargar datos
        } else {
            alert('Error al guardar la actividad');
        }
    } catch(e) { console.error(e); }
}

async function updateStatusActivity(id, newStatus) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`http://localhost:3000/api/gestor/actividades/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus })
        });
        
        if(res.ok) {
            closeModal('viewActivity');
            const label = getStatusLabel(newStatus);
            showMessage(`Estado actualizado a: ${label}`, 'success');
            loadActivities();
        } else {
            alert('No se pudo actualizar el estado');
        }
    } catch(e) { console.error(e); }
}

function confirmActivity(id) {
    const activityId = id || currentActivityId;
    if(confirm('¿Confirmar esta actividad?')) {
        updateStatusActivity(activityId, 'confirmed');
    }
}

function cancelActivity(id) {
    const activityId = id || currentActivityId;
    if(confirm('¿Cancelar esta actividad?')) {
        updateStatusActivity(activityId, 'cancelled');
    }
}

// ==========================================
//  LÓGICA DE INTERFAZ (UI)
// ==========================================

function renderActivities() {
    const listContainer = document.getElementById('activitiesList');
    if(!listContainer) return;

    // Obtener valores de filtros
    const typeFilter = document.getElementById('filterType').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const areaFilter = document.getElementById('filterArea').value;
    const dateFilter = document.getElementById('filterDate').value;
    
    let filtered = activities;
    
    // Aplicar filtros
    if (typeFilter !== 'all') filtered = filtered.filter(a => a.type === typeFilter);
    if (statusFilter !== 'all') filtered = filtered.filter(a => a.status === statusFilter);
    if (areaFilter !== 'all') filtered = filtered.filter(a => a.area === areaFilter);
    if (dateFilter) filtered = filtered.filter(a => a.date === dateFilter);
    
    // Ordenar por fecha y hora
    filtered.sort((a, b) => new Date(a.date + 'T' + a.startTime) - new Date(b.date + 'T' + b.startTime));

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="no-results">
                <i class="calendar times icon" style="font-size: 3em; margin-bottom: 15px; color: #ccc;"></i>
                <h3>No hay actividades</h3>
                <p>No se encontraron resultados con los filtros actuales.</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = filtered.map(activity => `
        <div class="activity-card ${activity.status}" data-id="${activity.id}">
            <div class="activity-header">
                <h3 class="activity-title">${activity.title}</h3>
                <div style="display: flex; gap: 5px;">
                    <span class="activity-badge badge-${activity.type}">${getTypeLabel(activity.type)}</span>
                    <span class="activity-badge badge-${activity.status}">${getStatusLabel(activity.status)}</span>
                </div>
            </div>
            
            <div class="activity-details">
                ${activity.description}
            </div>
            
            <div class="activity-meta">
                <div><i class="calendar icon"></i> ${formatDate(activity.date)}</div>
                <div><i class="clock icon"></i> ${activity.startTime} - ${activity.endTime}</div>
                <div><i class="map marker alternate icon"></i> ${getAreaLabel(activity.area)}</div>
                <div><i class="user icon"></i> ${activity.organizer}</div>
                ${activity.maxParticipants ? `<div><i class="users icon"></i> Máx: ${activity.maxParticipants}</div>` : ''}
            </div>
            
            <div class="activity-actions">
                <button class="btn btn-small btn-primary" onclick="viewActivity(${activity.id})">
                    <i class="eye icon"></i> Ver
                </button>
                <button class="btn btn-small btn-success" onclick="confirmActivity(${activity.id})" 
                    ${activity.status === 'confirmed' || activity.status === 'cancelled' ? 'disabled' : ''}>
                    <i class="check icon"></i>
                </button>
                <button class="btn btn-small btn-warning" onclick="editActivity(${activity.id})" 
                    ${activity.status === 'cancelled' ? 'disabled' : ''}>
                    <i class="edit icon"></i>
                </button>
                <button class="btn btn-small btn-danger" onclick="cancelActivity(${activity.id})" 
                    ${activity.status === 'cancelled' ? 'disabled' : ''}>
                    <i class="times icon"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function editActivity(id) {
    const activityId = id || currentActivityId;
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    
    // Llenar formulario
    document.getElementById('activityTitle').value = activity.title;
    document.getElementById('activityType').value = activity.type;
    document.getElementById('activityArea').value = activity.area;
    document.getElementById('activityDate').value = activity.date;
    document.getElementById('startTime').value = activity.startTime;
    document.getElementById('endTime').value = activity.endTime;
    document.getElementById('activityDescription').value = activity.description;
    document.getElementById('organizerName').value = activity.organizer;
    document.getElementById('organizerContact').value = activity.contact || '';
    document.getElementById('maxParticipants').value = activity.maxParticipants || '';
    document.getElementById('activityStatus').value = activity.status;
    
    // Actualizar contadores
    updateCharCounter('titleCounter', activity.title.length, 100);
    updateCharCounter('descCounter', activity.description.length, 500);
    
    currentActivityId = activityId;
    closeModal('viewActivity');
    openModal('newActivity');
}

function viewActivity(id) {
    const activity = activities.find(a => a.id === id);
    if (!activity) return;
    
    currentActivityId = id;
    document.getElementById('viewActivityTitle').textContent = activity.title;
    
    const detailsContainer = document.getElementById('activityDetails');
    detailsContainer.innerHTML = `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                <span class="activity-badge badge-${activity.type}">${getTypeLabel(activity.type)}</span>
                <span class="activity-badge badge-${activity.status}">${getStatusLabel(activity.status)}</span>
                <span class="activity-badge badge-status"><i class="map marker icon"></i> ${getAreaLabel(activity.area)}</span>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin-top: 0; color: #333;"><i class="align left icon"></i> Descripción</h4>
                <p style="color: #666; white-space: pre-wrap;">${activity.description}</p>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <div>
                    <h4 style="margin-top: 0; color: #333;"><i class="calendar icon"></i> Fecha y Hora</h4>
                    <p style="color: #666;">
                        <strong>Fecha:</strong> ${formatDate(activity.date)}<br>
                        <strong>Hora:</strong> ${activity.startTime} - ${activity.endTime}
                    </p>
                </div>
                <div>
                    <h4 style="margin-top: 0; color: #333;"><i class="user icon"></i> Organizador</h4>
                    <p style="color: #666;">
                        <strong>Nombre:</strong> ${activity.organizer}<br>
                        ${activity.contact ? `<strong>Contacto:</strong> ${activity.contact}` : ''}
                    </p>
                </div>
            </div>
        </div>
    `;
    
    // Configurar estado de botones en el modal
    const confirmBtn = document.getElementById('confirmBtn');
    const editBtn = document.getElementById('editBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    if (confirmBtn) {
        confirmBtn.disabled = activity.status === 'confirmed' || activity.status === 'cancelled';
        if (activity.status === 'confirmed') confirmBtn.innerHTML = '<i class="check icon"></i> Confirmada';
        else confirmBtn.innerHTML = '<i class="check icon"></i> Confirmar';
    }
    
    if (editBtn) editBtn.disabled = activity.status === 'cancelled';
    if (cancelBtn) cancelBtn.disabled = activity.status === 'cancelled';

    document.getElementById('viewActivityModal').classList.add('active');
}

// --- ESTADÍSTICAS Y SIDEBAR ---

function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    
    const total = activities.length;
    const pending = activities.filter(a => a.status === 'pending').length;
    const todayActivities = activities.filter(a => a.date === today).length;
    
    const meetings = activities.filter(a => a.type === 'meeting').length;
    const reservations = activities.filter(a => a.type === 'reservation').length;
    const communityActs = activities.filter(a => a.type === 'activity').length;
    const maintenance = activities.filter(a => a.type === 'maintenance').length;
    
    setText('total-activities', total);
    setText('pending-activities', pending);
    setText('today-activities', todayActivities);
    
    setText('stat-meetings', meetings);
    setText('stat-reservations', reservations);
    setText('stat-activities', communityActs);
    setText('stat-maintenance', maintenance);
}

function loadUpcomingActivities() {
    // Esta función se puede expandir si tienes un sidebar derecho de "Próximas"
    // Actualmente el HTML no lo muestra explícitamente, pero lo dejamos listo.
}

// --- UTILS ---

function filterActivities(filter = null) {
    if (filter === 'all') {
        setVal('filterType', 'all');
        setVal('filterStatus', 'all');
        setVal('filterArea', 'all');
        setVal('filterDate', '');
    } else if (filter === 'pending') {
        setVal('filterStatus', 'pending');
    } else if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        setVal('filterDate', today);
        setVal('filterType', 'all');
        setVal('filterStatus', 'all');
        setVal('filterArea', 'all');
    }
    renderActivities();
}

function filterByDate() { renderActivities(); }
function clearDateFilter() {
    document.getElementById('filterDate').value = '';
    renderActivities();
}

function openModal(modalType) {
    if(modalType === 'newActivity') {
        resetForm();
        document.getElementById('newActivityModal').classList.add('active');
    }
}

function closeModal(modalType) {
    document.getElementById(modalType + 'Modal').classList.remove('active');
}

function resetForm() {
    document.getElementById('activityForm').reset();
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('activityDate').value = today;
    
    document.getElementById('activityStatus').value = 'pending';
    document.getElementById('sendNotification').checked = true;
    
    currentActivityId = null;
    updateCharCounter('titleCounter', 0, 100);
    updateCharCounter('descCounter', 0, 500);
}

function updateCharCounter(id, len, max) {
    const el = document.getElementById(id);
    if(el) {
        el.textContent = `${len}/${max}`;
        el.classList.toggle('warning', len > max * 0.9);
        el.classList.toggle('danger', len > max);
    }
}

function setText(id, text) {
    const el = document.getElementById(id);
    if(el) el.textContent = text;
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if(el) el.value = val;
}

// --- LABELS & FORMATS ---

function getTypeLabel(type) {
    const types = { 'meeting': 'Reunión', 'reservation': 'Reserva', 'activity': 'Actividad', 'maintenance': 'Mantenimiento' };
    return types[type] || type;
}

function getStatusLabel(status) {
    const statuses = { 'pending': 'Pendiente', 'confirmed': 'Confirmado', 'cancelled': 'Cancelado' };
    return statuses[status] || status;
}

function getAreaLabel(area) {
    const areas = { 
        'salon': 'Salón Social', 'parque': 'Parque Infantil', 'piscina': 'Piscina', 
        'gym': 'Gimnasio', 'bbq': 'Zona BBQ', 'estacionamiento': 'Estacionamiento', 
        'jardin': 'Jardín', 'otro': 'Otro' 
    };
    return areas[area] || area;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    // Ajuste de zona horaria para evitar que salga un día antes
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    
    return adjustedDate.toLocaleDateString('es-ES', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
}

function showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
        position: fixed; top: 100px; right: 20px; padding: 15px 25px;
        border-radius: 8px; color: white; font-weight: 500; z-index: 9999;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: all 0.3s ease; opacity: 0;
    `;
    
    switch(type) {
        case 'success': messageEl.style.background = 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)'; break;
        case 'warning': messageEl.style.background = 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)'; break;
        case 'danger': messageEl.style.background = 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)'; break;
        default: messageEl.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    }
    
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    // Animar
    requestAnimationFrame(() => { messageEl.style.opacity = '1'; });
    setTimeout(() => {
        messageEl.style.opacity = '0';
        setTimeout(() => document.body.removeChild(messageEl), 300);
    }, 3000);
}