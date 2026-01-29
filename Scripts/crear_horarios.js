$(document).ready(function() {
            // Inicializar componentes
            $('.ui.dropdown').dropdown();
            
            // Inicializar modales
            $('#horario-modal').modal({
                closable: false
            });
            $('#detalle-modal').modal();
            $('#confirm-modal').modal();
            $('#excepciones-modal').modal();
            
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
            
            // Datos de ejemplo
            let horarios = [
                {
                    id: 1,
                    area: "piscina",
                    areaNombre: "Piscina",
                    tipo: "regular",
                    nombre: "Horario regular de piscina",
                    dias: ["lunes", "martes", "miercoles", "jueves", "viernes"],
                    horaInicio: "07:00",
                    horaFin: "20:00",
                    estado: "activo",
                    capacidad: 20,
                    grupo: "adultos",
                    fechaInicio: "2025-01-01",
                    fechaFin: null,
                    descripcion: "Horario regular para uso de la piscina",
                    restricciones: ["Traje de baño obligatorio", "Ducha antes de ingresar"],
                    creadoPor: "Admin",
                    fechaCreacion: "2025-01-15T10:00:00",
                    ultimaModificacion: "2025-03-01T14:30:00"
                },
                {
                    id: 2,
                    area: "piscina",
                    areaNombre: "Piscina",
                    tipo: "especial",
                    nombre: "Horario infantil de piscina",
                    dias: ["lunes", "martes", "miercoles", "jueves", "viernes"],
                    horaInicio: "15:00",
                    horaFin: "18:00",
                    estado: "activo",
                    capacidad: 15,
                    grupo: "ninos",
                    fechaInicio: "2025-01-01",
                    fechaFin: null,
                    descripcion: "Horario especial para niños menores de 12 años",
                    restricciones: ["Supervisión adulta obligatoria", "Chaleco salvavidas para niños pequeños"],
                    creadoPor: "Admin",
                    fechaCreacion: "2025-01-15T10:05:00",
                    ultimaModificacion: "2025-02-20T11:15:00"
                },
                {
                    id: 3,
                    area: "gimnasio",
                    areaNombre: "Gimnasio",
                    tipo: "regular",
                    nombre: "Horario general de gimnasio",
                    dias: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
                    horaInicio: "05:00",
                    horaFin: "22:00",
                    estado: "activo",
                    capacidad: 10,
                    grupo: "adultos",
                    fechaInicio: "2025-01-01",
                    fechaFin: null,
                    descripcion: "Horario general para uso del gimnasio",
                    restricciones: ["Toalla obligatoria", "Calzado deportivo requerido"],
                    creadoPor: "Admin",
                    fechaCreacion: "2025-01-10T09:00:00",
                    ultimaModificacion: "2025-03-05T16:20:00"
                },
                {
                    id: 4,
                    area: "salon",
                    areaNombre: "Salón de Eventos",
                    tipo: "reserva",
                    nombre: "Reservas de salón",
                    dias: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
                    horaInicio: "08:00",
                    horaFin: "23:00",
                    estado: "activo",
                    capacidad: 50,
                    grupo: "todos",
                    fechaInicio: "2025-01-01",
                    fechaFin: null,
                    descripcion: "Horario disponible para reservas de salón",
                    restricciones: ["Reserva con 48h de anticipación", "Depósito de garantía requerido"],
                    creadoPor: "Admin",
                    fechaCreacion: "2025-01-20T14:00:00",
                    ultimaModificacion: "2025-02-28T10:45:00"
                }
            ];
            
            let excepciones = [
                {
                    id: 1,
                    horarioId: 1,
                    fecha: "2025-03-17",
                    tipo: "mantenimiento",
                    descripcion: "Mantenimiento mensual de la piscina",
                    horarioEspecial: null
                },
                {
                    id: 2,
                    horarioId: 3,
                    fecha: "2025-03-20",
                    tipo: "horario-especial",
                    descripcion: "Clase especial de yoga",
                    horarioEspecial: "18:00 - 20:00"
                }
            ];
            
            let currentHorarioId = null;
            let restriccionCount = 1;
            
            // Cargar datos iniciales
            cargarHorarios();
            
            // ===== EVENTOS DE BOTONES PRINCIPALES =====
            
            // Nuevo horario
            $('#nuevo-horario-btn, #nuevo-horario-empty').click(function() {
                console.log('Nuevo horario clickeado');
                nuevoHorario();
            });
            
            // Publicar horarios
            $('#publicar-horarios-btn').click(function() {
                console.log('Publicar horarios clickeado');
                publicarHorarios();
            });
            
            // Vista semanal
            $('#horario-semanal-btn').click(function() {
                console.log('Vista semanal clickeada');
                verVistaSemanal();
            });
            
            // Editar área desde dashboard
            $('.editar-area').click(function() {
                const area = $(this).data('area');
                console.log('Editar área clickeado:', area);
                editarHorarioArea(area);
            });
            
            // Búsqueda
            $('.search-input input').on('input', function() {
                filtrarHorarios();
            });
            
            // ===== EVENTOS DE MODALES =====
            
            // Restricciones dinámicas
            $('#agregar-restriccion').click(function() {
                console.log('Agregar restricción clickeado');
                restriccionCount++;
                const nuevaRestriccion = `
                    <div class="restriccion-item">
                        <input type="text" class="restriccion-input" placeholder="Restricción ${restriccionCount}">
                        <button type="button" class="ui icon button eliminar-restriccion">
                            <i class="times icon"></i>
                        </button>
                    </div>
                `;
                $('#restricciones-list').append(nuevaRestriccion);
            });
            
            $(document).on('click', '.eliminar-restriccion', function() {
                console.log('Eliminar restricción clickeado');
                if ($('.restriccion-item').length > 1) {
                    $(this).closest('.restriccion-item').remove();
                }
            });
            
            // Excepciones
            $('#agregar-excepcion').click(function() {
                console.log('Agregar excepción clickeado');
                const fecha = $('#excepcion-fecha').val();
                const tipo = $('#excepcion-tipo').val();
                
                if (!fecha) {
                    mostrarNotificacion('Por favor selecciona una fecha', 'error');
                    return;
                }
                
                const excepcionId = excepciones.length > 0 ? Math.max(...excepciones.map(e => e.id)) + 1 : 1;
                const nuevaExcepcion = {
                    id: excepcionId,
                    horarioId: currentHorarioId,
                    fecha: fecha,
                    tipo: tipo,
                    descripcion: `Excepción ${tipo}`,
                    horarioEspecial: tipo === 'horario-especial' ? '09:00 - 17:00' : null
                };
                
                excepciones.push(nuevaExcepcion);
                mostrarNotificacion('Excepción agregada exitosamente', 'success');
                $('#excepcion-fecha').val('');
                
                // Actualizar lista de excepciones
                if (currentHorarioId) {
                    cargarExcepcionesHorario(currentHorarioId);
                }
            });
            
            // Guardar horario
            $('.submit-horario').click(function() {
                console.log('Guardar horario clickeado');
                guardarHorario();
            });
            
            $('.cancel-horario').click(function() {
                console.log('Cancelar horario clickeado');
                $('#horario-modal').modal('hide');
                limpiarFormulario();
            });
            
            // Cerrar excepciones
            $('.cerrar-excepciones').click(function() {
                $('#excepciones-modal').modal('hide');
            });
            
            // Confirmaciones
            $('.cancel-confirm').click(function() {
                console.log('Cancelar confirmación clickeado');
                $('#confirm-modal').modal('hide');
            });
            
            $('.confirm-delete').click(function() {
                console.log('Confirmar eliminar clickeado');
                eliminarHorario(currentHorarioId);
            });
            
            $('.confirm-activar').click(function() {
                console.log('Confirmar activar clickeado');
                cambiarEstadoHorario(currentHorarioId, 'activo');
            });
            
            $('.confirm-desactivar').click(function() {
                console.log('Confirmar desactivar clickeado');
                cambiarEstadoHorario(currentHorarioId, 'inactivo');
            });
            
            // ===== FUNCIONES PRINCIPALES =====
            
            function cargarHorarios() {
                console.log('Cargando horarios...');
                const body = $('#horarios-body');
                body.empty();
                
                if (horarios.length === 0) {
                    $('#empty-state').show();
                    body.hide();
                } else {
                    $('#empty-state').hide();
                    body.show();
                    
                    // Mapa de días para mostrar
                    const diasMap = {
                        'lunes': 'L',
                        'martes': 'M',
                        'miercoles': 'X',
                        'jueves': 'J',
                        'viernes': 'V',
                        'sabado': 'S',
                        'domingo': 'D'
                    };
                    
                    horarios.forEach(horario => {
                        const estadoClase = `estado-${horario.estado}`;
                        const estadoTexto = {
                            'activo': 'Activo',
                            'inactivo': 'Inactivo',
                            'temporal': 'Temporal'
                        }[horario.estado];
                        
                        const tipoTexto = {
                            'regular': 'Regular',
                            'especial': 'Especial',
                            'temporal': 'Temporal',
                            'reserva': 'Reserva'
                        }[horario.tipo];
                        
                        const diasTexto = horario.dias.map(dia => {
                            return diasMap[dia] || dia;
                        }).join(', ');
                        
                        const areaIcono = {
                            'piscina': '<i class="swimming pool icon"></i>',
                            'gimnasio': '<i class="dumbbell icon"></i>',
                            'salon': '<i class="birthday cake icon"></i>',
                            'parque': '<i class="child icon"></i>',
                            'bbq': '<i class="fire icon"></i>',
                            'lavanderia': '<i class="tshirt icon"></i>',
                            'estacionamiento': '<i class="car icon"></i>'
                        }[horario.area] || '<i class="building icon"></i>';
                        
                        const capacidadTexto = horario.capacidad ? `${horario.capacidad} pers.` : 'Sin límite';
                        
                        const ultimaMod = new Date(horario.ultimaModificacion).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        });
                        
                        const row = `
                            <tr data-id="${horario.id}">
                                <td>
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <div class="area-icon ${horario.area}" style="font-size: 1rem;">
                                            ${areaIcono}
                                        </div>
                                        <div>
                                            <div style="font-weight: 600;">${horario.nombre}</div>
                                            <div style="color: #666; font-size: 0.9rem;">${horario.areaNombre}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>${tipoTexto}</td>
                                <td>
                                    <div class="dias-semana">
                                        ${['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map(dia => `
                                            <span class="dia-item ${horario.dias.includes(dia) ? 'dia-activo' : ''}">
                                                ${diasMap[dia] || dia.charAt(0).toUpperCase()}
                                            </span>
                                        `).join('')}
                                    </div>
                                </td>
                                <td>
                                    <div style="font-weight: 600;">${horario.horaInicio} - ${horario.horaFin}</div>
                                    ${horario.fechaInicio ? `
                                    <div style="font-size: 0.85rem; color: #666;">
                                        Desde: ${new Date(horario.fechaInicio).toLocaleDateString('es-ES')}
                                        ${horario.fechaFin ? `<br>Hasta: ${new Date(horario.fechaFin).toLocaleDateString('es-ES')}` : ''}
                                    </div>
                                    ` : ''}
                                </td>
                                <td>
                                    <span class="estado-horario ${estadoClase}">
                                        ${estadoTexto}
                                    </span>
                                </td>
                                <td>${capacidadTexto}</td>
                                <td>${ultimaMod}</td>
                                <td>
                                    <div class="acciones-buttons">
                                        <button class="ui tiny icon button ver-detalle-horario" data-id="${horario.id}" title="Ver detalles">
                                            <i class="eye icon"></i>
                                        </button>
                                        <button class="ui tiny icon button editar-horario" data-id="${horario.id}" title="Editar">
                                            <i class="edit icon"></i>
                                        </button>
                                        ${horario.estado === 'activo' ? `
                                            <button class="ui tiny orange icon button desactivar-horario" data-id="${horario.id}" title="Desactivar">
                                                <i class="pause icon"></i>
                                            </button>
                                        ` : `
                                            <button class="ui tiny green icon button activar-horario" data-id="${horario.id}" title="Activar">
                                                <i class="play icon"></i>
                                            </button>
                                        `}
                                        <button class="ui tiny red icon button eliminar-horario" data-id="${horario.id}" title="Eliminar">
                                            <i class="trash icon"></i>
                                        </button>
                                        <button class="ui tiny teal icon button excepciones-horario" data-id="${horario.id}" title="Excepciones">
                                            <i class="calendar times icon"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                        
                        body.append(row);
                    });
                    
                    // Agregar eventos a los botones DINÁMICAMENTE
                    $(document).off('click', '.ver-detalle-horario').on('click', '.ver-detalle-horario', function() {
                        const id = $(this).data('id');
                        console.log('Ver detalle horario clickeado:', id);
                        verDetalleHorario(id);
                    });
                    
                    $(document).off('click', '.editar-horario').on('click', '.editar-horario', function() {
                        const id = $(this).data('id');
                        console.log('Editar horario clickeado:', id);
                        editarHorario(id);
                    });
                    
                    $(document).off('click', '.activar-horario').on('click', '.activar-horario', function() {
                        const id = $(this).data('id');
                        console.log('Activar horario clickeado:', id);
                        confirmarCambiarEstado(id, 'activar');
                    });
                    
                    $(document).off('click', '.desactivar-horario').on('click', '.desactivar-horario', function() {
                        const id = $(this).data('id');
                        console.log('Desactivar horario clickeado:', id);
                        confirmarCambiarEstado(id, 'desactivar');
                    });
                    
                    $(document).off('click', '.eliminar-horario').on('click', '.eliminar-horario', function() {
                        const id = $(this).data('id');
                        console.log('Eliminar horario clickeado:', id);
                        confirmarEliminarHorario(id);
                    });
                    
                    $(document).off('click', '.excepciones-horario').on('click', '.excepciones-horario', function() {
                        const id = $(this).data('id');
                        console.log('Excepciones horario clickeado:', id);
                        mostrarExcepciones(id);
                    });
                }
                console.log('Horarios cargados:', horarios.length);
            }
            
            function filtrarHorarios() {
                console.log('Filtrando horarios...');
                const busqueda = $('.search-input input').val().toLowerCase();
                if (!busqueda) {
                    $('tr[data-id]').show();
                    return;
                }
                
                $('tr[data-id]').each(function() {
                    const texto = $(this).text().toLowerCase();
                    if (texto.includes(busqueda)) {
                        $(this).show();
                    } else {
                        $(this).hide();
                    }
                });
            }
            
            function nuevoHorario() {
                console.log('Abriendo modal nuevo horario');
                $('#modal-horario-header').html('<i class="plus icon"></i> Nuevo Horario');
                $('#horario-id').val('');
                limpiarFormulario();
                $('#horario-modal').modal('show');
            }
            
            function editarHorarioArea(area) {
                console.log('Editando área:', area);
                // Buscar horario principal del área
                const horarioPrincipal = horarios.find(h => h.area === area && h.tipo === 'regular');
                if (horarioPrincipal) {
                    editarHorario(horarioPrincipal.id);
                } else {
                    // Si no existe, crear uno nuevo para esa área
                    $('#modal-horario-header').html('<i class="plus icon"></i> Nuevo Horario para ' + area);
                    $('#horario-id').val('');
                    $('#area').val(area);
                    limpiarFormulario();
                    $('#horario-modal').modal('show');
                }
            }
            
            function editarHorario(id) {
                console.log('Editando horario ID:', id);
                const horario = horarios.find(h => h.id === id);
                if (!horario) return;
                
                $('#modal-horario-header').html('<i class="edit icon"></i> Editar Horario');
                $('#horario-id').val(horario.id);
                $('#area').val(horario.area);
                $('#tipo').val(horario.tipo);
                $('#nombre').val(horario.nombre);
                
                // Seleccionar días
                $('input[name="dias"]').prop('checked', false);
                horario.dias.forEach(dia => {
                    $(`input[name="dias"][value="${dia}"]`).prop('checked', true);
                });
                
                $('#hora-inicio').val(horario.horaInicio);
                $('#hora-fin').val(horario.horaFin);
                $('#estado').val(horario.estado);
                $('#capacidad').val(horario.capacidad);
                $('#grupo').val(horario.grupo || '');
                $('#fecha-inicio').val(horario.fechaInicio);
                $('#fecha-fin').val(horario.fechaFin);
                $('#descripcion').val(horario.descripcion);
                
                // Restricciones
                $('#restricciones-list').empty();
                restriccionCount = 0;
                if (horario.restricciones && horario.restricciones.length > 0) {
                    horario.restricciones.forEach((restriccion, index) => {
                        restriccionCount++;
                        const restriccionHtml = `
                            <div class="restriccion-item">
                                <input type="text" class="restriccion-input" value="${restriccion}">
                                <button type="button" class="ui icon button eliminar-restriccion">
                                    <i class="times icon"></i>
                                </button>
                            </div>
                        `;
                        $('#restricciones-list').append(restriccionHtml);
                    });
                } else {
                    $('#restricciones-list').html(`
                        <div class="restriccion-item">
                            <input type="text" class="restriccion-input" placeholder="Ej: Traje de baño obligatorio">
                            <button type="button" class="ui icon button eliminar-restriccion">
                                <i class="times icon"></i>
                            </button>
                        </div>
                    `);
                    restriccionCount = 1;
                }
                
                $('.ui.dropdown').dropdown('refresh');
                $('#horario-modal').modal('show');
            }
            
            function guardarHorario() {
                console.log('Guardando horario...');
                const form = $('#form-horario');
                
                // Validación manual
                const area = $('#area').val();
                const tipo = $('#tipo').val();
                const nombre = $('#nombre').val();
                const horaInicio = $('#hora-inicio').val();
                const horaFin = $('#hora-fin').val();
                const estado = $('#estado').val();
                
                if (!area || !tipo || !nombre || !horaInicio || !horaFin || !estado) {
                    mostrarNotificacion('Por favor completa todos los campos requeridos', 'error');
                    return;
                }
                
                // Obtener días seleccionados
                const diasSeleccionados = [];
                $('input[name="dias"]:checked').each(function() {
                    diasSeleccionados.push($(this).val());
                });
                
                if (diasSeleccionados.length === 0) {
                    mostrarNotificacion('Por favor selecciona al menos un día', 'error');
                    return;
                }
                
                // Obtener restricciones
                const restricciones = [];
                $('.restriccion-input').each(function() {
                    const valor = $(this).val().trim();
                    if (valor) {
                        restricciones.push(valor);
                    }
                });
                
                const id = $('#horario-id').val();
                const fechaActual = new Date().toISOString();
                
                const nuevoHorario = {
                    area: area,
                    areaNombre: $('#area option:selected').text(),
                    tipo: tipo,
                    nombre: nombre,
                    dias: diasSeleccionados,
                    horaInicio: horaInicio,
                    horaFin: horaFin,
                    estado: estado,
                    capacidad: $('#capacidad').val() ? parseInt($('#capacidad').val()) : null,
                    grupo: $('#grupo').val(),
                    fechaInicio: $('#fecha-inicio').val(),
                    fechaFin: $('#fecha-fin').val(),
                    descripcion: $('#descripcion').val(),
                    restricciones: restricciones,
                    creadoPor: 'Gestor',
                    fechaCreacion: fechaActual,
                    ultimaModificacion: fechaActual
                };
                
                if (id) {
                    // Editar horario existente
                    const index = horarios.findIndex(h => h.id == id);
                    if (index !== -1) {
                        nuevoHorario.id = parseInt(id);
                        nuevoHorario.fechaCreacion = horarios[index].fechaCreacion;
                        nuevoHorario.creadoPor = horarios[index].creadoPor;
                        horarios[index] = nuevoHorario;
                        mostrarNotificacion('Horario actualizado exitosamente', 'success');
                    }
                } else {
                    // Nuevo horario
                    const newId = horarios.length > 0 ? Math.max(...horarios.map(h => h.id)) + 1 : 1;
                    nuevoHorario.id = newId;
                    horarios.push(nuevoHorario);
                    mostrarNotificacion('Horario creado exitosamente', 'success');
                }
                
                $('#horario-modal').modal('hide');
                limpiarFormulario();
                cargarHorarios();
                actualizarDashboard();
            }
            
            function limpiarFormulario() {
                console.log('Limpiando formulario');
                $('#form-horario')[0].reset();
                $('#horario-id').val('');
                $('input[name="dias"]').prop('checked', false);
                $('#restricciones-list').html(`
                    <div class="restriccion-item">
                        <input type="text" class="restriccion-input" placeholder="Ej: Traje de baño obligatorio">
                        <button type="button" class="ui icon button eliminar-restriccion">
                            <i class="times icon"></i>
                        </button>
                    </div>
                `);
                restriccionCount = 1;
                $('.ui.dropdown').dropdown('clear');
            }
            
            function verDetalleHorario(id) {
                console.log('Viendo detalle horario ID:', id);
                const horario = horarios.find(h => h.id === id);
                if (!horario) return;
                
                const estadoTexto = {
                    'activo': 'Activo',
                    'inactivo': 'Inactivo',
                    'temporal': 'Temporal'
                }[horario.estado];
                
                const tipoTexto = {
                    'regular': 'Regular',
                    'especial': 'Especial',
                    'temporal': 'Temporal',
                    'reserva': 'Solo con Reserva'
                }[horario.tipo];
                
                const grupoTexto = {
                    'adultos': 'Adultos',
                    'ninos': 'Niños',
                    'familias': 'Familias',
                    'tercera-edad': 'Tercera Edad',
                    'todos': 'Todos'
                }[horario.grupo] || 'Todos';
                
                const diasTexto = horario.dias.map(dia => {
                    const diasMap = {
                        'lunes': 'Lunes',
                        'martes': 'Martes',
                        'miercoles': 'Miércoles',
                        'jueves': 'Jueves',
                        'viernes': 'Viernes',
                        'sabado': 'Sábado',
                        'domingo': 'Domingo'
                    };
                    return diasMap[dia] || dia;
                }).join(', ');
                
                const areaIcono = {
                    'piscina': '<i class="swimming pool icon"></i>',
                    'gimnasio': '<i class="dumbbell icon"></i>',
                    'salon': '<i class="birthday cake icon"></i>',
                    'parque': '<i class="child icon"></i>'
                }[horario.area] || '<i class="building icon"></i>';
                
                $('#detalle-header').html(`
                    <i class="info circle icon"></i>
                    ${horario.nombre}
                    <span class="ui horizontal ${horario.estado === 'activo' ? 'green' : horario.estado === 'inactivo' ? 'red' : 'orange'} label">
                        ${estadoTexto}
                    </span>
                `);
                
                $('#detalle-content').html(`
                    <div class="horario-form-grid">
                        <div class="ui segment">
                            <h4 class="ui header">
                                <i class="info circle icon"></i>
                                Información General
                            </h4>
                            <div class="info-item">
                                <span class="info-label">Área:</span>
                                <span class="info-value">${areaIcono} ${horario.areaNombre}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Tipo:</span>
                                <span class="info-value">${tipoTexto}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Grupo:</span>
                                <span class="info-value">${grupoTexto}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Capacidad:</span>
                                <span class="info-value">${horario.capacidad ? horario.capacidad + ' personas' : 'Sin límite'}</span>
                            </div>
                        </div>
                        
                        <div class="ui segment">
                            <h4 class="ui header">
                                <i class="calendar icon"></i>
                                Horario
                            </h4>
                            <div class="info-item">
                                <span class="info-label">Días:</span>
                                <span class="info-value">${diasTexto}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Horas:</span>
                                <span class="info-value"><strong>${horario.horaInicio} - ${horario.horaFin}</strong></span>
                            </div>
                            ${horario.fechaInicio ? `
                            <div class="info-item">
                                <span class="info-label">Vigencia:</span>
                                <span class="info-value">
                                    Desde: ${new Date(horario.fechaInicio).toLocaleDateString('es-ES')}
                                    ${horario.fechaFin ? `<br>Hasta: ${new Date(horario.fechaFin).toLocaleDateString('es-ES')}` : ''}
                                </span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${horario.descripcion ? `
                    <div class="ui segment">
                        <h4 class="ui header">
                            <i class="sticky note icon"></i>
                            Descripción
                        </h4>
                        <p>${horario.descripcion}</p>
                    </div>
                    ` : ''}
                    
                    ${horario.restricciones && horario.restricciones.length > 0 ? `
                    <div class="ui segment">
                        <h4 class="ui header">
                            <i class="exclamation triangle icon"></i>
                            Restricciones y Reglas
                        </h4>
                        <ul>
                            ${horario.restricciones.map(r => `<li>${r}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    
                    <div class="ui segment">
                        <h4 class="ui header">
                            <i class="history icon"></i>
                            Información del Sistema
                        </h4>
                        <div class="info-item">
                            <span class="info-label">Creado por:</span>
                            <span class="info-value">${horario.creadoPor}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Fecha creación:</span>
                            <span class="info-value">${new Date(horario.fechaCreacion).toLocaleString('es-ES')}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Última modificación:</span>
                            <span class="info-value">${new Date(horario.ultimaModificacion).toLocaleString('es-ES')}</span>
                        </div>
                    </div>
                `);
                
                $('#detalle-actions').html(`
                    <div class="ui button cancel-detalle">Cerrar</div>
                    <button class="ui primary button editar-desde-detalle" data-id="${horario.id}">
                        <i class="edit icon"></i> Editar
                    </button>
                    ${horario.estado === 'activo' ? `
                    <button class="ui orange button desactivar-desde-detalle" data-id="${horario.id}">
                        <i class="pause icon"></i> Desactivar
                    </button>
                    ` : `
                    <button class="ui green button activar-desde-detalle" data-id="${horario.id}">
                        <i class="play icon"></i> Activar
                    </button>
                    `}
                    <button class="ui red button eliminar-desde-detalle" data-id="${horario.id}">
                        <i class="trash icon"></i> Eliminar
                    </button>
                    <button class="ui teal button excepciones-desde-detalle" data-id="${horario.id}">
                        <i class="calendar times icon"></i> Excepciones
                    </button>
                `);
                
                // Eventos de los botones del modal - DELEGACIÓN DE EVENTOS
                $(document).off('click', '.cancel-detalle').on('click', '.cancel-detalle', function() {
                    $('#detalle-modal').modal('hide');
                });
                
                $(document).off('click', '.editar-desde-detalle').on('click', '.editar-desde-detalle', function() {
                    const id = $(this).data('id');
                    $('#detalle-modal').modal('hide');
                    setTimeout(() => editarHorario(id), 300);
                });
                
                $(document).off('click', '.activar-desde-detalle').on('click', '.activar-desde-detalle', function() {
                    const id = $(this).data('id');
                    $('#detalle-modal').modal('hide');
                    setTimeout(() => confirmarCambiarEstado(id, 'activar'), 300);
                });
                
                $(document).off('click', '.desactivar-desde-detalle').on('click', '.desactivar-desde-detalle', function() {
                    const id = $(this).data('id');
                    $('#detalle-modal').modal('hide');
                    setTimeout(() => confirmarCambiarEstado(id, 'desactivar'), 300);
                });
                
                $(document).off('click', '.eliminar-desde-detalle').on('click', '.eliminar-desde-detalle', function() {
                    const id = $(this).data('id');
                    $('#detalle-modal').modal('hide');
                    setTimeout(() => confirmarEliminarHorario(id), 300);
                });
                
                $(document).off('click', '.excepciones-desde-detalle').on('click', '.excepciones-desde-detalle', function() {
                    const id = $(this).data('id');
                    $('#detalle-modal').modal('hide');
                    setTimeout(() => mostrarExcepciones(id), 300);
                });
                
                $('#detalle-modal').modal('show');
            }
            
            function mostrarExcepciones(id) {
                console.log('Mostrando excepciones para horario ID:', id);
                currentHorarioId = id;
                const horario = horarios.find(h => h.id === id);
                
                if (!horario) return;
                
                $('#excepciones-modal .header').html(`
                    <i class="calendar times icon"></i>
                    Excepciones - ${horario.nombre}
                `);
                
                cargarExcepcionesHorario(id);
                $('#excepciones-modal').modal('show');
            }
            
            function cargarExcepcionesHorario(id) {
                console.log('Cargando excepciones para horario ID:', id);
                const lista = $('#lista-excepciones');
                lista.empty();
                
                const excepcionesHorario = excepciones.filter(e => e.horarioId === id);
                
                if (excepcionesHorario.length === 0) {
                    lista.html(`
                        <div class="ui message">
                            <i class="info circle icon"></i>
                            No hay excepciones configuradas para este horario
                        </div>
                    `);
                } else {
                    excepcionesHorario.forEach(excepcion => {
                        const tipoTexto = {
                            'cerrado': 'Cerrado',
                            'horario-especial': 'Horario Especial',
                            'mantenimiento': 'Mantenimiento'
                        }[excepcion.tipo];
                        
                        const fechaFormateada = new Date(excepcion.fecha).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        
                        const excepcionHtml = `
                            <div class="excepcion-item">
                                <div>
                                    <div style="font-weight: 600;">${fechaFormateada}</div>
                                    <div style="color: #666;">
                                        <span class="ui horizontal ${excepcion.tipo === 'cerrado' ? 'red' : excepcion.tipo === 'mantenimiento' ? 'orange' : 'blue'} label">
                                            ${tipoTexto}
                                        </span>
                                        ${excepcion.descripcion}
                                        ${excepcion.horarioEspecial ? `<br><strong>Horario:</strong> ${excepcion.horarioEspecial}` : ''}
                                    </div>
                                </div>
                                <button class="ui tiny red icon button eliminar-excepcion" data-id="${excepcion.id}">
                                    <i class="trash icon"></i>
                                </button>
                            </div>
                        `;
                        
                        lista.append(excepcionHtml);
                    });
                }
                
                // Evento para eliminar excepciones - DELEGACIÓN DE EVENTOS
                $(document).off('click', '.eliminar-excepcion').on('click', '.eliminar-excepcion', function() {
                    const excepcionId = $(this).data('id');
                    eliminarExcepcion(excepcionId);
                });
            }
            
            function eliminarExcepcion(id) {
                console.log('Eliminando excepción ID:', id);
                const index = excepciones.findIndex(e => e.id === id);
                if (index !== -1) {
                    excepciones.splice(index, 1);
                    mostrarNotificacion('Excepción eliminada', 'success');
                    cargarExcepcionesHorario(currentHorarioId);
                }
            }
            
            function confirmarEliminarHorario(id) {
                console.log('Confirmando eliminación horario ID:', id);
                currentHorarioId = id;
                const horario = horarios.find(h => h.id === id);
                
                $('#confirm-header').text('Confirmar Eliminación');
                $('#confirm-message').text(`¿Estás seguro de eliminar el horario "${horario.nombre}"? Esta acción no se puede deshacer.`);
                
                $('.confirm-delete').show();
                $('.confirm-activar').hide();
                $('.confirm-desactivar').hide();
                
                $('#confirm-modal').modal('show');
            }
            
            function eliminarHorario(id) {
                console.log('Eliminando horario ID:', id);
                const index = horarios.findIndex(h => h.id === id);
                if (index !== -1) {
                    horarios.splice(index, 1);
                    mostrarNotificacion('Horario eliminado exitosamente', 'success');
                    cargarHorarios();
                    actualizarDashboard();
                }
                
                $('#confirm-modal').modal('hide');
            }
            
            function confirmarCambiarEstado(id, accion) {
                console.log('Confirmando cambio estado horario ID:', id, 'Acción:', accion);
                currentHorarioId = id;
                const horario = horarios.find(h => h.id === id);
                
                if (accion === 'activar') {
                    $('#confirm-header').text('Activar Horario');
                    $('#confirm-message').text(`¿Activar el horario "${horario.nombre}"?`);
                    
                    $('.confirm-delete').hide();
                    $('.confirm-activar').show();
                    $('.confirm-desactivar').hide();
                } else {
                    $('#confirm-header').text('Desactivar Horario');
                    $('#confirm-message').text(`¿Desactivar temporalmente el horario "${horario.nombre}"?`);
                    
                    $('.confirm-delete').hide();
                    $('.confirm-activar').hide();
                    $('.confirm-desactivar').show();
                }
                
                $('#confirm-modal').modal('show');
            }
            
            function cambiarEstadoHorario(id, estado) {
                console.log('Cambiando estado horario ID:', id, 'Estado:', estado);
                const horario = horarios.find(h => h.id === id);
                if (horario) {
                    horario.estado = estado;
                    horario.ultimaModificacion = new Date().toISOString();
                    
                    mostrarNotificacion(`Horario ${estado === 'activo' ? 'activado' : 'desactivado'} exitosamente`, 'success');
                    cargarHorarios();
                    actualizarDashboard();
                }
                
                $('#confirm-modal').modal('hide');
            }
            
            function actualizarDashboard() {
                console.log('Actualizando dashboard');
                // Actualizar estado de áreas en el dashboard
                const areas = ['piscina', 'gimnasio', 'salon', 'parque'];
                
                areas.forEach(area => {
                    const horariosArea = horarios.filter(h => h.area === area && h.estado === 'activo');
                    
                    if (horariosArea.length > 0) {
                        $(`#status-${area}`).removeClass('status-cerrado status-proximamente').addClass('status-abierto').text('Abierto');
                    } else {
                        const horariosInactivos = horarios.filter(h => h.area === area && h.estado !== 'activo');
                        if (horariosInactivos.length > 0) {
                            $(`#status-${area}`).removeClass('status-abierto status-proximamente').addClass('status-cerrado').text('Cerrado');
                        }
                    }
                });
            }
            
            function publicarHorarios() {
                console.log('Publicando horarios');
                // Aquí iría la lógica para publicar los horarios (notificar a residentes, etc.)
                mostrarNotificacion('Horarios publicados exitosamente. Todos los residentes han sido notificados.', 'success');
            }
            
            function verVistaSemanal() {
                console.log('Mostrando vista semanal');
                // Aquí iría la lógica para mostrar vista semanal
                mostrarNotificacion('Mostrando vista semanal de horarios', 'info');
                
                // Ejemplo de cómo se vería
                const vistaHtml = `
                    <div class="ui segment">
                        <h3 class="ui header">
                            <i class="calendar alternate icon"></i>
                            Vista Semanal de Horarios
                        </h3>
                        <div class="ui message">
                            <p>Esta funcionalidad mostraría una vista semanal completa con todos los horarios organizados por día.</p>
                            <p>Próximamente disponible...</p>
                        </div>
                    </div>
                `;
                
                // Crear un modal temporal para mostrar la vista
                $('body').append(`
                    <div class="ui modal" id="vista-semanal-modal">
                        <i class="close icon"></i>
                        <div class="header">
                            <i class="calendar alternate icon"></i>
                            Vista Semanal
                        </div>
                        <div class="scrolling content">
                            ${vistaHtml}
                        </div>
                        <div class="actions">
                            <div class="ui button">Cerrar</div>
                        </div>
                    </div>
                `);
                
                $('#vista-semanal-modal').modal('show').modal({
                    onHide: function() {
                        $('#vista-semanal-modal').remove();
                    }
                });
            }
            
            function mostrarNotificacion(mensaje, tipo) {
                console.log('Mostrando notificación:', mensaje, 'Tipo:', tipo);
                let icono = 'info circle';
                let color = 'blue';
                
                if (tipo === 'success') {
                    icono = 'check circle';
                    color = 'green';
                } else if (tipo === 'error') {
                    icono = 'times circle';
                    color = 'red';
                } else if (tipo === 'warning') {
                    icono = 'exclamation circle';
                    color = 'yellow';
                }
                
                // Crear notificación
                const notification = $(`
                    <div class="ui ${color} message" style="position: fixed; top: 80px; right: 20px; z-index: 9999; min-width: 300px; max-width: 400px;">
                        <i class="close icon"></i>
                        <div class="header">
                            ${tipo === 'success' ? 'Éxito' : tipo === 'error' ? 'Error' : 'Información'}
                        </div>
                        <p>${mensaje}</p>
                    </div>
                `);
                
                $('body').append(notification);
                
                // Animación de entrada
                notification.hide().slideDown(300);
                
                // Cerrar al hacer clic en la X
                notification.find('.close.icon').click(function() {
                    notification.slideUp(300, function() {
                        $(this).remove();
                    });
                });
                
                // Auto-eliminar después de 4 segundos
                setTimeout(function() {
                    if (notification.is(':visible')) {
                        notification.slideUp(300, function() {
                            $(this).remove();
                        });
                    }
                }, 4000);
            }
            
            // Inicializar dashboard
            actualizarDashboard();
            
            console.log('JavaScript cargado correctamente');
        });