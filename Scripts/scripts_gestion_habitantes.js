// Datos de ejemplo para simular una base de datos
        let habitantes = [
            { 
                id: 1, 
                cedula: "12345678", 
                nombre: "María", 
                apellido: "González", 
                correo: "maria.gonzalez@email.com",
                anio_registro: "2023", 
                estado: "activo",
                pagos: [
                    { fecha: "2023-05-15", monto: 150.00, metodo_pago: "transferencia", banco_emisor: "banco1", estatus: "validado" },
                    { fecha: "2023-04-10", monto: 150.00, metodo_pago: "transferencia", banco_emisor: "banco1", estatus: "validado" }
                ]
            },
            { 
                id: 2, 
                cedula: "23456789", 
                nombre: "Carlos", 
                apellido: "López", 
                correo: "carlos.lopez@email.com",
                anio_registro: "2022", 
                estado: "activo",
                pagos: [
                    { fecha: "2023-05-20", monto: 120.00, metodo_pago: "efectivo", banco_emisor: "", estatus: "pendiente" }
                ]
            },
            { 
                id: 3, 
                cedula: "34567890", 
                nombre: "Ana", 
                apellido: "Martínez", 
                correo: "ana.martinez@email.com",
                anio_registro: "2023", 
                estado: "activo",
                pagos: [
                    { fecha: "2023-05-18", monto: 180.00, metodo_pago: "transferencia", banco_emisor: "banco2", estatus: "validado" },
                    { fecha: "2023-04-18", monto: 180.00, metodo_pago: "transferencia", banco_emisor: "banco2", estatus: "rechazado" }
                ]
            },
            { 
                id: 4, 
                cedula: "45678901", 
                nombre: "Javier", 
                apellido: "Rodríguez", 
                correo: "javier.rodriguez@email.com",
                anio_registro: "2021", 
                estado: "inactivo",
                pagos: []
            }
        ];

        let editingId = null;
        let currentHabitantId = null;

        $(document).ready(function() {
            // Inicializar componentes de Semantic UI
            $('.ui.dropdown').dropdown();
            $('.ui.search').search({
                source: habitantes.map(h => ({
                    title: `${h.nombre} ${h.apellido}`,
                    id: h.id
                }))
            });

            
            // Controlar sidebar en móviles
            $('#sidebar-toggle').click(function() {
                $('.ui.sidebar').sidebar('toggle');
            });

            //fijar sidebar
            if ($(window).width() > 768) {
                $('.ui.sidebar').addClass('hide');
                $('.ui.sidebar').sidebar({
                    context: $('.pusher'),
                    transition: 'overlay'
                });
            }
            
            // Inicializar modales
            $('#habitant-modal').modal({
                onHide: function() {
                    $('#habitant-form')[0].reset();
                    editingId = null;
                    $('#modal-title').text('Agregar Nuevo Habitante');
                }
            });
            
            $('#payment-modal').modal();
            $('#add-payment-modal').modal();
            
            // Cargar tabla con datos
            loadHabitantsTable();
            
            // Abrir modal para agregar habitante
            $('#add-habitant').click(function() {
                $('#habitant-modal').modal('show');
            });
            
            // Guardar habitante
            $('#save-habitant').click(function() {
                if ($('#habitant-form')[0].checkValidity()) {
                    const formData = {
                        cedula: $('input[name="cedula"]').val(),
                        nombre: $('input[name="nombre"]').val(),
                        apellido: $('input[name="apellido"]').val(),
                        correo: $('input[name="correo"]').val(),
                        anio_registro: $('select[name="anio_registro"]').val(),
                        estado: $('select[name="estado"]').val(),
                        pagos: []
                    };
                    
                    if (editingId) {
                        // Editar habitante existente
                        const index = habitantes.findIndex(h => h.id === editingId);
                        if (index !== -1) {
                            // Mantener los pagos existentes
                            formData.pagos = habitantes[index].pagos;
                            habitantes[index] = { ...habitantes[index], ...formData };
                        }
                    } else {
                        // Agregar nuevo habitante
                        const newId = Math.max(...habitantes.map(h => h.id)) + 1;
                        habitantes.push({
                            id: newId,
                            ...formData
                        });
                    }
                    
                    loadHabitantsTable();
                    $('#habitant-modal').modal('hide');
                } else {
                    $('.ui.form').addClass('error');
                }
            });
            
            // Filtrar tabla por año
            $('.ui.selection.dropdown').dropdown({
                onChange: function(value) {
                    if (value === 'all') {
                        loadHabitantsTable();
                    } else {
                        const filtered = habitantes.filter(h => h.anio_registro === value);
                        renderTable(filtered);
                    }
                }
            });
            
            // Buscar habitantes
            $('.ui.search').search({
                onSelect: function(result) {
                    const habitant = habitantes.find(h => h.id === result.id);
                    if (habitant) {
                        const filtered = [habitant];
                        renderTable(filtered);
                    }
                }
            });
            
            // Agregar pago
            $('#add-payment').click(function() {
                $('#add-payment-modal').modal('show');
            });
            
            // Guardar pago
            $('#save-payment').click(function() {
                if ($('#payment-form')[0].checkValidity()) {
                    const formData = {
                        fecha: $('input[name="fecha"]').val(),
                        monto: parseFloat($('input[name="monto"]').val()),
                        metodo_pago: $('select[name="metodo_pago"]').val(),
                        banco_emisor: $('select[name="banco_emisor"]').val(),
                        estatus: $('select[name="estatus"]').val()
                    };
                    
                    const habitantIndex = habitantes.findIndex(h => h.id === currentHabitantId);
                    if (habitantIndex !== -1) {
                        if (!habitantes[habitantIndex].pagos) {
                            habitantes[habitantIndex].pagos = [];
                        }
                        habitantes[habitantIndex].pagos.push(formData);
                        loadPaymentHistory(currentHabitantId);
                    }
                    
                    $('#add-payment-modal').modal('hide');
                    $('#payment-form')[0].reset();
                } else {
                    $('#payment-form').addClass('error');
                }
            });
        });
        
        function loadHabitantsTable() {
            renderTable(habitantes);
        }
        
        function renderTable(data) {
            const tbody = $('#habitantes-table-body');
            tbody.empty();
            
            if (data.length === 0) {
                tbody.append(`
                    <tr>
                        <td colspan="9" class="center aligned">No se encontraron habitantes</td>
                    </tr>
                `);
                return;
            }
            
            data.forEach(habitant => {
                const row = `
                    <tr>
                        <td>${habitant.id}</td>
                        <td>${habitant.cedula}</td>
                        <td>${habitant.nombre}</td>
                        <td>${habitant.apellido}</td>
                        <td>${habitant.correo}</td>
                        <td>${habitant.anio_registro}</td>
                        <td>
                            <span class="ui ${habitant.estado === 'activo' ? 'green' : 'red'} horizontal label">
                                ${habitant.estado === 'activo' ? 'Activo' : 'Inactivo'}
                            </span>
                        </td>
                        <td class="payment-history">
                            ${renderPaymentHistory(habitant.pagos)}
                        </td>
                        <td>
                            <div class="table-actions">
                                <button class="ui compact icon button edit-btn" data-id="${habitant.id}">
                                    <i class="edit icon"></i>
                                </button>
                                <button class="ui compact icon button payment-btn" data-id="${habitant.id}">
                                    <i class="dollar sign icon"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
                tbody.append(row);
            });
            
            // Agregar eventos a los botones
            $('.edit-btn').click(function() {
                const id = $(this).data('id');
                editHabitant(id);
            });
            
            $('.payment-btn').click(function() {
                const id = $(this).data('id');
                showPaymentHistory(id);
            });
            
            $('.delete-btn').click(function() {
                const id = $(this).data('id');
                deleteHabitant(id);
            });
        }
        
        function renderPaymentHistory(pagos) {
            if (!pagos || pagos.length === 0) {
                return '<span class="ui grey text">Sin pagos</span>';
            }
            
            let html = '<div class="ui list">';
            pagos.slice(0, 2).forEach(pago => {
                const statusColor = pago.estatus === 'validado' ? 'green' : 
                                  pago.estatus === 'pendiente' ? 'yellow' : 'red';
                html += `
                    <div class="item">
                        <div class="content">
                            <div class="header">$${pago.monto.toFixed(2)}</div>
                            <div class="description">
                                ${pago.fecha} 
                                <span class="ui ${statusColor} horizontal mini label">${pago.estatus}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            if (pagos.length > 2) {
                html += `<div class="item">
                    <div class="content">
                        <span class="ui grey text">+${pagos.length - 2} más</span>
                    </div>
                </div>`;
            }
            
            html += '</div>';
            return html;
        }
        
        function editHabitant(id) {
            const habitant = habitantes.find(h => h.id === id);
            if (habitant) {
                editingId = id;
                $('input[name="nombre"]').val(habitant.nombre);
                $('input[name="apellido"]').val(habitant.apellido);
                $('input[name="cedula"]').val(habitant.cedula);
                $('input[name="correo"]').val(habitant.correo);
                $('select[name="anio_registro"]').dropdown('set selected', habitant.anio_registro);
                $('select[name="estado"]').dropdown('set selected', habitant.estado);
                $('#modal-title').text('Editar Habitante');
                $('#habitant-modal').modal('show');
            }
        }
        
        function showPaymentHistory(id) {
            currentHabitantId = id;
            const habitant = habitantes.find(h => h.id === id);
            if (habitant) {
                $('#payment-habitant-name').text(`Pagos de ${habitant.nombre} ${habitant.apellido}`);
                loadPaymentHistory(id);
                $('#payment-modal').modal('show');
            }
        }
        
        function loadPaymentHistory(id) {
            const habitant = habitantes.find(h => h.id === id);
            const paymentList = $('#payment-history-list');
            paymentList.empty();
            
            if (!habitant.pagos || habitant.pagos.length === 0) {
                paymentList.append('<p>No hay pagos registrados</p>');
                return;
            }
            
            habitant.pagos.forEach((pago, index) => {
                const statusColor = pago.estatus === 'validado' ? 'green' : 
                                  pago.estatus === 'pendiente' ? 'yellow' : 'red';
                
                const paymentItem = `
                    <div class="item">
                        <div class="content">
                            <div class="header">Pago #${index + 1} - $${pago.monto.toFixed(2)}</div>
                            <div class="meta">
                                <span class="date">${pago.fecha}</span>
                                <span class="ui ${statusColor} horizontal mini label">${pago.estatus}</span>
                            </div>
                            <div class="description">
                                <p><strong>Método:</strong> ${pago.metodo_pago}</p>
                                <p><strong>Banco:</strong> ${pago.banco_emisor || 'No aplica'}</p>
                            </div>
                        </div>
                    </div>
                `;
                paymentList.append(paymentItem);
            });
        }
        
        function deleteHabitant(id) {
            if (confirm('¿Estás seguro de que deseas eliminar este habitante?')) {
                habitantes = habitantes.filter(h => h.id !== id);
                loadHabitantsTable();
            }
        }

        const allToggleSelectors = '#sidebar-toggle, .sidebar-toggle-btn';

        //Inicializamos y controlamos el sidebar usando la API de Semantic UI
    $('.ui.sidebar').sidebar({
        context: $('.pusher'),
        transition: 'overlay'
    });

    $(allToggleSelectors).click(function() {
        //La función 'toggle' lo abrirá si está cerrado, y lo cerrará si está abierto.
        $('.ui.sidebar').sidebar('toggle');

    });
    
function exportarExcel() {
        // Obtener la tabla
        const tabla = document.getElementById("miTabla");
        
        // Crear contenido HTML para el archivo
        let html = tabla.outerHTML;
        
        // Crear un blob (archivo binario) con el contenido
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        
        // Crear un enlace temporal para descargar
        const enlace = document.createElement("a");
        enlace.href = URL.createObjectURL(blob);
        enlace.download = "tabla.xls"; // Nombre del archivo
        
        // Simular click en el enlace
        document.body.appendChild(enlace);
        enlace.click();
        
        // Limpiar
        document.body.removeChild(enlace);
    }
    

    
