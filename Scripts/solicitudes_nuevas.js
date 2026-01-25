$(document).ready(function() {
            // Inicializar componentes
            $('.ui.dropdown').dropdown();
            $('.ui.search').search({
                source: [],
                searchFields: ['nombre', 'email', 'apartamento'],
                fields: {
                    title: 'nombre',
                    description: 'email'
                },
                onSelect: function(result) {
                    // Implementar búsqueda
                }
            });
            
            // Inicializar modales
            $('#detail-modal').modal();
            $('#action-modal').modal();
            
             // Sidebar toggle 
            $('#sidebar-toggle').click(function() {
                $('.ui.sidebar').sidebar('toggle');
            });
            
            // Para pantallas grandes, mostrar sidebar como fijo
            if ($(window).width() > 768) {
                $('.ui.sidebar').addClass('hide');
                $('.ui.sidebar').sidebar({
                    context: $('.pusher'),
                    transition: 'overlay'
                });
            }
            // Datos de ejemplo (simulando base de datos)
            let solicitudes = [
                {
                    id: 1,
                    nombre: "María González",
                    email: "maria.gonzalez@email.com",
                    telefono: "+1 234 567 8900",
                    apartamento: "A-402",
                    tipo: "Familiar",
                    fechaSolicitud: "2025-03-15",
                    estado: "pending",
                    documentos: ["identificacion.pdf", "recibo_luz.pdf", "referencias.pdf"],
                    miembros: 3,
                    observaciones: "Familia con dos niños pequeños",
                    foto: "https://randomuser.me/api/portraits/women/32.jpg"
                },
                {
                    id: 2,
                    nombre: "Carlos Rodríguez",
                    email: "carlos.rodriguez@email.com",
                    telefono: "+1 234 567 8901",
                    apartamento: "B-201",
                    tipo: "Individual",
                    fechaSolicitud: "2025-03-14",
                    estado: "approved",
                    documentos: ["identificacion.pdf", "contrato_trabajo.pdf"],
                    miembros: 1,
                    observaciones: "Profesional soltero",
                    foto: "https://randomuser.me/api/portraits/men/42.jpg",
                    fechaAprobacion: "2025-03-16",
                    aprobadoPor: "Admin Principal"
                },
                {
                    id: 3,
                    nombre: "Ana Martínez",
                    email: "ana.martinez@email.com",
                    telefono: "+1 234 567 8902",
                    apartamento: "C-103",
                    tipo: "Familiar",
                    fechaSolicitud: "2025-03-13",
                    estado: "rejected",
                    documentos: ["identificacion.pdf", "recibo_agua.pdf"],
                    miembros: 4,
                    observaciones: "Documentación incompleta",
                    foto: "https://randomuser.me/api/portraits/women/44.jpg",
                    fechaRechazo: "2025-03-15",
                    motivoRechazo: "Falta documentación financiera"
                },
                {
                    id: 4,
                    nombre: "Jorge López",
                    email: "jorge.lopez@email.com",
                    telefono: "+1 234 567 8903",
                    apartamento: "D-305",
                    tipo: "Individual",
                    fechaSolicitud: "2025-03-12",
                    estado: "pending",
                    documentos: ["identificacion.pdf", "estado_cuenta.pdf"],
                    miembros: 1,
                    observaciones: "Estudiante universitario",
                    foto: "https://randomuser.me/api/portraits/men/33.jpg"
                },
                {
                    id: 5,
                    nombre: "Laura Sánchez",
                    email: "laura.sanchez@email.com",
                    telefono: "+1 234 567 8904",
                    apartamento: "A-105",
                    tipo: "Familiar",
                    fechaSolicitud: "2025-03-11",
                    estado: "pending",
                    documentos: ["identificacion.pdf", "referencias.pdf", "recibo_luz.pdf"],
                    miembros: 2,
                    observaciones: "Pareja joven",
                    foto: "https://randomuser.me/api/portraits/women/65.jpg"
                }
            ];
            
            let currentFilter = 'all';
            let currentSolicitudId = null;
            
            // Cargar solicitudes
            function loadSolicitudes() {
                const list = $('#solicitudes-list');
                list.empty();
                
                // Filtrar solicitudes
                let filteredSolicitudes = solicitudes;
                if (currentFilter !== 'all') {
                    filteredSolicitudes = solicitudes.filter(s => s.estado === currentFilter);
                }
                
                // Actualizar estadísticas
                updateStats();
                
                if (filteredSolicitudes.length === 0) {
                    list.html(`
                        <div class="empty-state">
                            <i class="clipboard check icon"></i>
                            <h3>No hay solicitudes</h3>
                            <p>No se encontraron solicitudes con el filtro aplicado</p>
                        </div>
                    `);
                    return;
                }
                
                // Mostrar solicitudes
                filteredSolicitudes.forEach(solicitud => {
                    const estadoTexto = {
                        'pending': 'Pendiente',
                        'approved': 'Aprobada',
                        'rejected': 'Rechazada'
                    }[solicitud.estado];
                    
                    const estadoClass = {
                        'pending': 'status-pending',
                        'approved': 'status-approved',
                        'rejected': 'status-rejected'
                    }[solicitud.estado];
                    
                    const fecha = new Date(solicitud.fechaSolicitud).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    });
                    
                    const solicitudElement = `
                        <div class="solicitud-item ${solicitud.estado}" data-id="${solicitud.id}">
                            <div class="solicitud-header">
                                <div class="solicitud-info">
                                    <div class="solicitud-name">
                                        ${solicitud.nombre}
                                        <span class="ui tiny label">${solicitud.tipo}</span>
                                    </div>
                                    <div class="solicitud-meta">
                                        <i class="envelope icon"></i> ${solicitud.email} • 
                                        <i class="building icon"></i> ${solicitud.apartamento} • 
                                        <i class="calendar icon"></i> ${fecha}
                                    </div>
                                </div>
                                <div class="solicitud-status ${estadoClass}">
                                    ${estadoTexto}
                                </div>
                            </div>
                            
                            <div class="solicitud-details">
                                <div class="detail-item">
                                    <i class="phone icon"></i>
                                    <span class="detail-label">Teléfono:</span>
                                    <span class="detail-value">${solicitud.telefono}</span>
                                </div>
                                <div class="detail-item">
                                    <i class="users icon"></i>
                                    <span class="detail-label">Miembros:</span>
                                    <span class="detail-value">${solicitud.miembros} persona${solicitud.miembros !== 1 ? 's' : ''}</span>
                                </div>
                                <div class="detail-item">
                                    <i class="file icon"></i>
                                    <span class="detail-label">Documentos:</span>
                                    <span class="detail-value">${solicitud.documentos.length} archivo${solicitud.documentos.length !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                            
                            <div class="solicitud-actions">
                                <button class="ui primary button view-details" data-id="${solicitud.id}">
                                    <i class="eye icon"></i>
                                    Ver Detalles
                                </button>
                                
                                ${solicitud.estado === 'pending' ? `
                                    <button class="ui green button approve-btn" data-id="${solicitud.id}">
                                        <i class="check icon"></i>
                                        Aprobar
                                    </button>
                                    <button class="ui red button reject-btn" data-id="${solicitud.id}">
                                        <i class="times icon"></i>
                                        Rechazar
                                    </button>
                                ` : ''}
                                
                                ${solicitud.estado === 'approved' ? `
                                    <button class="ui teal button">
                                        <i class="user plus icon"></i>
                                        Crear Cuenta
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                    
                    list.append(solicitudElement);
                });
                
                // Agregar eventos
                $('.view-details').click(function() {
                    const id = $(this).data('id');
                    showSolicitudDetails(id);
                });
                
                $('.approve-btn').click(function() {
                    const id = $(this).data('id');
                    confirmAction(id, 'approve');
                });
                
                $('.reject-btn').click(function() {
                    const id = $(this).data('id');
                    confirmAction(id, 'reject');
                });
            }
            
            // Actualizar estadísticas
            function updateStats() {
                $('#total-solicitudes').text(solicitudes.length);
                $('#pending-solicitudes').text(solicitudes.filter(s => s.estado === 'pending').length);
                $('#approved-solicitudes').text(solicitudes.filter(s => s.estado === 'approved').length);
                $('#rejected-solicitudes').text(solicitudes.filter(s => s.estado === 'rejected').length);
            }
            
            // Mostrar detalles de solicitud
            function showSolicitudDetails(id) {
                const solicitud = solicitudes.find(s => s.id === id);
                if (!solicitud) return;
                
                const fecha = new Date(solicitud.fechaSolicitud).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
                
                $('#modal-header').html(`
                    <i class="user icon"></i>
                    ${solicitud.nombre}
                    <div class="ui horizontal label ${solicitud.estado === 'pending' ? 'yellow' : solicitud.estado === 'approved' ? 'green' : 'red'}">
                        ${solicitud.estado === 'pending' ? 'Pendiente' : solicitud.estado === 'approved' ? 'Aprobada' : 'Rechazada'}
                    </div>
                `);
                
                $('#modal-content').html(`
                    <div class="ui centered grid">
                        <div class="six wide column">
                            <img src="${solicitud.foto}" class="user-photo" alt="${solicitud.nombre}">
                        </div>
                        <div class="ten wide column">
                            <div class="ui list">
                                <div class="item">
                                    <i class="user icon"></i>
                                    <div class="content">
                                        <div class="header">Nombre completo</div>
                                        <div class="description">${solicitud.nombre}</div>
                                    </div>
                                </div>
                                <div class="item">
                                    <i class="envelope icon"></i>
                                    <div class="content">
                                        <div class="header">Email</div>
                                        <div class="description">${solicitud.email}</div>
                                    </div>
                                </div>
                                <div class="item">
                                    <i class="phone icon"></i>
                                    <div class="content">
                                        <div class="header">Teléfono</div>
                                        <div class="description">${solicitud.telefono}</div>
                                    </div>
                                </div>
                                <div class="item">
                                    <i class="building icon"></i>
                                    <div class="content">
                                        <div class="header">Apartamento solicitado</div>
                                        <div class="description">${solicitud.apartamento}</div>
                                    </div>
                                </div>
                                <div class="item">
                                    <i class="users icon"></i>
                                    <div class="content">
                                        <div class="header">Miembros en la familia</div>
                                        <div class="description">${solicitud.miembros} persona${solicitud.miembros !== 1 ? 's' : ''}</div>
                                    </div>
                                </div>
                                <div class="item">
                                    <i class="calendar icon"></i>
                                    <div class="content">
                                        <div class="header">Fecha de solicitud</div>
                                        <div class="description">${fecha}</div>
                                    </div>
                                </div>
                                ${solicitud.observaciones ? `
                                <div class="item">
                                    <i class="sticky note icon"></i>
                                    <div class="content">
                                        <div class="header">Observaciones</div>
                                        <div class="description">${solicitud.observaciones}</div>
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="ui divider"></div>
                    
                    <h4 class="ui header">
                        <i class="file icon"></i>
                        Documentos adjuntos
                    </h4>
                    
                    <div class="docs-preview">
                        ${solicitud.documentos.map((doc, index) => `
                            <div class="doc-item">
                                <i class="file pdf icon" style="font-size: 2rem; color: #db2828;"></i>
                                <div style="margin-top: 10px; font-weight: 600;">${doc}</div>
                                <button class="ui basic small button" style="margin-top: 10px;">
                                    <i class="download icon"></i> Descargar
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    
                    ${solicitud.estado !== 'pending' ? `
                    <div class="timeline">
                        <h4 class="ui header">
                            <i class="history icon"></i>
                            Historial de la solicitud
                        </h4>
                        
                        <div class="timeline-item">
                            <div class="timeline-date">${fecha}</div>
                            <div class="timeline-content">Solicitud enviada por ${solicitud.nombre}</div>
                        </div>
                        
                        ${solicitud.estado === 'approved' ? `
                            <div class="timeline-item">
                                <div class="timeline-date">${new Date(solicitud.fechaAprobacion).toLocaleDateString('es-ES')}</div>
                                <div class="timeline-content">Solicitud aprobada por ${solicitud.aprobadoPor}</div>
                            </div>
                        ` : ''}
                        
                        ${solicitud.estado === 'rejected' ? `
                            <div class="timeline-item">
                                <div class="timeline-date">${new Date(solicitud.fechaRechazo).toLocaleDateString('es-ES')}</div>
                                <div class="timeline-content">
                                    Solicitud rechazada
                                    ${solicitud.motivoRechazo ? `<br><strong>Motivo:</strong> ${solicitud.motivoRechazo}` : ''}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    ` : ''}
                `);
                
                // Configurar acciones del modal
                $('#modal-actions').html(`
                    <div class="ui button cancel-modal">
                        Cerrar
                    </div>
                    ${solicitud.estado === 'pending' ? `
                    <div class="ui green button approve-from-modal" data-id="${solicitud.id}">
                        <i class="check icon"></i> Aprobar
                    </div>
                    <div class="ui red button reject-from-modal" data-id="${solicitud.id}">
                        <i class="times icon"></i> Rechazar
                    </div>
                    ` : ''}
                `);
                
                // Eventos de los botones del modal
                $('.cancel-modal').click(function() {
                    $('#detail-modal').modal('hide');
                });
                
                $('.approve-from-modal').click(function() {
                    const id = $(this).data('id');
                    $('#detail-modal').modal('hide');
                    setTimeout(() => confirmAction(id, 'approve'), 300);
                });
                
                $('.reject-from-modal').click(function() {
                    const id = $(this).data('id');
                    $('#detail-modal').modal('hide');
                    setTimeout(() => confirmAction(id, 'reject'), 300);
                });
                
                $('#detail-modal').modal('show');
            }
            
            // Confirmar acción (aprobar/rechazar)
            function confirmAction(id, action) {
                currentSolicitudId = id;
                const solicitud = solicitudes.find(s => s.id === id);
                
                if (action === 'approve') {
                    $('#action-modal-header').text('Confirmar Aprobación');
                    $('#action-message').text(`¿Estás seguro de aprobar la solicitud de ${solicitud.nombre} para el apartamento ${solicitud.apartamento}?`);
                    
                    $('.approve-action').show();
                    $('.reject-action').hide();
                    $('.confirm-action').hide();
                    $('#rejection-form').hide();
                } else {
                    $('#action-modal-header').text('Confirmar Rechazo');
                    $('#action-message').text(`¿Estás seguro de rechazar la solicitud de ${solicitud.nombre}?`);
                    
                    $('.approve-action').hide();
                    $('.reject-action').show();
                    $('.confirm-action').hide();
                    $('#rejection-form').show();
                }
                
                $('#action-modal').modal('show');
            }
            
            // Aprobar solicitud
            $('.approve-action').click(function() {
                const id = currentSolicitudId;
                const index = solicitudes.findIndex(s => s.id === id);
                
                if (index !== -1) {
                    solicitudes[index].estado = 'approved';
                    solicitudes[index].fechaAprobacion = new Date().toISOString().split('T')[0];
                    solicitudes[index].aprobadoPor = 'Gestor Actual';
                    
                    showNotification('Solicitud aprobada exitosamente', 'success');
                    loadSolicitudes();
                    $('#action-modal').modal('hide');
                }
            });
            
            // Rechazar solicitud (mostrar formulario)
            $('.reject-action').click(function() {
                $('#action-message').text('Por favor, especifica el motivo del rechazo:');
                $('.approve-action').hide();
                $('.reject-action').hide();
                $('.confirm-action').show();
            });
            
            // Confirmar rechazo
            $('.confirm-action').click(function() {
                const id = currentSolicitudId;
                const motivo = $('#rejection-reason').val().trim();
                const index = solicitudes.findIndex(s => s.id === id);
                
                if (index !== -1) {
                    solicitudes[index].estado = 'rejected';
                    solicitudes[index].fechaRechazo = new Date().toISOString().split('T')[0];
                    solicitudes[index].motivoRechazo = motivo || 'Sin motivo especificado';
                    
                    $('#rejection-reason').val('');
                    showNotification('Solicitud rechazada exitosamente', 'error');
                    loadSolicitudes();
                    $('#action-modal').modal('hide');
                }
            });
            
            // Cancelar acción
            $('.cancel-action').click(function() {
                $('#action-modal').modal('hide');
                $('#rejection-reason').val('');
            });
            
            // Filtros
            $('.filter-btn').click(function() {
                $('.filter-btn').removeClass('active');
                $(this).addClass('active');
                currentFilter = $(this).data('filter');
                loadSolicitudes();
            });
            
            // Botón exportar
            $('#export-btn').click(function() {
                // Aquí iría la lógica para exportar
                showNotification('Exportando datos...', 'info');
            });
            
            // Mostrar notificación
            function showNotification(message, type) {
                let icon = 'info circle';
                let color = 'blue';
                
                if (type === 'success') {
                    icon = 'check circle';
                    color = 'green';
                } else if (type === 'error') {
                    icon = 'times circle';
                    color = 'red';
                } else if (type === 'warning') {
                    icon = 'exclamation circle';
                    color = 'yellow';
                }
                
                $('body').toast({
                    class: color,
                    title: type === 'success' ? 'Éxito' : type === 'error' ? 'Error' : 'Información',
                    message: message,
                    showIcon: icon,
                    position: 'top right',
                    displayTime: 4000
                });
            }
            
            // Cargar inicialmente
            loadSolicitudes();
        });