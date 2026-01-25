
        $(document).ready(function() {
            // Inicializar componentes
            $('.ui.dropdown').dropdown();
            $('.ui.checkbox').checkbox();
            
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

            // Selector de tipo
            let selectedType = null;
            
            $('.type-card').click(function() {
                $('.type-card').removeClass('selected');
                $(this).addClass('selected');
                
                selectedType = $(this).data('type');
                
                // Mostrar formulario correspondiente
                $('.creation-form').removeClass('active');
                $(`#${selectedType}-form`).addClass('active');
                
                // Actualizar vista previa
                updatePreview();
            });
            
            // Manejo de opciones en encuestas
            let optionCount = 2;
            
            $('#add-option').click(function() {
                optionCount++;
                const newOption = `
                    <div class="option-item">
                        <input type="text" placeholder="Opción ${optionCount}" class="survey-option" required>
                        <button type="button" class="ui icon button remove-option">
                            <i class="minus icon"></i>
                        </button>
                    </div>
                `;
                $('#survey-options').append(newOption);
                
                // Habilitar botones de eliminar
                if (optionCount > 2) {
                    $('.remove-option').prop('disabled', false);
                }
            });
            
            // Eliminar opción
            $(document).on('click', '.remove-option', function() {
                if (optionCount > 2) {
                    $(this).closest('.option-item').remove();
                    optionCount--;
                    
                    // Renumerar opciones
                    $('.survey-option').each(function(index) {
                        $(this).attr('placeholder', `Opción ${index + 1}`);
                    });
                    
                    if (optionCount <= 2) {
                        $('.remove-option').prop('disabled', true);
                    }
                }
            });
            
            // Actualizar vista previa en tiempo real
            function updatePreview() {
                const preview = $('#preview-content');
                
                if (!selectedType) {
                    preview.html('<p class="ui center aligned text" style="color: #999;">Selecciona un tipo y completa el formulario para ver la vista previa</p>');
                    return;
                }
                
                if (selectedType === 'announcement') {
                    const title = $('#announcement-title').val() || '[Título del anuncio]';
                    const category = $('#announcement-category').val() || 'general';
                    const content = $('#announcement-content').val() || '[Contenido del anuncio]';
                    const priority = $('#announcement-priority').is(':checked');
                    
                    preview.html(`
                        <div class="announcement-preview">
                            <div class="ui ${priority ? 'red' : 'green'} ribbon label">${getCategoryName(category)}</div>
                            <h3 class="ui header">${title}</h3>
                            <div class="ui divider"></div>
                            <p>${content.replace(/\n/g, '<br>')}</p>
                            <div class="ui small text" style="color: #666; margin-top: 20px;">
                                <i class="calendar icon"></i> Publicado: ${new Date().toLocaleDateString('es-ES')}
                                ${priority ? '<span class="ui red horizontal label"><i class="exclamation circle icon"></i> ALTA PRIORIDAD</span>' : ''}
                            </div>
                        </div>
                    `);
                } else {
                    const title = $('#survey-title').val() || '[Título de la encuesta]';
                    const description = $('#survey-description').val() || '[Descripción de la encuesta]';
                    const options = [];
                    
                    $('.survey-option').each(function() {
                        const val = $(this).val();
                        if (val) options.push(val);
                    });
                    
                    preview.html(`
                        <div class="survey-preview">
                            <h3 class="ui header">${title}</h3>
                            <p>${description}</p>
                            <div class="ui form">
                                <div class="grouped fields">
                                    <label>Selecciona tu respuesta:</label>
                                    ${options.map((opt, i) => `
                                        <div class="field">
                                            <div class="ui radio checkbox">
                                                <input type="radio" name="preview-survey">
                                                <label>${opt || `Opción ${i+1}`}</label>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="ui small text" style="color: #666; margin-top: 20px;">
                                <i class="chart pie icon"></i> Encuesta • 
                                <i class="users icon"></i> Para todos los habitantes
                            </div>
                        </div>
                    `);
                }
            }
            
            // Escuchar cambios en los formularios
            $('#announcementForm input, #announcementForm textarea, #announcementForm select').on('input change', updatePreview);
            $('#surveyForm input, #surveyForm textarea').on('input change', updatePreview);
            
            // Botones de vista previa
            $('#preview-announcement').click(updatePreview);
            $('#preview-survey').click(updatePreview);
            
            // Enviar formularios
            $('#announcementForm').submit(function(e) {
                e.preventDefault();
                // Aquí iría la lógica para guardar el anuncio
                Swal.fire({
                    icon: 'success',
                    title: 'Anuncio creado',
                    text: 'Tu anuncio se publicó correctamente.',
                    timer: 1800,
                    showConfirmButton: false
                });
            });
            
            $('#surveyForm').submit(function(e) {
                e.preventDefault();
                // Aquí iría la lógica para guardar la encuesta
                Swal.fire({
                    icon: 'success',
                    title: 'Encuesta creada',
                    text: 'Se ha guardado la encuesta.',
                    timer: 1800,
                    showConfirmButton: false
                });
            });
            
            // Helper para nombres de categoría
            function getCategoryName(category) {
                const categories = {
                    'mantenimiento': 'Mantenimiento',
                    'seguridad': 'Seguridad',
                    'evento': 'Evento',
                    'importante': 'Importante',
                    'otro': 'Otro'
                };
                return categories[category] || 'General';
            }
        });