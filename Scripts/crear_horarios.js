 $(document).ready(function() {
            // Inicializar componentes
            $('.ui.dropdown').dropdown();
            $('.ui.search').search({
                source: [],
                searchFields: ['nombre', 'area', 'tipo'],
                onSelect: function(result) {
                    filtrarHorarios();
                }
            });
            
            // Inicializar modales
            $('#horario-modal').modal({
                closable: false
            });
            $('#detalle-modal').modal();
            $('#confirm-modal').modal();
            $('#excepciones-modal').modal();
            
            // Sidebar toggle
            $('#sidebar-toggle').click(function() {
                $('.ui.sidebar').sidebar('toggle');
            });
            
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
                },
                {
                    id: 5,
                    area: "parque",
                    areaNombre: "Parque Infantil",
                    tipo: "temporal",
                    nombre: "Parque cerrado por mantenimiento",
                    dias: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
                    horaInicio: "00:00",
                    horaFin: "23:59",
                    estado: "inactivo",
                    capacidad: 0,
                    grupo: "ninos",
                    fechaInicio: "2025-03-10",
                    fechaFin: "2025-03-20",
                    descripcion: "Parque infantil cerrado por trabajos de mantenimiento",
                    restricciones: ["Prohibido el acceso durante las obras"],
                    creadoPor: "Admin",
                    fechaCreacion: "2025-03-05T08:30:00",
                    ultimaModificacion: "2025-03-05T08:30:00"
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
                },
                {
                    id: 3,
                    horarioId: 4,
                    fecha: "2025-03-15",
                    tipo: "cerrado",
                    descripcion: "Reservado para evento privado",
                    horarioEspecial: null
                }
            ];
            
            let currentHorarioId = null;
            let restriccionCount = 1;
            
            // Cargar datos iniciales
            cargarHorarios();
            
            // Eventos de botones
            $('#nuevo-horario-btn, #nuevo-horario-empty').click(function() {
                nuevoHorario();
            });
            
            $('#publicar-horarios-btn').click(function() {
                publicarHorarios();
            });
            
            $('#horario-semanal-btn').click(function() {
                verVistaSemanal();
            });
            
            $('.editar-area').click(function() {
                const area = $(this).data('area');
                editarHorarioArea(area);
            });
            
            // Búsqueda
            $('.search-input input').on('input', function() {
                filtrarHorarios();
            });
            
            // Restricciones dinámicas
            $('#agregar-restriccion').click(function() {
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
                if ($('.restriccion-item').length > 1) {
                    $(this).closest('.restriccion-item').remove();
                }
            });
            
            // Excepciones
            $('#agregar-excepcion').click(function() {
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
                guardarHorario();
            });
            
            $('.cancel-horario').click(function() {
                $('#horario-modal').modal('hide');
                limpiarFormulario();
            });
            
            // Confirmaciones
            $('.cancel-confirm').click(function() {
                $('#confirm-modal').modal('hide');
            });
            
            $('.confirm-delete').click(function() {
                eliminarHorario(currentHorarioId);
            });
            
            $('.confirm-activar').click(function() {
                cambiarEstadoHorario(currentHorarioId, 'activo');
            });
            
            $('.confirm-desactivar').click(function() {
                cambiarEstadoHorario(currentHorarioId, 'inactivo');
            });
            
            // Funciones principales
            function cargarHorarios() {
                const body = $('#horarios-body');
                body.empty();
                
                if (horarios.length === 0) {
                    $('#empty-state').show();
                    body.hide();
                } else {
                    $('#empty-state').hide();
                    body.show();
                    
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
                            const diasMap = {
                                'lunes': 'Lun',
                                'martes': 'Mar',
                                'miercoles': 'Mié',
                                'jueves': 'Jue',
                                'viernes': 'Vie',
                                'sabado': 'Sáb',
                                'domingo': 'Dom'
                            };
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
                    
                    // Agregar eventos a los botones
                    $('.ver-detalle-horario').click(function() {
                        const id = $(this).data('id');
                        verDetalleHorario(id);
                    });
                    
                    $('.editar-horario').click(function() {
                        const id = $(this).data('id');
                        editarHorario(id);
                    });
                    
                    $('.activar-horario').click(function() {
                        const id = $(this).data('id');
                        confirmarCambiarEstado(id, 'activar');
                    });
                    
                    $('.desactivar-horario').click(function() {
                        const id = $(this).data('id');
                        confirmarCambiarEstado(id, 'desactivar');
                    });
                    
                    $('.eliminar-horario').click(function() {
                        const id = $(this).data('id');
                        confirmarEliminarHorario(id);
                    });
                    
                    $('.excepciones-horario').click(function() {
                        const id = $(this).data('id');
                        mostrarExcepciones(id);
                    });
                }
            }
            
            function filtrarHorarios() {
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
                $('#modal-horario-header').html('<i class="plus icon"></i> Nuevo Horario');
                $('#horario-id').val('');
                limpiarFormulario();
                $('#horario-modal').modal('show');
            }
            
            function editarHorarioArea(area) {
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
                $('#grupo').val(horario.grupo);
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
                const form = $('#form-horario');
                if (!form.form('is valid')) {
                    form.form('validate form');
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
                    area: $('#area').val(),
                    areaNombre: $('#area option:selected').text(),
                    tipo: $('#tipo').val(),
                    nombre: $('#nombre').val(),
                    dias: diasSeleccionados,
                    horaInicio: $('#hora-inicio').val(),
                    horaFin: $('#hora-fin').val(),
                    estado: $('#estado').val(),
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
                $('.ui.form').form('clear');
            }
            
            function verDetalleHorario(id) {
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
                
                // Eventos de los botones del modal
                $('.cancel-detalle').click(function() {
                    $('#detalle-modal').modal('hide');
                });
                
                $('.editar-desde-detalle').click(function() {
                    const id = $(this).data('id');
                    $('#detalle-modal').modal('hide');
                    setTimeout(() => editarHorario(id), 300);
                });
                
                $('.activar-desde-detalle').click(function() {
                    const id = $(this).data('id');
                    $('#detalle-modal').modal('hide');
                    setTimeout(() => confirmarCambiarEstado(id, 'activar'), 300);
                });
                
                $('.desactivar-desde-detalle').click(function() {
                    const id = $(this).data('id');
                    $('#detalle-modal').modal('hide');
                    setTimeout(() => confirmarCambiarEstado(id, 'desactivar'), 300);
                });
                
                $('.eliminar-desde-detalle').click(function() {
                    const id = $(this).data('id');
                    $('#detalle-modal').modal('hide');
                    setTimeout(() => confirmarEliminarHorario(id), 300);
                });
                
                $('.excepciones-desde-detalle').click(function() {
                    const id = $(this).data('id');
                    $('#detalle-modal').modal('hide');
                    setTimeout(() => mostrarExcepciones(id), 300);
                });
                
                $('#detalle-modal').modal('show');
            }
            
            function mostrarExcepciones(id) {
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
                
                // Evento para eliminar excepciones
                $('.eliminar-excepcion').click(function() {
                    const excepcionId = $(this).data('id');
                    eliminarExcepcion(excepcionId);
                });
            }
            
            function eliminarExcepcion(id) {
                const index = excepciones.findIndex(e => e.id === id);
                if (index !== -1) {
                    excepciones.splice(index, 1);
                    mostrarNotificacion('Excepción eliminada', 'success');
                    cargarExcepcionesHorario(currentHorarioId);
                }
            }
            
            function confirmarEliminarHorario(id) {
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
                // Aquí iría la lógica para publicar los horarios (notificar a residentes, etc.)
                mostrarNotificacion('Horarios publicados exitosamente. Todos los residentes han sido notificados.', 'success');
            }
            
            function verVistaSemanal() {
                // Aquí iría la lógica para mostrar vista semanal
                mostrarNotificacion('Mostrando vista semanal de horarios', 'info');
            }
            
            function mostrarNotificacion(mensaje, tipo) {
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
                
                $('body').toast({
                    class: color,
                    title: tipo === 'success' ? 'Éxito' : tipo === 'error' ? 'Error' : 'Información',
                    message: mensaje,
                    showIcon: icono,
                    position: 'top right',
                    displayTime: 4000
                });
            }
            
            // Inicializar validación del formulario
            $('#form-horario').form({
                fields: {
                    area: 'empty',
                    tipo: 'empty',
                    nombre: 'empty',
                    horaInicio: 'empty',
                    horaFin: 'empty',
                    estado: 'empty'
                }
            });
            
            // Mapa de días para mostrar
            window.diasMap = {
                'lunes': 'L',
                'martes': 'M',
                'miercoles': 'X',
                'jueves': 'J',
                'viernes': 'V',
                'sabado': 'S',
                'domingo': 'D'
            };
            
            // Inicializar dashboard
            actualizarDashboard();
        });