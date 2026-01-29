$(document).ready(function() {
            // Inicializar componentes
            $('.ui.dropdown').dropdown();
            $('.ui.search').search({
                source: [],
                searchFields: ['residente', 'apartamento', 'concepto'],
                onSelect: function(result) {
                    filtrarPagos();
                }
            });
            
            // Inicializar modales
            $('#pago-modal').modal({
                closable: false
            });
            $('#detalle-modal').modal();
            $('#confirm-modal').modal();
            
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
            
            // Datos de ejemplo (simulando base de datos)
            let pagos = [
                {
                    id: 1,
                    residenteId: 1,
                    residente: "María González",
                    apartamento: "A-402",
                    concepto: "mantenimiento",
                    monto: 150.00,
                    fechaEmision: "2025-03-01",
                    fechaVencimiento: "2025-03-15",
                    fechaPago: "2025-03-10",
                    estado: "pagado",
                    metodo: "transferencia",
                    descripcion: "Pago de mantenimiento mensual",
                    comprobante: "comprobante_001.pdf",
                    creadoPor: "Admin",
                    fechaCreacion: "2025-03-01T10:00:00"
                },
                {
                    id: 2,
                    residenteId: 2,
                    residente: "Carlos Rodríguez",
                    apartamento: "B-201",
                    concepto: "cuota",
                    monto: 200.00,
                    fechaEmision: "2025-03-01",
                    fechaVencimiento: "2025-03-15",
                    fechaPago: null,
                    estado: "pendiente",
                    metodo: "",
                    descripcion: "Cuota administrativa marzo",
                    comprobante: "",
                    creadoPor: "Admin",
                    fechaCreacion: "2025-03-01T10:05:00"
                },
                {
                    id: 3,
                    residenteId: 3,
                    residente: "Ana Martínez",
                    apartamento: "C-103",
                    concepto: "agua",
                    monto: 85.50,
                    fechaEmision: "2025-03-05",
                    fechaVencimiento: "2025-03-20",
                    fechaPago: "2025-03-18",
                    estado: "pagado",
                    metodo: "efectivo",
                    descripcion: "Consumo de agua febrero",
                    comprobante: "recibo_agua_003.jpg",
                    creadoPor: "Admin",
                    fechaCreacion: "2025-03-05T14:30:00"
                },
                {
                    id: 4,
                    residenteId: 4,
                    residente: "Jorge López",
                    apartamento: "D-305",
                    concepto: "mantenimiento",
                    monto: 150.00,
                    fechaEmision: "2025-02-01",
                    fechaVencimiento: "2025-02-15",
                    fechaPago: null,
                    estado: "vencido",
                    metodo: "",
                    descripcion: "Mantenimiento febrero - VENCIDO",
                    comprobante: "",
                    creadoPor: "Admin",
                    fechaCreacion: "2025-02-01T09:00:00"
                },
                {
                    id: 5,
                    residenteId: 5,
                    residente: "Laura Sánchez",
                    apartamento: "A-105",
                    concepto: "luz",
                    monto: 120.75,
                    fechaEmision: "2025-03-10",
                    fechaVencimiento: "2025-03-25",
                    fechaPago: null,
                    estado: "pendiente",
                    metodo: "",
                    descripcion: "Consumo eléctrico febrero",
                    comprobante: "",
                    creadoPor: "Admin",
                    fechaCreacion: "2025-03-10T11:20:00"
                }
            ];
            
            let residentes = [
                { id: 1, nombre: "María González", apartamento: "A-402", email: "maria@email.com" },
                { id: 2, nombre: "Carlos Rodríguez", apartamento: "B-201", email: "carlos@email.com" },
                { id: 3, nombre: "Ana Martínez", apartamento: "C-103", email: "ana@email.com" },
                { id: 4, nombre: "Jorge López", apartamento: "D-305", email: "jorge@email.com" },
                { id: 5, nombre: "Laura Sánchez", apartamento: "A-105", email: "laura@email.com" },
                { id: 6, nombre: "Roberto Jiménez", apartamento: "E-208", email: "roberto@email.com" },
                { id: 7, nombre: "Sofía Ramírez", apartamento: "F-101", email: "sofia@email.com" },
                { id: 8, nombre: "Miguel Torres", apartamento: "G-304", email: "miguel@email.com" }
            ];
            
            let currentFilter = 'todos';
            let currentPagoId = null;
            let filtrosAplicados = {};
            
            // Cargar datos iniciales
            cargarResidentesDropdown();
            cargarPagos();
            
            // Eventos de botones
            $('#nuevo-pago-btn, #nuevo-pago-empty').click(function() {
                nuevoPago();
            });
            
            $('#filtros-avanzados-btn').click(function() {
                $('#filtros-avanzados').toggleClass('active');
            });
            
            $('#aplicar-filtros-btn').click(function() {
                aplicarFiltrosAvanzados();
            });
            
            $('#limpiar-filtros-btn').click(function() {
                limpiarFiltros();
            });
            
            $('#exportar-btn').click(function() {
                exportarPagos();
            });
            
            // Filtros simples
            $('.filter-btn').click(function() {
                $('.filter-btn').removeClass('active');
                $(this).addClass('active');
                currentFilter = $(this).data('filter');
                filtrarPagos();
            });
            
            // Búsqueda
            $('.search-input input').on('input', function() {
                filtrarPagos();
            });
            
            // Seleccionar archivo
            $('#seleccionar-comprobante').click(function() {
                $('#comprobante-file').click();
            });
            
            $('#comprobante-file').change(function() {
                const fileName = $(this).val().split('\\').pop();
                $('#comprobante-text').val(fileName);
            });
            
            // Cuando se selecciona un residente
            $('#residente-id').change(function() {
                const residenteId = $(this).val();
                const residente = residentes.find(r => r.id == residenteId);
                if (residente) {
                    $('#apartamento').val(residente.apartamento);
                } else {
                    $('#apartamento').val('');
                }
            });
            
            // Guardar pago
            $('.submit-pago').click(function() {
                guardarPago();
            });
            
            $('.cancel-pago').click(function() {
                $('#pago-modal').modal('hide');
                limpiarFormulario();
            });
            
            // Confirmaciones
            $('.cancel-confirm').click(function() {
                $('#confirm-modal').modal('hide');
            });
            
            $('.confirm-delete').click(function() {
                eliminarPago(currentPagoId);
            });
            
            $('.confirm-marcar-pagado').click(function() {
                marcarComoPagado(currentPagoId);
            });
            
            // Funciones principales
            function cargarResidentesDropdown() {
                const dropdown = $('#residente-id');
                dropdown.empty();
                dropdown.append('<option value="">Seleccionar residente</option>');
                
                residentes.forEach(residente => {
                    dropdown.append(`
                        <option value="${residente.id}">
                            ${residente.nombre} (${residente.apartamento})
                        </option>
                    `);
                });
                
                dropdown.dropdown('refresh');
            }
            
            function cargarPagos() {
                const body = $('#pagos-body');
                body.empty();
                
                let pagosFiltrados = filtrarPagosLista(pagos);
                
                if (pagosFiltrados.length === 0) {
                    $('#empty-state').show();
                    body.hide();
                } else {
                    $('#empty-state').hide();
                    body.show();
                    
                    pagosFiltrados.forEach(pago => {
                        const estadoClase = `estado-${pago.estado}`;
                        const montoClase = `monto-${pago.estado}`;
                        const estadoTexto = {
                            'pagado': 'Pagado',
                            'pendiente': 'Pendiente',
                            'vencido': 'Vencido'
                        }[pago.estado];
                        
                        const conceptoTexto = {
                            'mantenimiento': 'Mantenimiento',
                            'cuota': 'Cuota Mensual',
                            'agua': 'Agua',
                            'luz': 'Luz',
                            'gas': 'Gas',
                            'extraordinario': 'Extraordinario',
                            'otros': 'Otros'
                        }[pago.concepto] || pago.concepto;
                        
                        const fechaVencimiento = pago.fechaVencimiento ? 
                            new Date(pago.fechaVencimiento).toLocaleDateString('es-ES') : '-';
                        
                        const fechaPago = pago.fechaPago ? 
                            new Date(pago.fechaPago).toLocaleDateString('es-ES') : '-';
                        
                        const metodoTexto = pago.metodo ? {
                            'transferencia': 'Transferencia',
                            'efectivo': 'Efectivo',
                            'tarjeta': 'Tarjeta',
                            'cheque': 'Cheque'
                        }[pago.metodo] : '-';
                        
                        const row = `
                            <tr data-id="${pago.id}">
                                <td>#${pago.id.toString().padStart(4, '0')}</td>
                                <td>${pago.residente}</td>
                                <td>${pago.apartamento}</td>
                                <td>${conceptoTexto}</td>
                                <td>${fechaVencimiento}</td>
                                <td>${fechaPago}</td>
                                <td class="monto ${montoClase}">Bs. ${pago.monto.toFixed(2)}</td>
                                <td>
                                    <span class="estado-pago ${estadoClase}">
                                        ${estadoTexto}
                                    </span>
                                </td>
                                <td>${metodoTexto}</td>
                                <td>
                                    ${pago.comprobante ? 
                                        `<a href="#" class="ui tiny basic button ver-comprobante" data-file="${pago.comprobante}">
                                            <i class="file icon"></i> Ver
                                        </a>` : 
                                        '<span class="ui tiny label">Sin comprobante</span>'
                                    }
                                </td>
                                <td class="acciones-cell">
                                    <div class="acciones-buttons">
                                        <button class="ui tiny icon button ver-detalle" data-id="${pago.id}" title="Ver detalles">
                                            <i class="eye icon"></i>
                                        </button>
                                        <button class="ui tiny icon button editar-pago" data-id="${pago.id}" title="Editar">
                                            <i class="edit icon"></i>
                                        </button>
                                        ${pago.estado === 'pendiente' ? `
                                            <button class="ui tiny green icon button marcar-pagado" data-id="${pago.id}" title="Marcar como pagado">
                                                <i class="check icon"></i>
                                            </button>
                                        ` : ''}
                                        <button class="ui tiny red icon button eliminar-pago" data-id="${pago.id}" title="Eliminar">
                                            <i class="trash icon"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                        
                        body.append(row);
                    });
                    
                    // Agregar eventos a los botones
                    $('.ver-detalle').click(function() {
                        const id = $(this).data('id');
                        verDetallePago(id);
                    });
                    
                    $('.editar-pago').click(function() {
                        const id = $(this).data('id');
                        editarPago(id);
                    });
                    
                    $('.marcar-pagado').click(function() {
                        const id = $(this).data('id');
                        confirmarMarcarPagado(id);
                    });
                    
                    $('.eliminar-pago').click(function() {
                        const id = $(this).data('id');
                        confirmarEliminarPago(id);
                    });
                    
                    $('.ver-comprobante').click(function(e) {
                        e.preventDefault();
                        const file = $(this).data('file');
                        verComprobante(file);
                    });
                }
                
                actualizarEstadisticas();
            }
            
            function filtrarPagosLista(lista) {
                let filtrados = lista;
                
                // Filtro por estado
                if (currentFilter !== 'todos') {
                    filtrados = filtrados.filter(p => p.estado === currentFilter);
                }
                
                // Filtro por búsqueda
                const busqueda = $('.search-input input').val().toLowerCase();
                if (busqueda) {
                    filtrados = filtrados.filter(p => 
                        p.residente.toLowerCase().includes(busqueda) ||
                        p.apartamento.toLowerCase().includes(busqueda) ||
                        p.concepto.toLowerCase().includes(busqueda) ||
                        p.id.toString().includes(busqueda)
                    );
                }
                
                // Filtros avanzados
                if (Object.keys(filtrosAplicados).length > 0) {
                    if (filtrosAplicados.fechaDesde) {
                        filtrados = filtrados.filter(p => 
                            new Date(p.fechaEmision) >= new Date(filtrosAplicados.fechaDesde)
                        );
                    }
                    
                    if (filtrosAplicados.fechaHasta) {
                        filtrados = filtrados.filter(p => 
                            new Date(p.fechaEmision) <= new Date(filtrosAplicados.fechaHasta)
                        );
                    }
                    
                    if (filtrosAplicados.montoMin) {
                        filtrados = filtrados.filter(p => 
                            p.monto >= parseFloat(filtrosAplicados.montoMin)
                        );
                    }
                    
                    if (filtrosAplicados.montoMax) {
                        filtrados = filtrados.filter(p => 
                            p.monto <= parseFloat(filtrosAplicados.montoMax)
                        );
                    }
                    
                    if (filtrosAplicados.concepto) {
                        filtrados = filtrados.filter(p => 
                            p.concepto === filtrosAplicados.concepto
                        );
                    }
                    
                    if (filtrosAplicados.apartamento) {
                        filtrados = filtrados.filter(p => 
                            p.apartamento.toLowerCase().includes(filtrosAplicados.apartamento.toLowerCase())
                        );
                    }
                    
                    if (filtrosAplicados.metodo) {
                        filtrados = filtrados.filter(p => 
                            p.metodo === filtrosAplicados.metodo
                        );
                    }
                }
                
                return filtrados;
            }
            
            function filtrarPagos() {
                cargarPagos();
            }
            
            function aplicarFiltrosAvanzados() {
                filtrosAplicados = {
                    fechaDesde: $('#filtro-fecha-desde').val(),
                    fechaHasta: $('#filtro-fecha-hasta').val(),
                    montoMin: $('#filtro-monto-min').val(),
                    montoMax: $('#filtro-monto-max').val(),
                    concepto: $('#filtro-concepto').val(),
                    apartamento: $('#filtro-apartamento').val(),
                    metodo: $('#filtro-metodo').val()
                };
                
                // Eliminar filtros vacíos
                Object.keys(filtrosAplicados).forEach(key => {
                    if (!filtrosAplicados[key]) {
                        delete filtrosAplicados[key];
                    }
                });
                
                filtrarPagos();
                $('#filtros-avanzados').removeClass('active');
            }
            
            function limpiarFiltros() {
                $('#filtro-fecha-desde').val('');
                $('#filtro-fecha-hasta').val('');
                $('#filtro-monto-min').val('');
                $('#filtro-monto-max').val('');
                $('#filtro-concepto').val('');
                $('#filtro-apartamento').val('');
                $('#filtro-metodo').val('');
                
                filtrosAplicados = {};
                filtrarPagos();
            }
            
            function actualizarEstadisticas() {
                const totalRecaudado = pagos
                    .filter(p => p.estado === 'pagado')
                    .reduce((sum, p) => sum + p.monto, 0);
                
                const totalPagado = pagos
                    .filter(p => p.estado === 'pagado').length;
                
                const totalPendiente = pagos
                    .filter(p => p.estado === 'pendiente')
                    .reduce((sum, p) => sum + p.monto, 0);
                
                const totalVencido = pagos
                    .filter(p => p.estado === 'vencido')
                    .reduce((sum, p) => sum + p.monto, 0);
                
                $('#total-recaudado').text('Bs. ' + totalRecaudado.toFixed(2));
                $('#total-pagado').text(totalPagado);
                $('#total-pendiente').text('Bs. ' + totalPendiente.toFixed(2));
                $('#total-vencido').text('Bs. ' + totalVencido.toFixed(2));
            }
            
            function nuevoPago() {
                $('#modal-pago-header').html('<i class="plus icon"></i> Nuevo Pago');
                $('#pago-id').val('');
                limpiarFormulario();
                $('#pago-modal').modal('show');
            }
            
            function editarPago(id) {
                const pago = pagos.find(p => p.id === id);
                if (!pago) return;
                
                $('#modal-pago-header').html('<i class="edit icon"></i> Editar Pago');
                $('#pago-id').val(pago.id);
                $('#residente-id').val(pago.residenteId);
                $('#apartamento').val(pago.apartamento);
                $('#concepto').val(pago.concepto);
                $('#monto').val(pago.monto);
                $('#fecha-emision').val(pago.fechaEmision);
                $('#fecha-vencimiento').val(pago.fechaVencimiento);
                $('#fecha-pago').val(pago.fechaPago || '');
                $('#estado').val(pago.estado);
                $('#metodo-pago').val(pago.metodo);
                $('#descripcion').val(pago.descripcion);
                $('#comprobante-text').val(pago.comprobante || '');
                
                $('.ui.dropdown').dropdown('refresh');
                $('#pago-modal').modal('show');
            }
            
            function guardarPago() {
                const form = $('#form-pago');
                if (!form.form('is valid')) {
                    form.form('validate form');
                    return;
                }
                
                const id = $('#pago-id').val();
                const fechaActual = new Date().toISOString().split('T')[0];
                
                const nuevoPago = {
                    residenteId: parseInt($('#residente-id').val()),
                    residente: residentes.find(r => r.id == $('#residente-id').val())?.nombre || '',
                    apartamento: $('#apartamento').val(),
                    concepto: $('#concepto').val(),
                    monto: parseFloat($('#monto').val()),
                    fechaEmision: $('#fecha-emision').val(),
                    fechaVencimiento: $('#fecha-vencimiento').val(),
                    fechaPago: $('#fecha-pago').val() || null,
                    estado: $('#estado').val(),
                    metodo: $('#metodo-pago').val(),
                    descripcion: $('#descripcion').val(),
                    comprobante: $('#comprobante-text').val(),
                    creadoPor: 'Gestor',
                    fechaCreacion: fechaActual + 'T' + new Date().toTimeString().split(' ')[0]
                };
                
                if (id) {
                    // Editar pago existente
                    const index = pagos.findIndex(p => p.id == id);
                    if (index !== -1) {
                        nuevoPago.id = parseInt(id);
                        pagos[index] = nuevoPago;
                        mostrarNotificacion('Pago actualizado exitosamente', 'success');
                    }
                } else {
                    // Nuevo pago
                    const newId = pagos.length > 0 ? Math.max(...pagos.map(p => p.id)) + 1 : 1;
                    nuevoPago.id = newId;
                    pagos.push(nuevoPago);
                    mostrarNotificacion('Pago creado exitosamente', 'success');
                }
                
                $('#pago-modal').modal('hide');
                limpiarFormulario();
                cargarPagos();
            }
            
            function limpiarFormulario() {
                $('#form-pago')[0].reset();
                $('#pago-id').val('');
                $('#apartamento').val('');
                $('#comprobante-text').val('');
                $('#comprobante-file').val('');
                $('.ui.dropdown').dropdown('clear');
                $('.ui.form').form('clear');
            }
            
            function verDetallePago(id) {
                const pago = pagos.find(p => p.id === id);
                if (!pago) return;
                
                const conceptoTexto = {
                    'mantenimiento': 'Mantenimiento',
                    'cuota': 'Cuota Mensual',
                    'agua': 'Agua',
                    'luz': 'Luz',
                    'gas': 'Gas',
                    'extraordinario': 'Extraordinario',
                    'otros': 'Otros'
                }[pago.concepto] || pago.concepto;
                
                const estadoTexto = {
                    'pagado': 'Pagado',
                    'pendiente': 'Pendiente',
                    'vencido': 'Vencido'
                }[pago.estado];
                
                const metodoTexto = pago.metodo ? {
                    'transferencia': 'Transferencia Bancaria',
                    'efectivo': 'Efectivo',
                    'tarjeta': 'Tarjeta de Crédito/Débito',
                    'cheque': 'Cheque'
                }[pago.metodo] : 'No especificado';
                
                $('#detalle-header').html(`
                    <i class="info circle icon"></i>
                    Pago #${pago.id.toString().padStart(4, '0')}
                    <span class="ui horizontal ${pago.estado === 'pagado' ? 'green' : pago.estado === 'pendiente' ? 'yellow' : 'red'} label">
                        ${estadoTexto}
                    </span>
                `);
                
                $('#detalle-content').html(`
                    <div class="detalle-pago-grid">
                        <div class="ui segment">
                            <h4 class="ui header">
                                <i class="user icon"></i>
                                Información del Residente
                            </h4>
                            <div class="info-item">
                                <span class="info-label">Residente:</span>
                                <span class="info-value">${pago.residente}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Apartamento:</span>
                                <span class="info-value">${pago.apartamento}</span>
                            </div>
                        </div>
                        
                        <div class="ui segment">
                            <h4 class="ui header">
                                <i class="money bill alternate icon"></i>
                                Información del Pago
                            </h4>
                            <div class="info-item">
                                <span class="info-label">Concepto:</span>
                                <span class="info-value">${conceptoTexto}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Monto:</span>
                                <span class="info-value"><strong>Bs. ${pago.monto.toFixed(2)}</strong></span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Estado:</span>
                                <span class="info-value">
                                    <span class="ui ${pago.estado === 'pagado' ? 'green' : pago.estado === 'pendiente' ? 'yellow' : 'red'} horizontal label">
                                        ${estadoTexto}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="ui segment">
                        <h4 class="ui header">
                            <i class="calendar icon"></i>
                            Fechas
                        </h4>
                        <div class="info-item">
                            <span class="info-label">Fecha de Emisión:</span>
                            <span class="info-value">${new Date(pago.fechaEmision).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Fecha de Vencimiento:</span>
                            <span class="info-value">${new Date(pago.fechaVencimiento).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        ${pago.fechaPago ? `
                        <div class="info-item">
                            <span class="info-label">Fecha de Pago:</span>
                            <span class="info-value">${new Date(pago.fechaPago).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${pago.descripcion ? `
                    <div class="ui segment">
                        <h4 class="ui header">
                            <i class="sticky note icon"></i>
                            Descripción
                        </h4>
                        <p>${pago.descripcion}</p>
                    </div>
                    ` : ''}
                    
                    <div class="ui segment">
                        <h4 class="ui header">
                            <i class="credit card icon"></i>
                            Método de Pago
                        </h4>
                        <div class="info-item">
                            <span class="info-label">Método:</span>
                            <span class="info-value">${metodoTexto}</span>
                        </div>
                        ${pago.comprobante ? `
                        <div class="info-item">
                            <span class="info-label">Comprobante:</span>
                            <span class="info-value">
                                <a href="#" class="ui small basic button ver-comprobante-detalle" data-file="${pago.comprobante}">
                                    <i class="file icon"></i> ${pago.comprobante}
                                </a>
                            </span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="ui segment">
                        <h4 class="ui header">
                            <i class="history icon"></i>
                            Información del Sistema
                        </h4>
                        <div class="info-item">
                            <span class="info-label">Creado por:</span>
                            <span class="info-value">${pago.creadoPor}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Fecha de creación:</span>
                            <span class="info-value">${new Date(pago.fechaCreacion).toLocaleString('es-ES')}</span>
                        </div>
                    </div>
                `);
                
                $('#detalle-actions').html(`
                    <div class="ui button cancel-detalle">Cerrar</div>
                    <button class="ui primary button editar-desde-detalle" data-id="${pago.id}">
                        <i class="edit icon"></i> Editar
                    </button>
                    ${pago.estado === 'pendiente' ? `
                    <button class="ui green button pagar-desde-detalle" data-id="${pago.id}">
                        <i class="check icon"></i> Marcar como Pagado
                    </button>
                    ` : ''}
                    <button class="ui red button eliminar-desde-detalle" data-id="${pago.id}">
                        <i class="trash icon"></i> Eliminar
                    </button>
                `);
                
                // Eventos de los botones del modal
                $('.cancel-detalle').click(function() {
                    $('#detalle-modal').modal('hide');
                });
                
                $('.editar-desde-detalle').click(function() {
                    const id = $(this).data('id');
                    $('#detalle-modal').modal('hide');
                    setTimeout(() => editarPago(id), 300);
                });
                
                $('.pagar-desde-detalle').click(function() {
                    const id = $(this).data('id');
                    $('#detalle-modal').modal('hide');
                    setTimeout(() => confirmarMarcarPagado(id), 300);
                });
                
                $('.eliminar-desde-detalle').click(function() {
                    const id = $(this).data('id');
                    $('#detalle-modal').modal('hide');
                    setTimeout(() => confirmarEliminarPago(id), 300);
                });
                
                $('.ver-comprobante-detalle').click(function(e) {
                    e.preventDefault();
                    const file = $(this).data('file');
                    verComprobante(file);
                });
                
                $('#detalle-modal').modal('show');
            }
            
            function confirmarEliminarPago(id) {
                currentPagoId = id;
                const pago = pagos.find(p => p.id === id);
                
                $('#confirm-header').text('Confirmar Eliminación');
                $('#confirm-message').text(`¿Estás seguro de eliminar el pago #${pago.id} de ${pago.residente} por Bs. ${pago.monto.toFixed(2)}? Esta acción no se puede deshacer.`);
                
                $('.confirm-delete').show();
                $('.confirm-marcar-pagado').hide();
                
                $('#confirm-modal').modal('show');
            }
            
            function eliminarPago(id) {
                const index = pagos.findIndex(p => p.id === id);
                if (index !== -1) {
                    pagos.splice(index, 1);
                    mostrarNotificacion('Pago eliminado exitosamente', 'success');
                    cargarPagos();
                }
                
                $('#confirm-modal').modal('hide');
            }
            
            function confirmarMarcarPagado(id) {
                currentPagoId = id;
                const pago = pagos.find(p => p.id === id);
                
                $('#confirm-header').text('Confirmar Pago');
                $('#confirm-message').text(`¿Marcar el pago #${pago.id} de ${pago.residente} por Bs. ${pago.monto.toFixed(2)} como pagado?`);
                
                $('.confirm-delete').hide();
                $('.confirm-marcar-pagado').show();
                
                $('#confirm-modal').modal('show');
            }
            
            function marcarComoPagado(id) {
                const pago = pagos.find(p => p.id === id);
                if (pago) {
                    pago.estado = 'pagado';
                    pago.fechaPago = new Date().toISOString().split('T')[0];
                    pago.metodo = pago.metodo || 'efectivo';
                    
                    mostrarNotificacion('Pago marcado como realizado', 'success');
                    cargarPagos();
                }
                
                $('#confirm-modal').modal('hide');
            }
            
            function verComprobante(fileName) {
                // Aquí iría la lógica para mostrar el comprobante
                // Por ahora solo mostramos una alerta
                mostrarNotificacion(`Mostrando comprobante: ${fileName}`, 'info');
            }
            
            function exportarPagos() {
                // Crear datos para exportar
                let datosExportar = [];
                let pagosFiltrados = filtrarPagosLista(pagos);
                
                pagosFiltrados.forEach(pago => {
                    datosExportar.push({
                        'ID': pago.id,
                        'Residente': pago.residente,
                        'Apartamento': pago.apartamento,
                        'Concepto': pago.concepto,
                        'Monto': `Bs. ${pago.monto.toFixed(2)}`,
                        'Fecha Emisión': pago.fechaEmision,
                        'Fecha Vencimiento': pago.fechaVencimiento,
                        'Fecha Pago': pago.fechaPago || 'No pagado',
                        'Estado': pago.estado,
                        'Método': pago.metodo || 'No especificado',
                        'Descripción': pago.descripcion || ''
                    });
                });
                
                // Convertir a CSV
                let csv = '';
                
                // Encabezados
                const encabezados = Object.keys(datosExportar[0] || {});
                csv += encabezados.join(',') + '\n';
                
                // Datos
                datosExportar.forEach(fila => {
                    const valores = encabezados.map(header => {
                        let valor = fila[header];
                        // Escapar comas y comillas
                        if (typeof valor === 'string' && (valor.includes(',') || valor.includes('"'))) {
                            valor = `"${valor.replace(/"/g, '""')}"`;
                        }
                        return valor;
                    });
                    csv += valores.join(',') + '\n';
                });
                
                // Crear y descargar archivo
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                
                link.setAttribute('href', url);
                link.setAttribute('download', `pagos_condominio_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                mostrarNotificacion('Datos exportados exitosamente', 'success');
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
            $('#form-pago').form({
                fields: {
                    residenteId: 'empty',
                    concepto: 'empty',
                    monto: 'decimal',
                    fechaEmision: 'empty',
                    fechaVencimiento: 'empty'
                }
            });
        });