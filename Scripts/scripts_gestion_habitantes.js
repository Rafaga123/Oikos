let habitantes = []; 
let currentHabitantId = null;
let editingId = null;

// Variables para los filtros
let filtroTexto = '';
let filtroAnio = 'all';

$(document).ready(function() {
    // 1. Inicializar componentes
    $('.ui.dropdown').dropdown();
    $('#habitant-modal').modal();
    $('#payment-modal').modal();
    $('#add-payment-modal').modal();
    
    // Sidebar toggle
    $('#sidebar-toggle').click(() => $('.ui.sidebar').sidebar('toggle'));

    // 2. Cargar Datos
    loadHabitantsFromAPI();

    // ------------------------------------------------------
    // 3. LÓGICA DE BÚSQUEDA Y FILTROS (CORREGIDO)
    // ------------------------------------------------------
    
    // A. Buscador de Texto (Nombre, Cedula, Correo)
    $('.ui.search input').on('input', function() {
        filtroTexto = $(this).val().toLowerCase();
        aplicarFiltros();
    });

    // B. Filtro por Año
    $('.ui.selection.dropdown').dropdown({
        onChange: function(value) {
            filtroAnio = value;
            aplicarFiltros();
        }
    });

    // ------------------------------------------------------
    // 4. EVENTOS DEL MODAL DE EDICIÓN
    // ------------------------------------------------------
    $('#save-habitant').click(async function() {
        if ($('#habitant-form')[0].checkValidity()) {
            const id = editingId;
            const data = {
                nombre: $('input[name="nombre"]').val(),
                apellido: $('input[name="apellido"]').val(),
                // Nota: No enviamos cedula ni correo porque el backend ya no los actualiza
                estado_solicitud: $('select[name="estado"]').val()
            };

            try {
                const res = await fetch(`http://localhost:3000/api/gestor/habitante/${id}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(data)
                });
                
                if(res.ok) {
                    alert('Datos actualizados correctamente');
                    $('#habitant-modal').modal('hide');
                    loadHabitantsFromAPI();
                } else {
                    alert('Error al actualizar');
                }
            } catch (e) { console.error(e); }
        } else {
            $('.ui.form').addClass('error');
        }
    });

    // Evento Guardar Pago (Igual que antes)
    $('#save-payment').click(async function() {
        if ($('#payment-form')[0].checkValidity()) {
            const pagoData = {
                id_usuario: currentHabitantId,
                fecha: $('input[name="fecha"]').val(),
                monto: $('input[name="monto"]').val(),
                metodo: $('select[name="metodo_pago"]').val(),
                banco: $('select[name="banco_emisor"]').val(),
                estatus: $('select[name="estatus"]').val()
            };

            try {
                const res = await fetch('http://localhost:3000/api/gestor/pagos', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(pagoData)
                });

                if (res.ok) {
                    alert('Pago registrado');
                    $('#add-payment-modal').modal('hide');
                    loadHabitantsFromAPI(); 
                } else {
                    alert('Error registrando pago');
                }
            } catch (e) { console.error(e); }
        }
    });
});

// --- FUNCIONES LÓGICAS ---

async function loadHabitantsFromAPI() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:3000/api/gestor/habitantes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Error API');
        
        const data = await res.json();
        
        habitantes = data.map(u => ({
            id: u.id,
            cedula: u.cedula,
            nombre: u.primer_nombre,
            apellido: u.primer_apellido,
            correo: u.email,
            anio_registro: new Date(u.fecha_registro).getFullYear().toString(),
            estado: u.estado_solicitud === 'ACEPTADO' ? 'activo' : 'inactivo',
            rol: u.rol.nombre, // Guardamos el rol para bloquear el botón
            pagos: u.pagos
        }));

        aplicarFiltros(); // Renderizar inicial

    } catch (error) {
        console.error(error);
        $('#habitantes-table-body').html('<tr><td colspan="9">Error cargando datos</td></tr>');
    }
}

// Función maestra de filtrado
function aplicarFiltros() {
    const filtrados = habitantes.filter(h => {
        // 1. Filtro Texto (Busca en nombre, apellido, cedula o correo)
        const coincideTexto = 
            h.nombre.toLowerCase().includes(filtroTexto) ||
            h.apellido.toLowerCase().includes(filtroTexto) ||
            h.cedula.includes(filtroTexto) ||
            h.correo.toLowerCase().includes(filtroTexto);

        // 2. Filtro Año
        const coincideAnio = (filtroAnio === 'all') || (h.anio_registro === filtroAnio);

        return coincideTexto && coincideAnio;
    });

    renderTable(filtrados);
}

function renderTable(data) {
    const tbody = $('#habitantes-table-body');
    tbody.empty();
    
    if (data.length === 0) {
        tbody.append('<tr><td colspan="9" class="center aligned">No se encontraron habitantes</td></tr>');
        return;
    }
    
    data.forEach(habitant => {
        // Lógica del botón Gestor: Si YA es encargado, deshabilitar y cambiar color
        const esGestor = habitant.rol === 'ENCARGADO_COMUNIDAD' || habitant.rol === 'ADMINISTRADOR';
        const btnGestorClass = esGestor ? 'grey disabled' : 'blue';
        const btnGestorIcon = esGestor ? 'user' : 'user shield';
        const btnGestorTitle = esGestor ? 'Ya es gestor' : 'Promover a Gestor';

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
                        <button class="ui compact icon button edit-btn" onclick="openEditModal(${habitant.id})">
                            <i class="edit icon"></i>
                        </button>
                        <button class="ui compact icon button payment-btn" onclick="openPaymentModal(${habitant.id})">
                            <i class="dollar sign icon"></i>
                        </button>
                        <button class="ui compact icon button ${btnGestorClass}" onclick="promoverGestor(${habitant.id})" title="${btnGestorTitle}">
                            <i class="${btnGestorIcon} icon"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.append(row);
    });
}

function renderPaymentHistory(pagos) {
    if (!pagos || pagos.length === 0) return '<span class="ui grey text">Sin pagos</span>';
    
    let html = '<div class="ui list">';
    pagos.slice(0, 2).forEach(pago => {
        let color = 'yellow';
        if (pago.estado === 'APROBADO') color = 'green';
        if (pago.estado === 'RECHAZADO') color = 'red';

        html += `
            <div class="item">
                <div class="content">
                    <div class="header">$${parseFloat(pago.monto).toFixed(2)}</div>
                    <div class="description">
                        ${new Date(pago.fecha_pago).toLocaleDateString()}
                        <span class="ui ${color} horizontal mini label">${pago.estado}</span>
                    </div>
                </div>
            </div>
        `;
    });
    if (pagos.length > 2) html += `<div class="item"><span class="ui grey text">+${pagos.length - 2} más</span></div>`;
    html += '</div>';
    return html;
}

// --- MODALES Y ACCIONES ---

window.openEditModal = function(id) {
    const habitant = habitantes.find(h => h.id === id);
    if (!habitant) return;
    
    editingId = id;
    $('input[name="nombre"]').val(habitant.nombre);
    $('input[name="apellido"]').val(habitant.apellido);
    
    // Campos Bloqueados (CORRECCIÓN)
    const inputCedula = $('input[name="cedula"]');
    const inputCorreo = $('input[name="correo"]');
    
    inputCedula.val(habitant.cedula).prop('disabled', true); // Bloquear
    inputCorreo.val(habitant.correo).prop('disabled', true); // Bloquear
    
    $('select[name="estado"]').dropdown('set selected', habitant.estado);
    $('#modal-title').text('Editar Habitante');
    $('#habitant-modal').modal('show');
};

window.openPaymentModal = function(id) {
    currentHabitantId = id;
    const habitant = habitantes.find(h => h.id === id);
    $('#payment-habitant-name').text(`Pagos de ${habitant.nombre} ${habitant.apellido}`);
    
    const list = $('#payment-history-list');
    list.empty();
    
    if(!habitant.pagos || habitant.pagos.length === 0) {
        list.append('<p>No hay pagos registrados.</p>');
    } else {
        habitant.pagos.forEach(pago => {
            let color = 'yellow';
            if (pago.estado === 'APROBADO') color = 'green';
            if (pago.estado === 'RECHAZADO') color = 'red';
            
            list.append(`
                <div class="item">
                    <div class="content">
                        <div class="header">Monto: $${pago.monto}</div>
                        <div class="meta">Fecha: ${new Date(pago.fecha_pago).toLocaleDateString()}</div>
                        <div class="description">
                            Concepto: ${pago.concepto} <br>
                            Estado: <span class="ui ${color} label">${pago.estado}</span>
                        </div>
                    </div>
                </div>
                <div class="ui divider"></div>
            `);
        });
    }
    $('#payment-modal').modal('show');
    $('#add-payment').off('click').on('click', () => $('#add-payment-modal').modal('show'));
};

window.promoverGestor = async function(id) {
    // Verificamos si ya es gestor antes de preguntar (doble seguridad)
    const user = habitantes.find(h => h.id === id);
    if (user && (user.rol === 'ENCARGADO_COMUNIDAD' || user.rol === 'ADMINISTRADOR')) return;

    if(!confirm('¿Seguro que quieres dar permisos de GESTOR?')) return;
    
    try {
        const res = await fetch(`http://localhost:3000/api/gestor/promover/${id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if(res.ok) {
            alert('Usuario promovido correctamente.');
            loadHabitantsFromAPI(); 
        } else {
            alert('Error al promover.');
        }
    } catch(e) { console.error(e); }
};

window.exportarExcel = function() {
    const tabla = document.getElementById("miTabla");
    const html = tabla.outerHTML;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = "habitantes_oikos.xls";
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
};