let listaPagos = [];
let idPagoActual = null; // Para saber qué pago estamos rechazando

$(document).ready(function() {
    // Inicializar UI
    $('.ui.dropdown').dropdown();
    $('#sidebar-toggle').click(() => $('.ui.sidebar').sidebar('toggle'));
    
    // Cargar Datos
    cargarPagos();

    // Filtros
    $('.filter-btn').click(function() {
        $('.filter-btn').removeClass('active');
        $(this).addClass('active');
        renderizarTabla($(this).data('filter'));
    });

    // Búsqueda
    $('#busqueda').on('keyup', function() {
        renderizarTabla($('.filter-btn.active').data('filter'));
    });

    // Acción Rechazar (Abrir Modal)
    $(document).on('click', '.btn-rechazar', function() {
        idPagoActual = $(this).data('id');
        $('#txt-motivo-rechazo').val(''); // Limpiar
        $('#modal-rechazar').modal('show');
    });

    // Confirmar Rechazo (Click en el botón del modal)
    $('#btn-confirmar-rechazo').click(function() {
        const motivo = $('#txt-motivo-rechazo').val();
        if (!motivo) {
            Swal.fire({
                icon: 'warning',
                title: 'Motivo requerido',
                text: 'Debes escribir por qué rechazas el pago.',
                timer: 2000
            });
            return;
        }
        
        cambiarEstado(idPagoActual, 'RECHAZADO', motivo);
    });

    // Acción Aprobar con SweetAlert
    $(document).on('click', '.btn-aprobar', function() {
        const id = $(this).data('id');
        
        Swal.fire({
            title: '¿Aprobar Pago?',
            text: "¿Confirmas que el dinero está efectivo en la cuenta?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#21ba45',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, Aprobar'
        }).then((result) => {
            if (result.isConfirmed) {
                cambiarEstado(id, 'APROBADO');
            }
        });
    });

    // Ver Comprobante
    $(document).on('click', '.btn-ver-comprobante', function() {
        const url = $(this).data('url');
        const urlCompleta = `http://localhost:3000${url}`;
        
        // Si es PDF, mostramos icono. Si es imagen, mostramos la imagen.
        if(url.toLowerCase().endsWith('.pdf')) {
            $('#img-comprobante').attr('src', '../Images/pdf_icon.png'); 
        } else {
            $('#img-comprobante').attr('src', urlCompleta);
        }
        
        $('#btn-descargar-comprobante').attr('href', urlCompleta);
        $('#modal-comprobante').modal('show');
    });
});

async function cargarPagos() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:3000/api/gestor/pagos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Error al cargar');
        
        listaPagos = await res.json();
        actualizarEstadisticas();
        renderizarTabla('todos');

    } catch (error) {
        console.error(error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los pagos.' });
    }
}

function renderizarTabla(filtro) {
    const tbody = $('#pagos-body');
    tbody.empty();

    const busqueda = $('#busqueda').val().toLowerCase();

    const filtrados = listaPagos.filter(p => {
        const pasaEstado = filtro === 'todos' || p.estado === filtro;
        const texto = `${p.usuario.primer_nombre} ${p.usuario.primer_apellido} ${p.referencia}`.toLowerCase();
        const pasaBusqueda = texto.includes(busqueda);
        return pasaEstado && pasaBusqueda;
    });

    if (filtrados.length === 0) {
        tbody.html('<tr><td colspan="9" class="center aligned">No hay pagos para mostrar</td></tr>');
        return;
    }

    filtrados.forEach(p => {
        const fecha = new Date(p.fecha_pago).toLocaleDateString();
        const nombre = `${p.usuario.primer_nombre} ${p.usuario.primer_apellido}`;
        
        // Colores de estado
        let labelColor = 'grey';
        if(p.estado === 'PENDIENTE') labelColor = 'orange';
        if(p.estado === 'APROBADO') labelColor = 'green';
        if(p.estado === 'RECHAZADO') labelColor = 'red';

        // Botones de acción
        let botones = '';
        if(p.estado === 'PENDIENTE') {
            botones = `
                <button class="ui mini green icon button btn-aprobar" data-id="${p.id}" title="Aprobar">
                    <i class="check icon"></i>
                </button>
                <button class="ui mini red icon button btn-rechazar" data-id="${p.id}" title="Rechazar">
                    <i class="times icon"></i>
                </button>
            `;
        } else if (p.estado === 'RECHAZADO') {
            botones = `<span style="font-size:0.8em; color:#d9534f; cursor:help;" title="${p.nota_admin}">Rechazado</span>`;
        } else {
            botones = `<span style="font-size:0.8em; color:#5cb85c;">Aprobado</span>`;
        }

        // Botón comprobante
        const btnComprobante = p.comprobante_url 
            ? `<button class="ui mini blue icon button btn-ver-comprobante" data-url="${p.comprobante_url}"><i class="eye icon"></i></button>`
            : '<span class="ui mini label">Sin foto</span>';

        const row = `
            <tr>
                <td>${fecha}</td>
                <td>${nombre}</td>
                <td>${p.usuario.numero_casa || 'N/A'}</td>
                <td>${p.concepto}</td>
                <td style="font-weight:bold;">Bs. ${parseFloat(p.monto).toFixed(2)}</td>
                <td>${p.metodo_pago || '-'}</td>
                <td>${p.referencia || '-'}</td>
                <td><div class="ui ${labelColor} label tiny">${p.estado}</div></td>
                <td>
                    <div class="ui buttons">
                        ${btnComprobante}
                        ${botones}
                    </div>
                </td>
            </tr>
        `;
        tbody.append(row);
    });
}

async function cambiarEstado(id, nuevoEstado, nota = '') {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`http://localhost:3000/api/gestor/pagos/${id}/estado`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ estado: nuevoEstado, nota: nota })
        });

        if(res.ok) {
            // Actualizar localmente
            const pago = listaPagos.find(p => p.id === id);
            if(pago) {
                pago.estado = nuevoEstado;
                pago.nota_admin = nota;
            }
            $('#modal-rechazar').modal('hide');
            actualizarEstadisticas();
            // Mantener el filtro actual visualmente
            renderizarTabla($('.filter-btn.active').data('filter'));
            
            // Notificación bonita
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
            Toast.fire({
                icon: 'success',
                title: `Pago ${nuevoEstado.toLowerCase()} con éxito`
            });

        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar el estado.' });
        }
    } catch(e) {
        console.error(e);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Fallo de conexión.' });
    }
}

function actualizarEstadisticas() {
    const pendientes = listaPagos.filter(p => p.estado === 'PENDIENTE').length;
    const aprobados = listaPagos.filter(p => p.estado === 'APROBADO').length;
    const rechazados = listaPagos.filter(p => p.estado === 'RECHAZADO').length;

    $('#stat-pendientes').text(pendientes);
    $('#stat-aprobados').text(aprobados);
    $('#stat-rechazados').text(rechazados);
}