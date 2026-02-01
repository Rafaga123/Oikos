let activities = [];
let currentActivityId = null;

document.addEventListener('DOMContentLoaded', function() {
    // 1. Carga de datos
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
    
    // Inicializar contadores
    updateCharCounter('titleCounter', 0, 100);
    updateCharCounter('descCounter', 0, 500);
});

// --- INICIALIZACIÓN DE UI (SIDEBAR Y DROPDOWNS) ---
$(document).ready(function() {
    // Dropdowns
    $('.ui.dropdown').dropdown();

    // Sidebar
    $('.ui.sidebar').sidebar({ 
        context: $('.pusher'), 
        transition: 'overlay',
        dimPage: false
    });

    $('#sidebar-toggle').click(function() {
        $('.ui.sidebar').sidebar('toggle');
    });
});

// ==========================================
//  LÓGICA DE API (CRUD)
// ==========================================

async function loadActivities() {
    const token = localStorage.getItem('token');
    const listContainer = document.getElementById('activitiesList');
    
    // Loader
    if(listContainer) listContainer.innerHTML = '<div class="ui active centered inline loader" style="margin-top: 50px;"></div>';

    try {
        const res = await fetch('http://localhost:3000/api/actividades', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if(res.ok) {
            const data = await res.json();
            
            // Mapeo Backend -> Frontend
            activities = data.map(a => ({
                id: a.id,
                title: a.titulo,
                type: a.tipo,
                area: a.area,
                date: a.fecha.split('T')[0], 
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
            showMessage(currentActivityId ? 'Actividad actualizada' : 'Actividad creada', 'success');
            loadActivities(); 
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
            showMessage(`Estado actualizado: ${getStatusLabel(newStatus)}`, 'success');
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

    const typeFilter = document.getElementById('filterType').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const areaFilter = document.getElementById('filterArea').value;
    const dateFilter = document.getElementById('filterDate').value;
    
    let filtered = activities;
    
    if (typeFilter !== 'all') filtered = filtered.filter(a => a.type === typeFilter);
    if (statusFilter !== 'all') filtered = filtered.filter(a => a.status === statusFilter);
    if (areaFilter !== 'all') filtered = filtered.filter(a => a.area === areaFilter);
    if (dateFilter) filtered = filtered.filter(a => a.date === dateFilter);
    
    filtered.sort((a, b) => new Date(a.date + 'T' + a.startTime) - new Date(b.date + 'T' + b.startTime));

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="no-results" style="text-align:center; padding:30px; color:#777;">
                <i class="calendar times icon" style="font-size: 3em; margin-bottom: 15px;"></i>
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
            </div>
            
            <div class="activity-actions">
                <button class="btn btn-small btn-primary" onclick="viewActivity(${activity.id})"><i class="eye icon"></i> Ver</button>
                <button class="btn btn-small btn-success" onclick="confirmActivity(${activity.id})" 
                    ${activity.status === 'confirmed' || activity.status === 'cancelled' ? 'disabled' : ''}><i class="check icon"></i></button>
                <button class="btn btn-small btn-warning" onclick="editActivity(${activity.id})" 
                    ${activity.status === 'cancelled' ? 'disabled' : ''}><i class="edit icon"></i></button>
                <button class="btn btn-small btn-danger" onclick="cancelActivity(${activity.id})" 
                    ${activity.status === 'cancelled' ? 'disabled' : ''}><i class="times icon"></i></button>
            </div>
        </div>
    `).join('');
}

function editActivity(id) {
    const activityId = id || currentActivityId;
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    
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
    
    document.getElementById('activityDetails').innerHTML = `
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

// --- ESTADÍSTICAS Y UTILS ---

function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    
    setText('total-activities', activities.length);
    setText('pending-activities', activities.filter(a => a.status === 'pending').length);
    setText('today-activities', activities.filter(a => a.date === today).length);
    
    setText('stat-meetings', activities.filter(a => a.type === 'meeting').length);
    setText('stat-reservations', activities.filter(a => a.type === 'reservation').length);
    setText('stat-activities', activities.filter(a => a.type === 'activity').length);
    setText('stat-maintenance', activities.filter(a => a.type === 'maintenance').length);
}

function filterActivities(filter = null) {
    if (filter === 'all') {
        setVal('filterType', 'all');
        setVal('filterStatus', 'all');
        setVal('filterArea', 'all');
        setVal('filterDate', '');
    } else if (filter === 'pending') {
        setVal('filterStatus', 'pending');
    } else if (filter === 'today') {
        setVal('filterDate', new Date().toISOString().split('T')[0]);
    }
    renderActivities();
}

function filterByDate() { renderActivities(); }
function clearDateFilter() {
    document.getElementById('filterDate').value = '';
    renderActivities();
}

function openModal(type) {
    if(type === 'newActivity') {
        resetForm();
        document.getElementById('newActivityModal').classList.add('active');
    }
}

function closeModal(type) {
    document.getElementById(type + 'Modal').classList.remove('active');
}

function resetForm() {
    document.getElementById('activityForm').reset();
    document.getElementById('activityDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('activityStatus').value = 'pending';
    currentActivityId = null;
}

function updateCharCounter(id, len, max) {
    const el = document.getElementById(id);
    if(el) el.textContent = `${len}/${max}`;
}

function setText(id, text) {
    const el = document.getElementById(id);
    if(el) el.textContent = text;
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if(el) el.value = val;
}

// --- ETIQUETAS Y FORMATO ---

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
    const offset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + offset);
    return adjustedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function showMessage(message, type = 'info') {
    const div = document.createElement('div');
    div.style.cssText = `position: fixed; top: 100px; right: 20px; padding: 15px 25px; border-radius: 8px; color: white; font-weight: 500; z-index: 9999; opacity: 0; transition: 0.3s; background: ${type === 'success' ? '#00b09b' : '#4facfe'}; box-shadow: 0 4px 15px rgba(0,0,0,0.2);`;
    div.textContent = message;
    document.body.appendChild(div);
    requestAnimationFrame(() => div.style.opacity = '1');
    setTimeout(() => { div.style.opacity = '0'; setTimeout(() => div.remove(), 300); }, 3000);
}