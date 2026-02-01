// Script para manejar el sidebar y dropdowns
        $(document).ready(function() {
            // Inicializar dropdowns de Semantic UI
            $('.ui.dropdown').dropdown();
            
            // Manejar el sidebar
            $('#sidebar-toggle').click(function() {
                $('.ui.sidebar').sidebar('toggle');
            });
            
            // Inicializar sidebar
            $('.ui.sidebar').sidebar({
                context: $('.pusher'),
                transition: 'overlay'
            });
            
            // Filtrar encuestas
            $('#apply-filters').click(function() {
                const typeFilter = $('#filter-type').val();
                const statusFilter = $('#filter-status').val();
                
                $('.survey-card').each(function() {
                    const cardType = $(this).data('type');
                    const cardStatus = $(this).data('status');
                    
                    let show = true;
                    
                    if (typeFilter !== 'all' && cardType !== typeFilter) {
                        show = false;
                    }
                    
                    if (statusFilter !== 'all' && cardStatus !== statusFilter) {
                        show = false;
                    }
                    
                    if (show) {
                        $(this).show();
                    } else {
                        $(this).hide();
                    }
                });
            });
            
            // Restablecer filtros
            $('#reset-filters').click(function() {
                $('#filter-type').val('all');
                $('#filter-status').val('all');
                $('#sort-by').val('newest');
                
                $('.survey-card').show();
            });
            
            // Ordenar encuestas
            $('#sort-by').change(function() {
                const sortBy = $(this).val();
                const container = $('.surveys-container');
                const cards = container.children('.survey-card').toArray();
                
                cards.sort(function(a, b) {
                    const aTitle = $(a).find('.survey-title').text();
                    const bTitle = $(b).find('.survey-title').text();
                    const aResponses = parseInt($(a).find('.stat-value').first().text()) || 0;
                    const bResponses = parseInt($(b).find('.stat-value').first().text()) || 0;
                    
                    switch(sortBy) {
                        case 'name':
                            return aTitle.localeCompare(bTitle);
                        case 'responses':
                            return bResponses - aResponses;
                        case 'oldest':
                            // Simulación: asumimos que las primeras encuestas son más antiguas
                            return 0;
                        case 'newest':
                        default:
                            return 0;
                    }
                });
                
                container.empty();
                cards.forEach(card => container.append(card));
            });
            
            // Simular acciones de botones
            $('.view-details-btn').click(function() {
                const surveyId = $(this).data('survey');
                alert(`Mostrando detalles completos de la encuesta ${surveyId}. En una implementación real, esto cargaría una página con todos los resultados detallados.`);
            });
            
            $('.export-btn').click(function() {
                const surveyId = $(this).data('survey');
                alert(`Exportando resultados de la encuesta ${surveyId} a Excel. En una implementación real, esto generaría y descargaría un archivo Excel.`);
            });
            
            $('.comments-btn').click(function() {
                const surveyId = $(this).data('survey');
                alert(`Mostrando comentarios de la encuesta ${surveyId}. En una implementación real, esto abriría un modal con todos los comentarios.`);
            });
            
            $('.live-btn').click(function() {
                alert('Modo de visualización en tiempo real activado. Los resultados se actualizarán automáticamente a medida que lleguen nuevas respuestas.');
            });
            
            $('.preview-btn').click(function() {
                alert('Mostrando vista previa de la encuesta programada. En una implementación real, esto mostraría el formulario de encuesta.');
            });
            
            // Función para cerrar sesión
            window.cerrarSesion = function() {
                if (confirm('¿Está seguro de que desea cerrar sesión?')) {
                    alert('Sesión cerrada. Redirigiendo a la página de inicio...');
                    // En una implementación real: window.location.href = './login.html';
                }
            };
        });