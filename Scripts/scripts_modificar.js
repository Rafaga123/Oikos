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
    
    // Ajustar al cargar
    adjustSidebarForScreenSize();
    
    // Ajustar al cambiar tamaño de ventana
    $(window).resize(function() {
        adjustSidebarForScreenSize();
    });
    
    // Hacer que las tarjetas sean clickeables
    $('.link-card').click(function() {
        const button = $(this).find('.button');
        if (button.length) {
            const targetPage = button.data('href');
            if (targetPage) {
                button.addClass('loading');
                setTimeout(() => {
                    button.removeClass('loading');
                    window.location.href = targetPage;
                }, 800);
            }
        }
    });
    
    // Datos de ejemplo (simulando base de datos)
    let reglas = [
        {
            id: 1,
            titulo: "Horario de la piscina",
            contenido: "La piscina estará disponible de 8:00 AM a 8:00 PM. Fuera de este horario, el acceso está prohibido por motivos de seguridad.",
            categoria: "areas-comunes",
            fechaCreacion: "2025-01-15",
            ultimaModificacion: "2025-03-10"
        },
        {
            id: 2,
            titulo: "Uso del estacionamiento",
            contenido: "Cada apartamento tiene asignado un espacio de estacionamiento. No se permite estacionar en lugares asignados a otros residentes.",
            categoria: "areas-comunes",
            fechaCreacion: "2025-01-20",
            ultimaModificacion: "2025-02-28"
        }
    ];
    
});

// Datos de ejemplo (simulando base de datos)
        let reglas = [
            {
                id: 1,
                titulo: "Horario de la piscina",
                contenido: "La piscina estará disponible de 8:00 AM a 8:00 PM. Fuera de este horario, el acceso está prohibido por motivos de seguridad.",
                categoria: "areas-comunes",
                fechaCreacion: "2025-01-15",
                ultimaModificacion: "2025-03-10"
            },
            {
                id: 2,
                titulo: "Uso del estacionamiento",
                contenido: "Cada apartamento tiene asignado un espacio de estacionamiento. No se permite estacionar en lugares asignados a otros residentes.",
                categoria: "areas-comunes",
                fechaCreacion: "2025-01-20",
                ultimaModificacion: "2025-02-28"
            },
            {
                id: 3,
                titulo: "Reglas de convivencia",
                contenido: "Se debe mantener el nivel de ruido bajo después de las 10:00 PM. Los eventos sociales deben ser notificados con 48 horas de anticipación.",
                categoria: "convivencia",
                fechaCreacion: "2025-01-10",
                ultimaModificacion: "2025-03-05"
            },
            {
                id: 4,
                titulo: "Seguridad en áreas comunes",
                contenido: "Todas las puertas de acceso deben permanecer cerradas. Reportar cualquier persona sospechosa al administrador inmediatamente.",
                categoria: "seguridad",
                fechaCreacion: "2025-02-01",
                ultimaModificacion: "2025-02-01"
            }
        ];

        let editingRuleId = null;
        let currentCategoryFilter = 'all';
        let ruleToDelete = null;

        $(document).ready(function() {
            // Inicializar componentes
            $('.ui.dropdown').dropdown();
            $('#confirm-modal').modal();
            
            // Cargar reglas
            loadRules();
            
            // Agregar nueva regla
            $('#add-rule-btn, #first-rule-btn').click(function() {
                showRuleEditor();
            });
            
            // Cancelar edición
            $('#cancel-edit-btn').click(function() {
                hideRuleEditor();
                resetForm();
            });
            
            // Guardar regla
            $('#rule-form').submit(function(e) {
                e.preventDefault();
                saveRule();
            });
            
            // Filtro de categorías
            $('.category-filter-btn').click(function() {
                $('.category-filter-btn').removeClass('active');
                $(this).addClass('active');
                currentCategoryFilter = $(this).data('category');
                loadRules();
            });
            
        
        function loadRules() {
            const rulesList = $('#rules-list');
            rulesList.empty();
            
            // Filtrar reglas por categoría
            let filteredRules = reglas;
            if (currentCategoryFilter !== 'all') {
                filteredRules = reglas.filter(rule => rule.categoria === currentCategoryFilter);
            }
            
            // Actualizar contador
            $('#rules-count').text(`${filteredRules.length} regla${filteredRules.length !== 1 ? 's' : ''} configurada${filteredRules.length !== 1 ? 's' : ''}`);
            
            if (filteredRules.length === 0) {
                // Mostrar estado vacío
                if (currentCategoryFilter === 'all') {
                    rulesList.html(`
                        <div class="empty-state">
                            <i class="law icon"></i>
                            <h3>No hay reglas configuradas</h3>
                            <p>Comienza agregando la primera regla del condominio</p>
                            <button class="ui primary button" id="first-rule-btn">
                                <i class="plus icon"></i>
                                Crear Primera Regla
                            </button>
                        </div>
                    `);
                    $('#first-rule-btn').click(showRuleEditor);
                } else {
                    rulesList.html(`
                        <div class="empty-state">
                            <i class="filter icon"></i>
                            <h3>No hay reglas en esta categoría</h3>
                            <p>No se encontraron reglas en la categoría seleccionada</p>
                            <button class="ui button" onclick="$('.category-filter-btn[data-category=\"all\"]').click()">
                                Ver todas las reglas
                            </button>
                        </div>
                    `);
                }
                return;
            }
            
            // Mostrar reglas
            filteredRules.forEach((regla, index) => {
                const categoriaNombre = getCategoryName(regla.categoria);
                const categoriaColor = getCategoryColor(regla.categoria);
                
                const ruleElement = `
                    <div class="rule-item" data-id="${regla.id}">
                        <div class="rule-header">
                            <div style="display: flex; align-items: center;">
                                <div class="rule-number">${index + 1}</div>
                                <div class="rule-title">${regla.titulo}</div>
                            </div>
                        </div>
                        
                        <div class="rule-category" style="background: ${categoriaColor.background}; color: ${categoriaColor.text};">
                            ${categoriaNombre}
                        </div>
                        
                        <div class="rule-content">${regla.contenido}</div>
                        
                        <div class="ui small text" style="color: #7f8c8d; margin-bottom: 15px;">
                            <i class="calendar icon"></i>
                            Última modificación: ${formatDate(regla.ultimaModificacion)}
                        </div>
                        
                        <div class="rule-actions">
                            <button class="ui primary basic button edit-rule-btn" data-id="${regla.id}">
                                <i class="edit icon"></i>
                                Editar
                            </button>
                            <button class="ui red basic button delete-rule-btn" data-id="${regla.id}">
                                <i class="trash icon"></i>
                                Eliminar
                            </button>
                        </div>
                    </div>
                `;
                
                rulesList.append(ruleElement);
            });
            
            // Agregar eventos a los botones de editar y eliminar
            $('.edit-rule-btn').click(function() {
                const id = $(this).data('id');
                editRule(id);
            });
            
            $('.delete-rule-btn').click(function() {
                const id = $(this).data('id');
                confirmDeleteRule(id);
            });
        }
        
        function showRuleEditor() {
            $('#rule-editor').slideDown();
            $('html, body').animate({
                scrollTop: $('#rule-editor').offset().top - 100
            }, 500);
        }
        
        function hideRuleEditor() {
            $('#rule-editor').slideUp();
        }
        
        function resetForm() {
            $('#rule-form')[0].reset();
            $('#rule-id').val('');
            $('#editor-title').text('Nueva Regla');
            editingRuleId = null;
        }
        
        function editRule(id) {
            const regla = reglas.find(r => r.id === id);
            if (regla) {
                editingRuleId = id;
                $('#rule-id').val(regla.id);
                $('#rule-title').val(regla.titulo);
                $('#rule-category').val(regla.categoria);
                $('#rule-content').val(regla.contenido);
                $('#editor-title').text('Editar Regla');
                
                // Resaltar la regla que se está editando
                $('.rule-item').removeClass('editing');
                $(`.rule-item[data-id="${id}"]`).addClass('editing');
                
                showRuleEditor();
            }
        }
        
        function saveRule() {
            const titulo = $('#rule-title').val().trim();
            const categoria = $('#rule-category').val();
            const contenido = $('#rule-content').val().trim();
            
            if (!titulo || !categoria || !contenido) {
                showAlert('Por favor, completa todos los campos', 'error');
                return;
            }
            
            const today = new Date().toISOString().split('T')[0];
            
            if (editingRuleId) {
                // Editar regla existente
                const index = reglas.findIndex(r => r.id === editingRuleId);
                if (index !== -1) {
                    reglas[index] = {
                        ...reglas[index],
                        titulo,
                        categoria,
                        contenido,
                        ultimaModificacion: today
                    };
                    showAlert('Regla actualizada exitosamente', 'success');
                }
            } else {
                // Agregar nueva regla
                const newId = reglas.length > 0 ? Math.max(...reglas.map(r => r.id)) + 1 : 1;
                reglas.push({
                    id: newId,
                    titulo,
                    categoria,
                    contenido,
                    fechaCreacion: today,
                    ultimaModificacion: today
                });
                showAlert('Regla agregada exitosamente', 'success');
            }
            
            loadRules();
            hideRuleEditor();
            resetForm();
            
            // Quitar resaltado de edición
            $('.rule-item').removeClass('editing');
        }
        
        function confirmDeleteRule(id) {
            ruleToDelete = id;
            const regla = reglas.find(r => r.id === id);
            if (regla) {
                $('#confirm-modal .header').text(`Eliminar: ${regla.titulo}`);
                $('#confirm-modal').modal('show');
            }
        }
        
        // Configurar botón de confirmación de eliminación
        $('#confirm-delete-btn').click(function() {
            if (ruleToDelete) {
                reglas = reglas.filter(r => r.id !== ruleToDelete);
                loadRules();
                showAlert('Regla eliminada exitosamente', 'success');
                $('#confirm-modal').modal('hide');
                ruleToDelete = null;
            }
        });
        
        function getCategoryName(category) {
            const categories = {
                'convivencia': 'Convivencia',
                'areas-comunes': 'Áreas Comunes',
                'seguridad': 'Seguridad',
                'administrativo': 'Administrativo',
                'otros': 'Otros'
            };
            return categories[category] || 'Sin categoría';
        }
        
        function getCategoryColor(category) {
            const colors = {
                'convivencia': { background: '#e8f5e9', text: '#2e7d32' },
                'areas-comunes': { background: '#e3f2fd', text: '#1565c0' },
                'seguridad': { background: '#fff3e0', text: '#ef6c00' },
                'administrativo': { background: '#f3e5f5', text: '#7b1fa2' },
                'otros': { background: '#f5f5f5', text: '#424242' }
            };
            return colors[category] || { background: '#f5f5f5', text: '#424242' };
        }
        
        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        }
        
        function showAlert(message, type) {
            // Crear alerta temporal
            let alertClass = 'blue';
            if (type === 'success') alertClass = 'green';
            if (type === 'error') alertClass = 'red';
            
            const alert = $(`
                <div class="ui ${alertClass} message" style="position: fixed; top: 70px; right: 20px; z-index: 9999; max-width: 400px;">
                    <i class="close icon"></i>
                    <div class="header">
                        ${type === 'success' ? 'Éxito' : type === 'error' ? 'Error' : 'Información'}
                    </div>
                    <p>${message}</p>
                </div>
            `);
            
            $('body').append(alert);
            alert.transition('fade up');
            
            // Configurar cierre
            alert.find('.close.icon').click(function() {
                alert.transition('fade up');
            });
            
            // Ocultar automáticamente después de 4 segundos
            setTimeout(() => {
                alert.transition('fade up');
            }, 4000);
        }

        });
