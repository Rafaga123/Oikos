let cuentasCondominio = [];
let metodoActual = 'transferencia'; // Valor por defecto

$(document).ready(function() {
    // 1. Inicializar componentes visuales de Semantic UI
    $('.ui.dropdown').dropdown();
    $('.ui.sidebar').sidebar({ context: $('.pusher'), transition: 'overlay' });
    $('#sidebar-toggle').click(() => $('.ui.sidebar').sidebar('toggle'));

    // 2. Cargar las cuentas configuradas por el Gestor
    cargarCuentasCondominio();

    // 3. Control de pestañas (Métodos de Pago)
    $('.pm-btn').click(function() {
        // Cambiar estilo activo
        $('.pm-btn').removeClass('active');
        $(this).addClass('active');
        
        // Cambiar lógica según botón clickeado
        metodoActual = $(this).data('method'); // 'transferencia' o 'pago_movil'
        
        // Refrescar la lista de cuentas destino
        actualizarSelectDestino();
    });

    // 4. Mostrar vista previa al seleccionar una cuenta destino
    $('#bancoDestino').change(mostrarPreviewBanco);

    // 5. Manejar el envío del formulario
    $('#form-reportar-pago').submit(enviarPago);
});

async function cargarCuentasCondominio() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:3000/api/bancos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if(res.ok) {
            cuentasCondominio = await res.json();
            // Una vez cargados los datos, llenamos el select inicial
            actualizarSelectDestino();
        } else {
            console.error("Error al cargar cuentas bancarias del servidor");
        }
    } catch(e) { 
        console.error("Error de conexión:", e); 
    }
}

function actualizarSelectDestino() {
    const select = $('#bancoDestino');
    select.empty(); // Limpiar opciones previas
    select.append('<option value="">Selecciona la cuenta destino...</option>');
    
    // Ocultar la tarjeta de detalle hasta que seleccione algo
    $('#bankPreview').hide();
    $('#bankPreviewEmpty').show();

    // Filtrar las cuentas según el método seleccionado
    // Lógica: Si es 'pago_movil', buscamos cuentas con campo 'telefono'. 
    //         Si es 'transferencia', buscamos cuentas SIN 'telefono' (o que sean explícitamente cuentas).
    const cuentasFiltradas = cuentasCondominio.filter(c => {
        if(metodoActual === 'pago_movil') {
            return c.telefono !== null && c.telefono !== "";
        } else {
            return !c.telefono; // Asumimos que si no tiene teléfono, es una cuenta corriente/ahorro estándar
        }
    });

    // Llenar el select
    if (cuentasFiltradas.length === 0) {
        select.append('<option value="" disabled>No hay cuentas configuradas para este método</option>');
    } else {
        cuentasFiltradas.forEach(c => {
            // Personalizamos el texto de la opción para que sea claro
            let textoOpcion = "";
            if (metodoActual === 'pago_movil') {
                textoOpcion = `${c.banco} - ${c.telefono}`; 
            } else {
                // Para transferencia mostramos Banco y últimos 4 dígitos de la cuenta
                const ultimosDigitos = c.numero_cuenta ? c.numero_cuenta.slice(-4) : '****';
                textoOpcion = `${c.banco} - Cuenta ...${ultimosDigitos}`;
            }
            
            // Usamos el ID de la base de datos como value
            select.append(`<option value="${c.id}">${textoOpcion}</option>`);
        });
    }
    
    // Si usas Semantic UI dropdown avanzado, podrías necesitar: $('#bancoDestino').dropdown('refresh');
}

function mostrarPreviewBanco() {
    const idCuenta = $(this).val();
    
    // Si no hay selección válida, ocultar
    if (!idCuenta) {
        $('#bankPreview').hide();
        $('#bankPreviewEmpty').show();
        return;
    }

    // Buscar los datos completos de la cuenta seleccionada en el array
    const cuenta = cuentasCondominio.find(c => c.id == idCuenta);

    if(cuenta) {
        $('#bankPreviewEmpty').hide();
        $('#bankPreview').show();
        
        // Llenar datos de la tarjeta visual
        $('#preview-banco').text(cuenta.banco);
        $('#preview-titular').text(cuenta.titular);
        
        let infoHtml = '';
        if(metodoActual === 'pago_movil') {
            infoHtml = `
                <div style="margin-top:10px; font-size: 0.95em;">
                    <p><i class="mobile alternate icon"></i> <strong>Tel:</strong> ${cuenta.telefono}</p>
                    <p><i class="id card icon"></i> <strong>C.I./RIF:</strong> ${cuenta.cedula_rif}</p>
                </div>
            `;
        } else {
            infoHtml = `
                <div style="margin-top:10px; font-size: 0.95em;">
                    <p><i class="hashtag icon"></i> <strong>Cuenta:</strong> <br>
                    <span style="font-family: monospace; letter-spacing: 1px;">${cuenta.numero_cuenta}</span></p>
                    <p><i class="id card icon"></i> <strong>RIF:</strong> ${cuenta.cedula_rif}</p>
                    <p><i class="info circle icon"></i> <strong>Tipo:</strong> ${cuenta.tipo_cuenta}</p>
                </div>
            `;
        }
        $('#preview-info').html(infoHtml);
    }
}

async function enviarPago(e) {
    e.preventDefault();
    
    // 1. Recoger datos del formulario
    const bancoDestinoId = $('#bancoDestino').val();
    const bancoEmisorNombre = $('#bancoEmisor').val(); // Aquí toma lo que el usuario seleccionó de la lista completa
    const concepto = $('#conceptoPago').val();
    const referencia = $('#codigoRef').val();
    const monto = $('#monto').val();
    const fecha = $('#fechaPago').val();
    const archivo = document.getElementById('voucherFile').files[0];

    // 2. Validaciones básicas
    if(!bancoDestinoId || !bancoEmisorNombre || !monto || !referencia || !fecha) {
        Swal.fire({
            icon: 'warning',
            title: 'Faltan datos',
            text: 'Por favor completa todos los campos obligatorios (*)'
        });
        return;
    }

    if (!archivo) {
        Swal.fire({
            icon: 'warning',
            title: 'Falta el comprobante',
            text: 'Debes adjuntar una imagen o PDF del comprobante de pago.'
        });
        return;
    }

    // 3. Preparar datos para enviar (FormData para soportar archivo)
    const formData = new FormData();
    formData.append('id_cuenta_destino', bancoDestinoId);
    formData.append('banco_origen', bancoEmisorNombre);
    formData.append('concepto', concepto);
    formData.append('referencia', referencia);
    formData.append('monto', monto);
    formData.append('fecha_pago', fecha);
    formData.append('metodo_pago', metodoActual === 'pago_movil' ? 'PAGO_MOVIL' : 'TRANSFERENCIA');
    formData.append('comprobante', archivo);

    // Obtener token
    const token = localStorage.getItem('token');
    
    // Estado de carga en el botón
    const btnSubmit = $(this).find('button[type="submit"]');
    const textoOriginal = btnSubmit.text();
    btnSubmit.addClass('loading disabled');

    try {
        // 4. Petición al Backend
        // Asegúrate de tener este endpoint configurado en tu backend/index.js
        const res = await fetch('http://localhost:3000/api/pagos/reportar', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`
                // NOTA: No agregamos 'Content-Type' aquí, fetch lo genera automáticamente para FormData
            },
            body: formData
        });

        const data = await res.json();

        if(res.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Pago Reportado',
                text: 'Tu pago ha sido enviado exitosamente para revisión.',
                confirmButtonText: 'Ir a Inicio'
            }).then(() => {
                window.location.href = './home_page.html';
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.error || 'Ocurrió un problema al reportar el pago.'
            });
        }
    } catch(err) {
        console.error(err);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor. Intenta más tarde.'
        });
    } finally {
        // Restaurar botón
        btnSubmit.removeClass('loading disabled');
        btnSubmit.text(textoOriginal);
    }
}