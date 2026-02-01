let cuentasCondominio = [];
let metodoActual = 'pago_movil'; // CAMBIO: Por defecto Pago Móvil

$(document).ready(function() {
    // 1. Inicializar Dropdowns
    $('.ui.dropdown').dropdown();

    // 2. Inicializar Sidebar
    $('.ui.sidebar').sidebar({ 
        transition: 'overlay',
        dimPage: false 
    });
    
    $('#sidebar-toggle').click(function(e) {
        e.preventDefault();
        $('.ui.sidebar').sidebar('toggle');
    });

    // 3. Cargar las cuentas
    cargarCuentasCondominio();

    // 4. Control de Pestañas
    $('.pm-btn').click(function() {
        $('.pm-btn').removeClass('active');
        $(this).addClass('active');
        metodoActual = $(this).data('method'); 
        actualizarSelectDestino();
    });

    // 5. Evento al cambiar banco destino
    $('#bancoDestino').change(mostrarPreviewBanco);

    // 6. Envío del Formulario
    $('#form-reportar-pago').submit(enviarPago);
});

async function cargarCuentasCondominio() {
    const token = localStorage.getItem('token');
    const select = $('#bancoDestino');

    try {
        const res = await fetch('http://localhost:3000/api/bancos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if(res.ok) {
            cuentasCondominio = await res.json();
            actualizarSelectDestino();
        } else {
            console.error("Error servidor:", res.status);
            select.html('<option value="">Error cargando cuentas</option>');
        }
    } catch(e) { 
        console.error("Error conexión:", e); 
        select.html('<option value="">Error de conexión</option>');
    }
}

function actualizarSelectDestino() {
    const select = $('#bancoDestino');
    select.empty(); 
    select.append('<option value="">Selecciona la cuenta destino...</option>');
    
    $('#bankPreview').hide();
    $('#bankPreviewEmpty').show();

    const cuentasFiltradas = cuentasCondominio.filter(c => {
        if(metodoActual === 'pago_movil') {
            return c.telefono && c.telefono.trim() !== "";
        } else {
            return !c.telefono || c.telefono.trim() === "";
        }
    });

    if (cuentasFiltradas.length === 0) {
        select.append('<option value="" disabled>No hay cuentas disponibles</option>');
    } else {
        cuentasFiltradas.forEach(c => {
            let texto = "";
            if (metodoActual === 'pago_movil') {
                texto = `${c.banco} - ${c.telefono}`; 
            } else {
                const ultimos = c.numero_cuenta ? c.numero_cuenta.slice(-4) : '****';
                texto = `${c.banco} - *${ultimos}`;
            }
            select.append(`<option value="${c.id}">${texto}</option>`);
        });
    }
}

function mostrarPreviewBanco() {
    const idCuenta = $(this).val();
    if (!idCuenta) {
        $('#bankPreview').hide();
        $('#bankPreviewEmpty').show();
        return;
    }

    const cuenta = cuentasCondominio.find(c => c.id == idCuenta);

    if(cuenta) {
        $('#bankPreviewEmpty').hide();
        $('#bankPreview').css('display', 'flex');
        
        $('#preview-banco').text(cuenta.banco);
        $('#preview-titular').text(cuenta.titular);
        
        let htmlInfo = '';
        if(metodoActual === 'pago_movil') {
            htmlInfo = `<br>Tel: ${cuenta.telefono}<br>CI/RIF: ${cuenta.cedula_rif}`;
        } else {
            htmlInfo = `<br>Cuenta: <span style="font-family:monospace">${cuenta.numero_cuenta}</span><br>RIF: ${cuenta.cedula_rif}<br>Tipo: ${cuenta.tipo_cuenta}`;
        }
        $('#preview-info').html(htmlInfo);
    }
}

async function enviarPago(e) {
    e.preventDefault();
    
    const bancoDestinoId = $('#bancoDestino').val();
    const bancoEmisor = $('#bancoEmisor').val();
    const concepto = $('#conceptoPago').val();
    const referencia = $('#codigoRef').val();
    const monto = $('#monto').val();
    const fecha = $('#fechaPago').val();
    const archivo = document.getElementById('voucherFile').files[0];

    if(!bancoDestinoId) return Swal.fire('Error', 'Selecciona el banco destino', 'error');
    if(!monto || !referencia || !fecha) return Swal.fire('Error', 'Faltan datos obligatorios', 'error');
    if(!archivo) return Swal.fire('Atención', 'Debes subir el comprobante', 'warning');

    const formData = new FormData();
    formData.append('banco_destino_id', bancoDestinoId);
    formData.append('banco_origen', bancoEmisor);
    formData.append('concepto', concepto);
    formData.append('referencia', referencia);
    formData.append('monto', monto);
    formData.append('fecha', fecha);
    formData.append('metodo', metodoActual === 'pago_movil' ? 'PAGO_MOVIL' : 'TRANSFERENCIA');
    formData.append('comprobante', archivo);

    const token = localStorage.getItem('token');
    const btn = $(this).find('button[type="submit"]');
    btn.addClass('loading disabled');

    try {
        const res = await fetch('http://localhost:3000/api/pagos/reportar', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await res.json();

        if(res.ok) {
            Swal.fire('¡Enviado!', 'Tu pago ha sido reportado.', 'success')
            .then(() => window.location.href = 'home_page.html');
        } else {
            Swal.fire('Error', data.error || 'No se pudo reportar el pago', 'error');
        }
    } catch(err) {
        console.error(err);
        Swal.fire('Error', 'Fallo de conexión', 'error');
    } finally {
        btn.removeClass('loading disabled');
    }
}