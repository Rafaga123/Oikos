// Variables globales
        let activities = [];
        let currentActivityId = null;

        // Datos de ejemplo mejorados
        const sampleActivities = [
            {
                id: 1,
                title: "Reunión de Junta Directiva",
                type: "meeting",
                area: "salon",
                date: new Date().toISOString().split('T')[0], // Hoy
                startTime: "18:00",
                endTime: "20:00",
                description: "Reunión mensual de la junta directiva para discutir temas importantes de la comunidad.",
                organizer: "Junta Directiva",
                contact: "junta@comunidad.com",
                maxParticipants: 15,
                status: "confirmed",
                createdBy: "Gestor",
                createdAt: new Date().toISOString().split('T')[0]
            },
            {
                id: 2,
                title: "Cumpleaños de Juan en el Parque",
                type: "reservation",
                area: "parque",
                date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Mañana
                startTime: "15:00",
                endTime: "19:00",
                description: "Celebración de cumpleaños infantil para Juan (5 años). Se requiere confirmación.",
                organizer: "Familia Pérez",
                contact: "0414-1234567",
                maxParticipants: 25,
                status: "pending",
                createdBy: "Gestor",
                createdAt: new Date().toISOString().split('T')[0]
            },
            {
                id: 3,
                title: "Mantenimiento de Piscina",
                type: "maintenance",
                area: "piscina",
                date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Pasado mañana
                startTime: "08:00",
                endTime: "12:00",
                description: "Limpieza y mantenimiento programado de la piscina comunitaria.",
                organizer: "Departamento de Mantenimiento",
                contact: "mantenimiento@comunidad.com",
                maxParticipants: 3,
                status: "confirmed",
                createdBy: "Gestor",
                createdAt: new Date().toISOString().split('T')[0]
            },
            {
                id: 4,
                title: "Clase de Yoga Matutina",
                type: "activity",
                area: "gym",
                date: new Date(Date.now() + 259200000).toISOString().split('T')[0], // En 3 días
                startTime: "07:00",
                endTime: "08:30",
                description: "Clase de yoga matutina para residentes. Traer su propia colchoneta.",
                organizer: "Instructor María",
                contact: "yoga@comunidad.com",
                maxParticipants: 20,
                status: "pending",
                createdBy: "Gestor",
                createdAt: new Date().toISOString().split('T')[0]
            },
            {
                id: 5,
                title: "Asamblea General de Residentes",
                type: "meeting",
                area: "salon",
                date: new Date(Date.now() + 345600000).toISOString().split('T')[0], // En 4 días
                startTime: "17:00",
                endTime: "19:30",
                description: "Asamblea general para discutir el presupuesto anual y elección de comités.",
                organizer: "Junta Directiva",
                contact: "asamblea@comunidad.com",
                maxParticipants: 100,
                status: "confirmed",
                createdBy: "Gestor",
                createdAt: new Date().toISOString().split('T')[0]
            }
        ];

        // Inicialización
        document.addEventListener('DOMContentLoaded', function() {
            loadActivities();
            updateStats();
            loadUpcomingActivities();
            
            // Configurar fecha mínima en el formulario (hoy)
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('activityDate').min = today;
            document.getElementById('filterDate').min = today;
            
            // Configurar hora por defecto
            const now = new Date();
            const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const endTime = `${String((now.getHours() + 2) % 24).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            document.getElementById('startTime').value = startTime;
            document.getElementById('endTime').value = endTime;
            
            // Inicializar contadores de caracteres
            updateCharCounter('titleCounter', 0, 100);
            updateCharCounter('descCounter', 0, 500);
            
            console.log('Sistema de Gestión de Actividades cargado correctamente');
        });

        // Cargar actividades
        function loadActivities() {
            const savedActivities = localStorage.getItem('communityActivities');
            if (savedActivities) {
                activities = JSON.parse(savedActivities);
            } else {
                activities = [...sampleActivities];
                saveActivities();
            }
            
            renderActivities();
        }

        // Guardar actividades en localStorage
        function saveActivities() {
            localStorage.setItem('communityActivities', JSON.stringify(activities));
            renderActivities();
            updateStats();
            loadUpcomingActivities();
        }

        // Renderizar lista de actividades
        function renderActivities() {
            const listContainer = document.getElementById('activitiesList');
            const typeFilter = document.getElementById('filterType').value;
            const statusFilter = document.getElementById('filterStatus').value;
            const areaFilter = document.getElementById('filterArea').value;
            const dateFilter = document.getElementById('filterDate').value;
            
            let filteredActivities = activities;
            
            // Aplicar filtros
            if (typeFilter !== 'all') {
                filteredActivities = filteredActivities.filter(a => a.type === typeFilter);
            }
            
            if (statusFilter !== 'all') {
                filteredActivities = filteredActivities.filter(a => a.status === statusFilter);
            }
            
            if (areaFilter !== 'all') {
                filteredActivities = filteredActivities.filter(a => a.area === areaFilter);
            }
            
            if (dateFilter) {
                filteredActivities = filteredActivities.filter(a => a.date === dateFilter);
            }
            
            // Ordenar por fecha (más cercanas primero)
            filteredActivities.sort((a, b) => new Date(a.date + 'T' + a.startTime) - new Date(b.date + 'T' + b.startTime));
            
            if (filteredActivities.length === 0) {
                listContainer.innerHTML = `
                    <div class="no-results">
                        <i class="calendar times icon"></i>
                        <h3>No hay actividades</h3>
                        <p>No se encontraron actividades con los filtros seleccionados.</p>
                        <button class="btn btn-primary" onclick="openModal('newActivity')">
                            <i class="plus icon"></i> Crear primera actividad
                        </button>
                    </div>
                `;
                return;
            }
            
            listContainer.innerHTML = filteredActivities.map(activity => `
                <div class="activity-card ${activity.status}" data-id="${activity.id}">
                    <div class="activity-header">
                        <h3 class="activity-title">${activity.title}</h3>
                        <div style="display: flex; gap: 5px;">
                            <span class="activity-badge badge-${activity.type}">
                                ${getTypeLabel(activity.type)}
                            </span>
                            <span class="activity-badge badge-${activity.status}">
                                ${getStatusLabel(activity.status)}
                            </span>
                        </div>
                    </div>
                    
                    <div class="activity-details">
                        ${activity.description}
                    </div>
                    
                    <div class="activity-meta">
                        <div>
                            <i class="calendar icon"></i>
                            ${formatDate(activity.date)} 
                        </div>
                        <div>
                            <i class="clock icon"></i>
                            ${activity.startTime} - ${activity.endTime}
                        </div>
                        <div>
                            <i class="map marker alternate icon"></i>
                            ${getAreaLabel(activity.area)}
                        </div>
                        <div>
                            <i class="user icon"></i>
                            ${activity.organizer}
                        </div>
                        ${activity.maxParticipants ? `
                            <div>
                                <i class="users icon"></i>
                                Máx. ${activity.maxParticipants} personas
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="activity-actions">
                        <button class="btn btn-small btn-primary" onclick="viewActivity(${activity.id})">
                            <i class="eye icon"></i> Ver Detalles
                        </button>
                        <button class="btn btn-small btn-success" onclick="confirmActivity(${activity.id})" ${activity.status === 'confirmed' || activity.status === 'cancelled' ? 'disabled' : ''}>
                            <i class="check icon"></i> Confirmar
                        </button>
                        <button class="btn btn-small btn-warning" onclick="editActivity(${activity.id})" ${activity.status === 'cancelled' ? 'disabled' : ''}>
                            <i class="edit icon"></i> Editar
                        </button>
                        <button class="btn btn-small btn-danger" onclick="cancelActivity(${activity.id})" ${activity.status === 'cancelled' ? 'disabled' : ''}>
                            <i class="times icon"></i> Cancelar
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Filtrar actividades
        function filterActivities(filter = null) {
            if (filter === 'all') {
                document.getElementById('filterType').value = 'all';
                document.getElementById('filterStatus').value = 'all';
                document.getElementById('filterArea').value = 'all';
                document.getElementById('filterDate').value = '';
            } else if (filter === 'pending') {
                document.getElementById('filterStatus').value = 'pending';
            } else if (filter === 'today') {
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('filterDate').value = today;
                document.getElementById('filterType').value = 'all';
                document.getElementById('filterStatus').value = 'all';
                document.getElementById('filterArea').value = 'all';
            }
            
            renderActivities();
        }

        // Filtrar por fecha específica
        function filterByDate() {
            renderActivities();
        }

        // Limpiar filtro de fecha
        function clearDateFilter() {
            document.getElementById('filterDate').value = '';
            renderActivities();
        }

        // Actualizar estadísticas
        function updateStats() {
            const today = new Date().toISOString().split('T')[0];
            
            const total = activities.length;
            const pending = activities.filter(a => a.status === 'pending').length;
            const todayActivities = activities.filter(a => a.date === today).length;
            
            // Estadísticas por tipo
            const meetings = activities.filter(a => a.type === 'meeting').length;
            const reservations = activities.filter(a => a.type === 'reservation').length;
            const communityActivities = activities.filter(a => a.type === 'activity').length;
            const maintenance = activities.filter(a => a.type === 'maintenance').length;
            
            document.getElementById('total-activities').textContent = total;
            document.getElementById('pending-activities').textContent = pending;
            document.getElementById('today-activities').textContent = todayActivities;
            
            document.getElementById('stat-meetings').textContent = meetings;
            document.getElementById('stat-reservations').textContent = reservations;
            document.getElementById('stat-activities').textContent = communityActivities;
            document.getElementById('stat-maintenance').textContent = maintenance;
        }

        // Cargar próximas actividades
        function loadUpcomingActivities() {
            const container = document.getElementById('upcomingActivities');
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            
            const upcoming = activities
                .filter(a => {
                    const activityDate = new Date(a.date);
                    return activityDate >= today && activityDate <= nextWeek && a.status !== 'cancelled';
                })
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 8); // Mostrar hasta 8 actividades
            
            if (upcoming.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #666;">
                        <i class="calendar times icon" style="font-size: 2rem; margin-bottom: 10px;"></i>
                        <p>No hay actividades próximas</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = upcoming.map(activity => `
                <div class="upcoming-item" onclick="viewActivity(${activity.id})">
                    <div class="upcoming-title">${activity.title}</div>
                    <div class="upcoming-meta">
                        <div><i class="calendar icon"></i> ${formatShortDate(activity.date)}</div>
                        <div><i class="clock icon"></i> ${activity.startTime}</div>
                        <div><i class="map marker icon"></i> ${getAreaLabel(activity.area)}</div>
                        <div>
                            <span class="activity-badge badge-${activity.status}" style="font-size: 0.7rem;">
                                ${getStatusLabel(activity.status)}
                            </span>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Abrir modal
        function openModal(modalType, activityId = null) {
            if (modalType === 'newActivity') {
                resetForm();
                document.getElementById('newActivityModal').classList.add('active');
            } else if (modalType === 'viewActivity' && activityId) {
                viewActivity(activityId);
            }
        }

        // Cerrar modal
        function closeModal(modalType) {
            if (modalType === 'newActivity') {
                document.getElementById('newActivityModal').classList.remove('active');
            } else if (modalType === 'viewActivity') {
                document.getElementById('viewActivityModal').classList.remove('active');
            }
        }

        // Ver actividad
        function viewActivity(id) {
            const activity = activities.find(a => a.id === id);
            if (!activity) return;
            
            currentActivityId = id;
            
            document.getElementById('viewActivityTitle').textContent = activity.title;
            
            const detailsContainer = document.getElementById('activityDetails');
            detailsContainer.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                        <span class="activity-badge badge-${activity.type}">
                            ${getTypeLabel(activity.type)}
                        </span>
                        <span class="activity-badge badge-${activity.status}">
                            ${getStatusLabel(activity.status)}
                        </span>
                        <span class="activity-badge badge-status">
                            <i class="map marker icon"></i> ${getAreaLabel(activity.area)}
                        </span>
                        ${activity.maxParticipants ? `
                            <span class="activity-badge badge-status">
                                <i class="users icon"></i> Máx. ${activity.maxParticipants} personas
                            </span>
                        ` : ''}
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin-top: 0; color: #333;">
                            <i class="align left icon"></i> Descripción
                        </h4>
                        <p style="color: #666; white-space: pre-wrap;">${activity.description}</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
                        <div>
                            <h4 style="margin-top: 0; color: #333;">
                                <i class="calendar icon"></i> Fecha y Hora
                            </h4>
                            <p style="color: #666;">
                                <strong>Fecha:</strong> ${formatDate(activity.date)}<br>
                                <strong>Hora:</strong> ${activity.startTime} - ${activity.endTime}<br>
                                <strong>Duración:</strong> ${calculateDuration(activity.startTime, activity.endTime)}
                            </p>
                        </div>
                        
                        <div>
                            <h4 style="margin-top: 0; color: #333;">
                                <i class="user icon"></i> Organizador
                            </h4>
                            <p style="color: #666;">
                                <strong>Nombre:</strong> ${activity.organizer}<br>
                                ${activity.contact ? `<strong>Contacto:</strong> ${activity.contact}` : ''}
                            </p>
                        </div>
                    </div>
                    
                    <div style="font-size: 0.9rem; color: #888; padding-top: 15px; border-top: 1px solid #f0f0f0;">
                        <div><i class="user circle icon"></i> <strong>Creado por:</strong> ${activity.createdBy}</div>
                        <div><i class="calendar plus icon"></i> <strong>Fecha de creación:</strong> ${formatDate(activity.createdAt)}</div>
                    </div>
                </div>
            `;
            
            // Actualizar estado de botones según el estado de la actividad
            const confirmBtn = document.getElementById('confirmBtn');
            const editBtn = document.getElementById('editBtn');
            const cancelBtn = document.getElementById('cancelBtn');
            
            if (activity.status === 'confirmed') {
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<i class="check icon"></i> Confirmada';
            } else if (activity.status === 'cancelled') {
                confirmBtn.disabled = true;
                editBtn.disabled = true;
                cancelBtn.disabled = true;
                cancelBtn.innerHTML = '<i class="times icon"></i> Cancelada';
            }
            
            document.getElementById('viewActivityModal').classList.add('active');
        }

        // Resetear formulario
        function resetForm() {
            document.getElementById('activityForm').reset();
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('activityDate').value = today;
            
            const now = new Date();
            const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const endTime = `${String((now.getHours() + 2) % 24).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            document.getElementById('startTime').value = startTime;
            document.getElementById('endTime').value = endTime;
            document.getElementById('activityStatus').value = 'pending';
            document.getElementById('sendNotification').checked = true;
            
            updateCharCounter('titleCounter', 0, 100);
            updateCharCounter('descCounter', 0, 500);
            
            currentActivityId = null;
        }

        // Guardar actividad
        function saveActivity() {
            const form = document.getElementById('activityForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            // Validar que la hora de fin sea mayor que la de inicio
            const startTime = document.getElementById('startTime').value;
            const endTime = document.getElementById('endTime').value;
            
            if (startTime >= endTime) {
                alert('La hora de fin debe ser mayor que la hora de inicio');
                return;
            }
            
            const activityData = {
                id: currentActivityId || activities.length > 0 ? Math.max(...activities.map(a => a.id)) + 1 : 1,
                title: document.getElementById('activityTitle').value.trim(),
                type: document.getElementById('activityType').value,
                area: document.getElementById('activityArea').value,
                date: document.getElementById('activityDate').value,
                startTime: startTime,
                endTime: endTime,
                description: document.getElementById('activityDescription').value.trim(),
                organizer: document.getElementById('organizerName').value.trim(),
                contact: document.getElementById('organizerContact').value.trim() || null,
                maxParticipants: document.getElementById('maxParticipants').value ? parseInt(document.getElementById('maxParticipants').value) : null,
                status: document.getElementById('activityStatus').value,
                createdBy: 'Gestor',
                createdAt: currentActivityId ? activities.find(a => a.id === currentActivityId).createdAt : new Date().toISOString().split('T')[0]
            };
            
            if (currentActivityId) {
                // Editar actividad existente
                const index = activities.findIndex(a => a.id === currentActivityId);
                if (index !== -1) {
                    activities[index] = activityData;
                }
            } else {
                // Nueva actividad
                activities.push(activityData);
            }
            
            // Enviar notificación si está marcado
            if (document.getElementById('sendNotification').checked) {
                sendNotification(activityData);
            }
            
            saveActivities();
            closeModal('newActivity');
            
            // Mostrar mensaje de éxito
            showMessage(`Actividad "${activityData.title}" ${currentActivityId ? 'actualizada' : 'creada'} exitosamente`, 'success');
        }

        // Editar actividad
        function editActivity(id = null) {
            const activityId = id || currentActivityId;
            if (!activityId) return;
            
            const activity = activities.find(a => a.id === activityId);
            if (!activity) return;
            
            // Cargar datos en el formulario
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

        // Confirmar actividad
        function confirmActivity(id = null) {
            const activityId = id || currentActivityId;
            if (!activityId) return;
            
            const activity = activities.find(a => a.id === activityId);
            if (!activity) return;
            
            if (confirm(`¿Confirmar la actividad "${activity.title}"?`)) {
                activity.status = 'confirmed';
                saveActivities();
                closeModal('viewActivity');
                showMessage(`Actividad "${activity.title}" confirmada exitosamente`, 'success');
            }
        }

        // Cancelar actividad
        function cancelActivity(id = null) {
            const activityId = id || currentActivityId;
            if (!activityId) return;
            
            const activity = activities.find(a => a.id === activityId);
            if (!activity) return;
            
            const reason = prompt(`¿Cancelar la actividad "${activity.title}"? (Opcional: Ingrese el motivo de la cancelación)`);
            if (reason !== null) {
                activity.status = 'cancelled';
                if (reason) {
                    activity.cancellationReason = reason;
                }
                saveActivities();
                closeModal('viewActivity');
                showMessage(`Actividad "${activity.title}" cancelada`, 'warning');
            }
        }

        // Enviar notificación (simulada)
        function sendNotification(activity) {
            console.log('Notificación enviada a residentes:', {
                to: 'residentes@comunidad.com',
                subject: `Nueva actividad: ${activity.title}`,
                message: `Se ha programado una nueva actividad:\n\n${activity.description}\n\nFecha: ${formatDate(activity.date)}\nHora: ${activity.startTime} - ${activity.endTime}\nLugar: ${getAreaLabel(activity.area)}\nOrganizador: ${activity.organizer}`
            });
            
            // Aquí iría el código real para enviar email/notificación push
            showMessage('Notificación enviada a los residentes', 'info');
        }

        // Funciones auxiliares
        function getTypeLabel(type) {
            const types = {
                'meeting': 'Reunión',
                'reservation': 'Reserva',
                'activity': 'Actividad',
                'maintenance': 'Mantenimiento'
            };
            return types[type] || type;
        }

        function getStatusLabel(status) {
            const statuses = {
                'pending': 'Pendiente',
                'confirmed': 'Confirmado',
                'cancelled': 'Cancelado'
            };
            return statuses[status] || status;
        }

        function getAreaLabel(area) {
            const areas = {
                'salon': 'Salón Social',
                'parque': 'Parque Infantil',
                'piscina': 'Piscina',
                'gym': 'Gimnasio',
                'bbq': 'Zona BBQ',
                'estacionamiento': 'Estacionamiento',
                'jardin': 'Jardín',
                'otro': 'Otro'
            };
            return areas[area] || area;
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        function formatShortDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                month: 'short',
                day: 'numeric'
            });
        }

        function calculateDuration(startTime, endTime) {
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);
            
            let hours = endHour - startHour;
            let minutes = endMinute - startMinute;
            
            if (minutes < 0) {
                hours--;
                minutes += 60;
            }
            
            if (hours < 0) {
                hours += 24;
            }
            
            if (hours === 0) {
                return `${minutes} minutos`;
            } else if (minutes === 0) {
                return `${hours} hora${hours !== 1 ? 's' : ''}`;
            } else {
                return `${hours} hora${hours !== 1 ? 's' : ''} y ${minutes} minutos`;
            }
        }

        function updateCharCounter(counterId, length, max) {
            const counter = document.getElementById(counterId);
            counter.textContent = `${length}/${max}`;
            counter.className = 'char-counter';
            
            if (length > max * 0.9) {
                counter.classList.add('warning');
            }
            if (length > max) {
                counter.classList.add('danger');
            }
        }

        function showMessage(message, type = 'info') {
            // Crear elemento de mensaje
            const messageEl = document.createElement('div');
            messageEl.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 3000;
                opacity: 0;
                transform: translateX(100px);
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            `;
            
            // Configurar color según tipo
            switch(type) {
                case 'success':
                    messageEl.style.background = 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)';
                    break;
                case 'warning':
                    messageEl.style.background = 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)';
                    break;
                case 'danger':
                    messageEl.style.background = 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)';
                    break;
                default:
                    messageEl.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
            }
            
            messageEl.textContent = message;
            document.body.appendChild(messageEl);
            
            // Animar entrada
            setTimeout(() => {
                messageEl.style.opacity = '1';
                messageEl.style.transform = 'translateX(0)';
            }, 10);
            
            // Ocultar después de 3 segundos
            setTimeout(() => {
                messageEl.style.opacity = '0';
                messageEl.style.transform = 'translateX(100px)';
                setTimeout(() => {
                    document.body.removeChild(messageEl);
                }, 300);
            }, 3000);
        }

         $(document).ready(function() {
    // Inicializar dropdowns
    $('.ui.dropdown').dropdown();
    
    // Inicializar sidebar de Semantic UI
    $('.ui.sidebar').sidebar({
        transition: 'overlay',
        mobileTransition: 'overlay',
        closable: true,
        onShow: function() {
            $('.pusher').addClass('dimmed');
        },
        onHide: function() {
            $('.pusher').removeClass('dimmed');
        }
    });
    
    // Controlar sidebar en móviles
    $('#sidebar-toggle').click(function(e) {
        e.preventDefault();
        $('.ui.sidebar').sidebar('toggle');
    });
    
    // Para pantallas grandes, forzar sidebar visible
    function adjustSidebarForScreenSize() {
        if ($(window).width() > 768) {
            // En desktop, mostrar sidebar siempre
            $('.ui.sidebar').sidebar('hide');
            $('.ui.sidebar').addClass('hide');
            $('.pusher').addClass('desktop-sidebar-visible');
        } else {
            // En mobile, ocultar sidebar
            $('.ui.sidebar').sidebar('hide');
            $('.ui.sidebar').removeClass('visible');
            $('.pusher').removeClass('desktop-sidebar-visible');
        }
    }
});