// Datos iniciales de los bancos
        const bancosData = {
            "Banesco": {
                telefono: "0414-555-1234",
                cedula: "V-26.789.456",
                bancoReceptor: "Banesco",
                beneficiario: "OIKOS",
                cuenta: "0134-1234-56-1234567890",
                tipoCuenta: "corriente",
                color: "#e30613",
                icono: "university"
            },
            "Banco de Venezuela": {
                telefono: "0412-987-6543",
                cedula: "V-26.789.456",
                bancoReceptor: "Banco de Venezuela",
                beneficiario: "OIKOS",
                cuenta: "0102-9876-54-3210987654",
                tipoCuenta: "ahorro",
                color: "#ff0000",
                icono: "building"
            },
            "Banco Provincial": {
                telefono: "0416-789-0123",
                cedula: "V-26.789.456",
                bancoReceptor: "Banco Provincial",
                beneficiario: "OIKOS",
                cuenta: "0108-5678-12-3456789012",
                tipoCuenta: "corriente",
                color: "#0033a0",
                icono: "landmark"
            }
        };

        // Instrucciones por defecto
        const instruccionesDefault = [
            "Selecciona 'Pago Móvil' en tu aplicación bancaria",
            "Ingresa el número de teléfono del banco correspondiente",
            "Verifica que el nombre del beneficiario sea correcto",
            "Ingresa el monto a pagar en Bolívares",
            "Guarda el comprobante de la transacción",
            "Regresa a esta página para reportar tu pago"
        ];

        $(document).ready(function() {
            // Inicializar pestañas
            $('.tab-btn').click(function() {
                const tabId = $(this).data('tab');
                
                // Actualizar botones de pestaña
                $('.tab-btn').removeClass('active');
                $(this).addClass('active');
                
                // Mostrar contenido correspondiente
                $('.tab-content').removeClass('active');
                $(`#${tabId}`).addClass('active');
            });

            // Cargar datos iniciales
            cargarDatosBancos();
            cargarInstrucciones();

            // Manejar guardado de cambios por banco
            $('.save-btn').click(function() {
                const banco = $(this).data('banco');
                guardarCambiosBanco(banco);
            });

            // Manejar guardado de instrucciones
            $('#guardarInstrucciones').click(function() {
                guardarInstrucciones();
            });

            // Botón para restaurar valores por defecto
            $('#restaurarDefault').click(function() {
                if (confirm('¿Estás seguro de restaurar todos los valores por defecto? Esto sobrescribirá los cambios no guardados.')) {
                    restaurarValoresDefault();
                }
            });

            // Validar formato de teléfono
            $('input[type="tel"]').on('blur', function() {
                const valor = $(this).val();
                const regex = /^0[0-9]{3}-[0-9]{3}-[0-9]{4}$/;
                if (valor && !regex.test(valor)) {
                    $(this).addClass('error');
                    showNotification('Formato de teléfono inválido. Use: 0412-345-6789', 'error');
                } else {
                    $(this).removeClass('error');
                }
            });

            // Validar formato de cuenta bancaria
            $('input[data-type="cuenta"]').on('blur', function() {
                const valor = $(this).val();
                // Validar formato básico de cuenta bancaria
                if (valor && !/^[0-9-]{10,25}$/.test(valor)) {
                    $(this).addClass('error');
                    showNotification('Formato de cuenta inválido. Use solo números y guiones', 'error');
                } else {
                    $(this).removeClass('error');
                }
            });

            // Manejar selector de tipo de cuenta
            $('.account-type-btn').click(function() {
                const bancoId = $(this).data('banco');
                const tipo = $(this).data('type');
                
                // Actualizar botones
                $(`[data-banco="${bancoId}"]`).removeClass('active');
                $(this).addClass('active');
                
                // Actualizar campo oculto
                $(`#tipoCuenta-${bancoId}`).val(tipo);
                
                // Marcar como modificado
                const bancoNombre = $(this).closest('.bank-card-admin').find('.bank-name-admin').text();
                const idBase = bancoNombre.replace(/\s+/g, '-');
                $(`#status-${idBase}`).removeClass('status-saved').addClass('status-unsaved')
                    .html('<i class="exclamation circle icon"></i> Cambios sin guardar');
            });
        });

        function cargarDatosBancos() {
            for (const [nombre, datos] of Object.entries(bancosData)) {
                const idBase = nombre.replace(/\s+/g, '-');
                
                // Campos comunes
                $(`#telefono-${idBase}`).val(datos.telefono);
                $(`#cedula-${idBase}`).val(datos.cedula);
                $(`#banco-${idBase}`).val(datos.bancoReceptor);
                $(`#beneficiario-${idBase}`).val(datos.beneficiario);
                $(`#cuenta-${idBase}`).val(datos.cuenta);
                $(`#tipoCuenta-${idBase}`).val(datos.tipoCuenta);
                
                // Establecer tipo de cuenta activo
                $(`.account-type-btn[data-banco="${idBase}"][data-type="${datos.tipoCuenta}"]`).addClass('active');
                
                // Establecer color del logo
                $(`#logo-${idBase}`).css({
                    'background': `linear-gradient(135deg, #f2f2f2 0%, #ffffff 100%)`,
                    'color': datos.color
                });
            }
        }

        function cargarInstrucciones() {
            const lista = $('#listaInstrucciones');
            lista.empty();
            instruccionesDefault.forEach((instruccion, index) => {
                const li = $(`
                    <li>
                        <input type="text" class="instruccion-input" 
                               value="${instruccion}" 
                               data-index="${index}"
                               placeholder="Escribe una instrucción">
                        <button class="ui icon button mini delete-instruccion" 
                                data-index="${index}">
                            <i class="trash icon"></i>
                        </button>
                    </li>
                `);
                lista.append(li);
            });

            // Agregar botón para nueva instrucción
            lista.append(`
                <li>
                    <button id="agregarInstruccion" class="ui button primary mini">
                        <i class="plus icon"></i> Agregar instrucción
                    </button>
                </li>
            `);

            // Manejar eventos
            $('.delete-instruccion').click(function() {
                const index = $(this).data('index');
                $(this).parent().remove();
                actualizarIndices();
            });

            $('#agregarInstruccion').click(function() {
                agregarNuevaInstruccion();
            });
        }

        function agregarNuevaInstruccion() {
            const lista = $('#listaInstrucciones');
            const index = lista.children('li').length - 1; // Excluye el botón agregar
            
            const nuevoLi = $(`
                <li>
                    <input type="text" class="instruccion-input" 
                           value="" 
                           data-index="${index}"
                           placeholder="Escribe una nueva instrucción">
                    <button class="ui icon button mini delete-instruccion" 
                            data-index="${index}">
                        <i class="trash icon"></i>
                    </button>
                </li>
            `);
            
            // Insertar antes del botón agregar
            $('#agregarInstruccion').parent().before(nuevoLi);
            actualizarIndices();
        }

        function actualizarIndices() {
            $('#listaInstrucciones li').each(function(index) {
                if ($(this).find('.instruccion-input').length) {
                    $(this).find('.instruccion-input').attr('data-index', index);
                    $(this).find('.delete-instruccion').attr('data-index', index);
                }
            });
        }

        function guardarCambiosBanco(bancoNombre) {
            const idBase = bancoNombre.replace(/\s+/g, '-');
            const nuevosDatos = {
                telefono: $(`#telefono-${idBase}`).val(),
                cedula: $(`#cedula-${idBase}`).val(),
                bancoReceptor: $(`#banco-${idBase}`).val(),
                beneficiario: $(`#beneficiario-${idBase}`).val(),
                cuenta: $(`#cuenta-${idBase}`).val(),
                tipoCuenta: $(`#tipoCuenta-${idBase}`).val()
            };

            // Validaciones
            if (!nuevosDatos.telefono || !nuevosDatos.cedula || !nuevosDatos.beneficiario || !nuevosDatos.cuenta) {
                showNotification('Por favor complete todos los campos requeridos', 'error');
                return;
            }

            // Actualizar datos en memoria
            bancosData[bancoNombre] = { ...bancosData[bancoNombre], ...nuevosDatos };

            // Simular guardado en servidor
            setTimeout(() => {
                showNotification(`Datos de ${bancoNombre} guardados exitosamente`, 'success');
                
                // Actualizar estado
                $(`#status-${idBase}`).removeClass('status-unsaved').addClass('status-saved')
                    .html('<i class="check icon"></i> Cambios guardados');
            }, 500);
        }

        function guardarInstrucciones() {
            const nuevasInstrucciones = [];
            $('.instruccion-input').each(function() {
                const valor = $(this).val().trim();
                if (valor) {
                    nuevasInstrucciones.push(valor);
                }
            });

            if (nuevasInstrucciones.length === 0) {
                showNotification('Debe haber al menos una instrucción', 'error');
                return;
            }

            // Aquí iría la lógica para guardar en el servidor
            showNotification('Instrucciones guardadas exitosamente', 'success');
        }

        function restaurarValoresDefault() {
            // Restaurar bancos
            for (const [nombre, datos] of Object.entries(bancosData)) {
                const defaults = {
                    "Banesco": {
                        telefono: "0414-555-1234",
                        cedula: "V-26.789.456",
                        bancoReceptor: "Banesco",
                        beneficiario: "OIKOS",
                        cuenta: "0134-1234-56-1234567890",
                        tipoCuenta: "corriente"
                    },
                    "Banco de Venezuela": {
                        telefono: "0412-987-6543",
                        cedula: "V-26.789.456",
                        bancoReceptor: "Banco de Venezuela",
                        beneficiario: "OIKOS",
                        cuenta: "0102-9876-54-3210987654",
                        tipoCuenta: "ahorro"
                    },
                    "Banco Provincial": {
                        telefono: "0416-789-0123",
                        cedula: "V-26.789.456",
                        bancoReceptor: "Banco Provincial",
                        beneficiario: "OIKOS",
                        cuenta: "0108-5678-12-3456789012",
                        tipoCuenta: "corriente"
                    }
                };

                const idBase = nombre.replace(/\s+/g, '-');
                $(`#telefono-${idBase}`).val(defaults[nombre].telefono);
                $(`#cedula-${idBase}`).val(defaults[nombre].cedula);
                $(`#banco-${idBase}`).val(defaults[nombre].bancoReceptor);
                $(`#beneficiario-${idBase}`).val(defaults[nombre].beneficiario);
                $(`#cuenta-${idBase}`).val(defaults[nombre].cuenta);
                $(`#tipoCuenta-${idBase}`).val(defaults[nombre].tipoCuenta);

                // Actualizar botones de tipo de cuenta
                $(`[data-banco="${idBase}"]`).removeClass('active');
                $(`[data-banco="${idBase}"][data-type="${defaults[nombre].tipoCuenta}"]`).addClass('active');

                // Actualizar datos en memoria
                bancosData[nombre] = { ...bancosData[nombre], ...defaults[nombre] };
            }

            // Restaurar instrucciones
            const lista = $('#listaInstrucciones');
            lista.empty();
            instruccionesDefault.forEach((instruccion, index) => {
                lista.append(`
                    <li>
                        <input type="text" class="instruccion-input" 
                               value="${instruccion}" 
                               data-index="${index}"
                               placeholder="Escribe una instrucción">
                        <button class="ui icon button mini delete-instruccion" 
                                data-index="${index}">
                            <i class="trash icon"></i>
                        </button>
                    </li>
                `);
            });

            // Agregar botón para nueva instrucción
            lista.append(`
                <li>
                    <button id="agregarInstruccion" class="ui button primary mini">
                        <i class="plus icon"></i> Agregar instrucción
                    </button>
                </li>
            `);

            // Re-asignar eventos
            $('#agregarInstruccion').click(agregarNuevaInstruccion);
            $('.delete-instruccion').click(function() {
                $(this).parent().remove();
                actualizarIndices();
            });

            showNotification('Valores restaurados exitosamente', 'success');
        }

        function showNotification(mensaje, tipo) {
            const notification = $(`
                <div class="notification ${tipo}">
                    ${mensaje}
                </div>
            `);
            
            $('body').append(notification);
            
            setTimeout(() => {
                notification.addClass('show');
            }, 10);
            
            setTimeout(() => {
                notification.removeClass('show');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 3000);
        }

        // Detectar cambios en los inputs
        $(document).on('input', 'input, select', function() {
            const bancoCard = $(this).closest('.bank-card-admin');
            if (bancoCard.length) {
                const banco = bancoCard.find('.bank-name-admin').text();
                const idBase = banco.replace(/\s+/g, '-');
                $(`#status-${idBase}`).removeClass('status-saved').addClass('status-unsaved')
                    .html('<i class="exclamation circle icon"></i> Cambios sin guardar');
            }
        });

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