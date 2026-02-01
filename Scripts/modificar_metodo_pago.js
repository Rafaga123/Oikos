let cuentasBancarias = [];

$(document).ready(function() {
    $('.ui.dropdown').dropdown();
    $('.ui.sidebar').sidebar({ context: $('.pusher'), transition: 'overlay' });
    $('#sidebar-toggle').click(() => $('.ui.sidebar').sidebar('toggle'));

    // Tabs
    $('.tab-btn').click(function() {
        $('.tab-btn').removeClass('active');
        $('.tab-content').removeClass('active');
        $(this).addClass('active');
        $('#' + $(this).data('tab')).addClass('active');
    });

    cargarCuentas();

    // Abrir modal para Pago Movil
    $('#btn-add-pagomovil').click(() => abrirModal('pagomovil'));
    
    // Abrir modal para Transferencia
    $('#btn-add-transferencia').click(() => abrirModal('transferencia'));

    // Guardar
    $('#btn-save-cuenta').click(guardarCuenta);
});

async function cargarCuentas() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/bancos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) {
            cuentasBancarias = await res.json();
            renderizarCuentas();
        }
    } catch(e) { console.error(e); }
}

function renderizarCuentas() {
    const containerMovil = $('#container-pagomovil');
    const containerTransf = $('#container-transferencias');
    
    containerMovil.empty();
    containerTransf.empty();

    const pagoMovil = cuentasBancarias.filter(c => c.telefono);
    const transferencias = cuentasBancarias.filter(c => !c.telefono);

    // Render Pago Móvil
    pagoMovil.forEach(c => {
        containerMovil.append(`
            <div class="bank-card-admin">
                <div class="bank-header-admin">
                    <h3 class="bank-name-admin"><i class="university icon"></i> ${c.banco}</h3>
                    <div class="ui icon buttons mini">
                        <button class="ui button" onclick="editarCuenta(${c.id}, 'pagomovil')"><i class="edit icon"></i></button>
                        <button class="ui button red" onclick="eliminarCuenta(${c.id})"><i class="trash icon"></i></button>
                    </div>
                </div>
                <div class="bank-details">
                    <p><b>Titular:</b> ${c.titular}</p>
                    <p><b>C.I./RIF:</b> ${c.cedula_rif}</p>
                    <p><b>Teléfono:</b> ${c.telefono}</p>
                </div>
            </div>
        `);
    });

    // Render Transferencias
    transferencias.forEach(c => {
        containerTransf.append(`
            <div class="bank-card-admin">
                <div class="bank-header-admin">
                    <h3 class="bank-name-admin"><i class="university icon"></i> ${c.banco}</h3>
                    <div class="ui icon buttons mini">
                        <button class="ui button" onclick="editarCuenta(${c.id}, 'transferencia')"><i class="edit icon"></i></button>
                        <button class="ui button red" onclick="eliminarCuenta(${c.id})"><i class="trash icon"></i></button>
                    </div>
                </div>
                <div class="bank-details">
                    <p><b>Titular:</b> ${c.titular}</p>
                    <p><b>C.I./RIF:</b> ${c.cedula_rif}</p>
                    <p><b>Cuenta:</b> ${c.numero_cuenta}</p>
                    <p><b>Tipo:</b> ${c.tipo_cuenta}</p>
                </div>
            </div>
        `);
    });

    // Controlar visibilidad de botones "Agregar" (Máx 3)
    if (pagoMovil.length >= 3) $('#btn-add-pagomovil').hide();
    else $('#btn-add-pagomovil').show();

    if (transferencias.length >= 3) $('#btn-add-transferencia').hide();
    else $('#btn-add-transferencia').show();
}

function abrirModal(tipo, idEdicion = null) {
    $('#form-cuenta')[0].reset();
    $('#cuenta-banco').dropdown('clear');
    $('#cuenta-tipo').dropdown('clear');
    $('#cuenta-id').val('');
    $('#cuenta-tipo-metodo').val(tipo);

    if (tipo === 'pagomovil') {
        $('#field-telefono').show();
        $('#field-numero-cuenta').hide();
        $('#field-tipo-cuenta').hide();
        $('#modal-title').text('Configurar Pago Móvil');
    } else {
        $('#field-telefono').hide();
        $('#field-numero-cuenta').show();
        $('#field-tipo-cuenta').show();
        $('#modal-title').text('Configurar Transferencia');
    }

    if (idEdicion) {
        const c = cuentasBancarias.find(x => x.id === idEdicion);
        if (c) {
            $('#cuenta-id').val(c.id);
            $('#cuenta-banco').dropdown('set selected', c.banco);
            $('#cuenta-titular').val(c.titular);
            $('#cuenta-cedula').val(c.cedula_rif);
            
            if (tipo === 'pagomovil') {
                $('#cuenta-telefono').val(c.telefono);
            } else {
                $('#cuenta-numero').val(c.numero_cuenta);
                $('#cuenta-tipo').dropdown('set selected', c.tipo_cuenta);
            }
        }
    }

    $('#modal-cuenta').modal('show');
}

window.editarCuenta = function(id, tipo) {
    abrirModal(tipo, id);
};

window.eliminarCuenta = async function(id) {
    if (!confirm('¿Eliminar esta cuenta?')) return;
    
    const token = localStorage.getItem('token');
    try {
        
        const res = await fetch(`http://localhost:3000/api/gestor/bancos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if(res.ok) {
            cargarCuentas();
        }
    } catch(e) { console.error(e); }
};

async function guardarCuenta() {
    const tipoMetodo = $('#cuenta-tipo-metodo').val();
    const id = $('#cuenta-id').val();
    
    const payload = {
        id: id ? parseInt(id) : null,
        banco: $('#cuenta-banco').val(),
        titular: $('#cuenta-titular').val(),
        cedula_rif: $('#cuenta-cedula').val(),
        // Pago Movil
        telefono: tipoMetodo === 'pagomovil' ? $('#cuenta-telefono').val() : null,
        // Transferencia
        numero_cuenta: tipoMetodo === 'transferencia' ? $('#cuenta-numero').val() : 'N/A',
        tipo_cuenta: tipoMetodo === 'transferencia' ? $('#cuenta-tipo').val() : 'corriente'
    };

    if (!payload.banco || !payload.titular || !payload.cedula_rif) {
        return Swal.fire('Error', 'Completa los campos obligatorios', 'warning');
    }

    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/gestor/bancos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            $('#modal-cuenta').modal('hide');
            Swal.fire('Guardado', 'Datos actualizados', 'success');
            cargarCuentas();
        } else {
            Swal.fire('Error', 'No se pudo guardar', 'error');
        }
    } catch(e) { console.error(e); }
}