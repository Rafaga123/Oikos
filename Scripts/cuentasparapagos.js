document.addEventListener('DOMContentLoaded', function() {
    // Sidebar
    $('.ui.sidebar').sidebar({ context: $('.pusher'), transition: 'overlay' });
    $('#sidebar-toggle').click(() => $('.ui.sidebar').sidebar('toggle'));
    
    cargarCuentasUsuario();
});

async function cargarCuentasUsuario() {
    const token = localStorage.getItem('token');
    // Buscamos el contenedor de la tabla en el HTML
    // <tbody id="cuentas-body"> ... </tbody>
    // Si no lo tiene, reemplazamos el contenido de .description
    const container = document.querySelector('.ui.fluid.raised.card .description');
    
    try {
        const res = await fetch('http://localhost:3000/api/bancos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Error API');
        
        const cuentas = await res.json();
        
        // Limpiar contenido estático
        container.innerHTML = '';
        
        // Separar Pago Móvil y Transferencias
        const pagoMovil = cuentas.filter(c => c.telefono);
        const transferencias = cuentas.filter(c => !c.telefono);
        
        // --- 1. SECCIÓN TRANSFERENCIAS ---
        let htmlTransfer = `
            <h3 class="ui dividing header"><i class="university icon"></i> Cuentas Bancarias (Transferencias)</h3>
            <div class="ui relaxed divided list">
        `;
        
        if (transferencias.length === 0) {
            htmlTransfer += '<div class="item">No hay cuentas bancarias registradas.</div>';
        } else {
            transferencias.forEach(c => {
                htmlTransfer += `
                    <div class="item">
                        <i class="large building middle aligned icon text-blue"></i>
                        <div class="content">
                            <div class="header">${c.banco} (${c.tipo_cuenta.charAt(0).toUpperCase() + c.tipo_cuenta.slice(1)})</div>
                            <div class="description">
                                <b>Cuenta:</b> ${c.numero_cuenta}<br>
                                <b>Titular:</b> ${c.titular}<br>
                                <b>C.I./RIF:</b> ${c.cedula_rif}
                            </div>
                        </div>
                        <button class="ui mini basic button right floated" onclick="copiar('${c.numero_cuenta}')">Copiar Cuenta</button>
                    </div>
                `;
            });
        }
        htmlTransfer += '</div>';
        
        // --- 2. SECCIÓN PAGO MÓVIL ---
        let htmlMovil = `
            <h3 class="ui dividing header" style="margin-top: 30px;"><i class="mobile alternate icon"></i> Pago Móvil</h3>
            <div class="ui cards stackable three">
        `;
        
        if (pagoMovil.length === 0) {
            htmlMovil += '<div style="padding:10px;">No hay datos de Pago Móvil registrados.</div>';
        } else {
            pagoMovil.forEach(c => {
                htmlMovil += `
                    <div class="card">
                        <div class="content">
                            <div class="header" style="color: #9A9CEA;">${c.banco}</div>
                            <div class="meta">${c.titular}</div>
                            <div class="description">
                                <p><b>Tel:</b> ${c.telefono}</p>
                                <p><b>C.I.:</b> ${c.cedula_rif}</p>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        htmlMovil += '</div>';

        // --- 3. SECCIÓN EFECTIVO ---
        const htmlEfectivo = `
            <h3 class="ui dividing header" style="margin-top: 30px;"><i class="money bill alternate icon"></i> Pagos en Efectivo</h3>
            <div class="ui icon message">
                <i class="info circle icon"></i>
                <div class="content">
                    <div class="header">Atención Presencial</div>
                    <p>Para pagos en efectivo, dirigirse a la oficina de administración: <br>
                    <b>Martes y Jueves:</b> 4:00 PM - 7:00 PM</p>
                </div>
            </div>
        `;

        // Inyectar todo
        container.innerHTML = htmlTransfer + htmlMovil + htmlEfectivo;

    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="ui error message">No se pudo cargar la información de pagos.</div>';
    }
}

function copiar(texto) {
    navigator.clipboard.writeText(texto);
    // Usar SweetAlert pequeño (Toast)
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
    });
    Toast.fire({ icon: 'success', title: 'Copiado al portapapeles' });
}