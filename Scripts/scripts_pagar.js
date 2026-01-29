document.addEventListener('DOMContentLoaded', function() {
    let metodoPago = 'pago_movil'; // Por defecto según tu HTML
    let cuentaSeleccionada = null; // Guardamos la cuenta actual globalmente
    
    // 1. Configuración de Tabs (Método de Pago)
    document.querySelectorAll('.pm-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Cambiar clases visuales
            document.querySelectorAll('.pm-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Actualizar lógica
            metodoPago = this.getAttribute('data-method'); // 'local' (transf) o 'mobile' (pago movil)
            
            // Actualizar la vista del banco inmediatamente si ya hay uno seleccionado
            actualizarVistaBanco();
        });
    });

    // 2. Cargar Bancos de la Comunidad
    const selectBancoDestino = document.getElementById('bancoDestino');
    let cuentasBancarias = []; 

    async function cargarBancos() {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:3000/api/cuentas-bancarias', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            cuentasBancarias = await res.json();
            
            selectBancoDestino.innerHTML = '<option value="">Selecciona...</option>';
            cuentasBancarias.forEach(cuenta => {
                const option = document.createElement('option');
                option.value = cuenta.id;
                option.textContent = `${cuenta.banco} - ${cuenta.titular}`;
                selectBancoDestino.appendChild(option);
            });

        } catch (error) {
            console.error(error);
        }
    }
    cargarBancos();

    // 3. Listener del Select
    selectBancoDestino.addEventListener('change', function() {
        const idSeleccionado = parseInt(this.value);
        cuentaSeleccionada = cuentasBancarias.find(c => c.id === idSeleccionado);
        actualizarVistaBanco();
    });

    // --- FUNCIÓN CLAVE: RENDERIZADO DINÁMICO ---
    function actualizarVistaBanco() {
        const preview = document.getElementById('bankPreview');

        if (!cuentaSeleccionada) {
            preview.innerHTML = `
                <div class="bank-icon">🏦</div>
                <div class="bank-text">Selecciona un banco para ver los datos</div>
            `;
            return;
        }

        // Definimos qué mostrar según el método
        let contenidoDatos = '';

        if (metodoPago === 'mobile') {
            // VISTA PAGO MÓVIL (Resaltar Teléfono y Cédula)
            if (!cuentaSeleccionada.telefono) {
                contenidoDatos = `<div class="ui message warning" style="font-size:0.8em">Esta cuenta no tiene Pago Móvil registrado.</div>`;
            } else {
                contenidoDatos = `
                    <div style="background:#e8f0fe; padding:10px; border-radius:5px; margin-bottom:5px;">
                        <small style="color:#1967d2; font-weight:bold;">DATOS PAGO MÓVIL</small><br>
                        <strong>Banco:</strong> ${cuentaSeleccionada.banco}<br>
                        <strong>Teléfono:</strong> <span style="font-size:1.2em; color:#000;">${cuentaSeleccionada.telefono}</span><br>
                        <strong>Cédula/RIF:</strong> <span style="font-size:1.2em; color:#000;">${cuentaSeleccionada.cedula_rif}</span>
                    </div>
                `;
            }
        } else {
            // VISTA TRANSFERENCIA (Resaltar Número de Cuenta)
            contenidoDatos = `
                <div style="margin-bottom:5px;">
                    <small style="color:#666; font-weight:bold;">DATOS TRANSFERENCIA</small><br>
                    <strong>Titular:</strong> ${cuentaSeleccionada.titular}<br>
                    <strong>Cédula/RIF:</strong> ${cuentaSeleccionada.cedula_rif}<br>
                    <strong>Cuenta (${cuentaSeleccionada.tipo_cuenta}):</strong><br>
                    <span style="font-family:monospace; font-size:1.1em; background:#f0f0f0; padding:2px 5px; border-radius:3px;">
                        ${cuentaSeleccionada.numero_cuenta}
                    </span>
                </div>
            `;
        }

        preview.innerHTML = `
            <div class="bank-icon">🏦</div>
            <div class="bank-info" style="text-align:left; width:100%;">
                <h4 style="margin:0 0 10px 0; color:#2c3e50;">${cuentaSeleccionada.banco}</h4>
                ${contenidoDatos}
            </div>
        `;
    }

    // 4. Mostrar nombre del archivo
    const voucherFile = document.getElementById('voucherFile');
    const voucherName = document.getElementById('voucherName');
    voucherFile.addEventListener('change', function() {
        voucherName.textContent = this.files[0] ? this.files[0].name : '';
    });

    // 5. ENVIAR FORMULARIO
    document.getElementById('btnSubmit').addEventListener('click', async function() {
        const btn = this;
        const token = localStorage.getItem('token');
        
        // Recoger valores
        const bancoDestinoId = selectBancoDestino.value;
        const bancoEmisor = document.getElementById('bancoEmisor').value; 
        const referencia = document.getElementById('codigoRef').value;
        const monto = document.getElementById('monto').value;
        const fecha = document.getElementById('fechaPago').value;
        const archivo = voucherFile.files[0];

        if (!bancoDestinoId || !referencia || !monto || !fecha) {
            mostrarAlerta('danger', 'Completa los campos obligatorios');
            return;
        }

        const formData = new FormData();
        formData.append('banco_destino_id', bancoDestinoId);
        formData.append('banco_origen', bancoEmisor); 
        formData.append('referencia', referencia);
        formData.append('monto', monto);
        formData.append('fecha', fecha);
        formData.append('metodo', metodoPago === 'mobile' ? 'Pago Móvil' : 'Transferencia');
        if (archivo) {
            formData.append('comprobante', archivo);
        }

        // UI Loading
        btn.disabled = true;
        btn.textContent = 'Enviando...';

        try {
            const res = await fetch('http://localhost:3000/api/pagos/reportar', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                mostrarAlerta('success', 'Pago reportado correctamente');
                setTimeout(() => window.location.href = 'profile.html', 2000);
            } else {
                const data = await res.json();
                mostrarAlerta('danger', data.error || 'Error al enviar');
                btn.disabled = false;
                btn.textContent = 'Enviar';
            }
        } catch (error) {
            console.error(error);
            mostrarAlerta('danger', 'Error de conexión');
            btn.disabled = false;
            btn.textContent = 'Enviar';
        }
    });

    function mostrarAlerta(tipo, mensaje) {
        const alertEl = document.getElementById('alertSuccess');
        alertEl.className = `alert ${tipo}`; 
        alertEl.style.display = 'block';
        alertEl.innerHTML = `<strong>${tipo === 'success' ? 'Éxito' : 'Error'}:</strong> ${mensaje}`;
        setTimeout(() => { alertEl.style.display = 'none'; }, 4000);
    }
});