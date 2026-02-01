document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------------
    // 1. INICIALIZACIÓN DE COMPONENTES VISUALES (JQuery + Semantic)
    // ---------------------------------------------------------
    if (window.jQuery) {
        // Activar efecto de oscurecer en la foto (Dimmer)
        $('.special.card .image').dimmer({ on: 'hover' });
        
        // Activar menús desplegables
        $('.ui.dropdown').dropdown();

        // Configurar el Modal de Modificar
        $('#modificarBtn').on('click', function() {
            $('#modalModificar').modal('show');
        });

        // Configurar botón "Guardar" del Modal (Por ahora solo visual)
        $('#guardarCambios').on('click', function() {
            // Aquí iría la lógica para enviar los nuevos datos al backend
            // Por ahora, solo cerramos y mostramos alerta de éxito
            $('#modalModificar').modal('hide');
            
            setTimeout(() => {
                $('#alertSuccess').fadeIn();
                setTimeout(() => $('#alertSuccess').fadeOut(), 3000);
            }, 500);
        });
    }

    // ---------------------------------------------------------
    // 2. LOGICA DE DATOS (Backend)
    // ---------------------------------------------------------
    
    // Cargar datos al entrar
    cargarPerfil();

    // Configurar el input oculto para subir fotos
    const inputFoto = document.getElementById('fileInput'); 
    if (inputFoto) {
        inputFoto.addEventListener('change', subirFoto);
    }
});

/**
 * FUNCIÓN PRINCIPAL: Trae los datos del usuario y los pinta en el HTML
 */
async function cargarPerfil() {
    const token = localStorage.getItem('token');
    if (!token) return; // seguridad.js se encarga del resto

    try {
        const res = await fetch('/api/perfil', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const usuario = await res.json();

        if (res.ok) {
            // A. LLENAR TARJETA SUPERIOR (FOTO)
            document.getElementById('nombre-completo').textContent = `${usuario.primer_nombre} ${usuario.primer_apellido}`;
            document.getElementById('nombre-comunidad').textContent = usuario.comunidad ? usuario.comunidad.nombre : "Sin Comunidad";
            
            const emailCard = document.getElementById('email-usuario-card'); // ID corregido según el HTML anterior
            if(emailCard) emailCard.textContent = usuario.email;

            // Foto de Perfil
            const avatarImg = document.getElementById('avatar-img');
            if (usuario.foto_perfil_url) {
                avatarImg.src = usuario.foto_perfil_url;
            } else {
                avatarImg.src = '../Images/default.jpg';
            }

            // B. LLENAR INFORMACIÓN DETALLADA (ABAJO)
            // Usamos los IDs únicos que creamos: info-nombre, info-email, info-cedula
            const infoNombre = document.getElementById('info-nombre');
            const infoEmail = document.getElementById('info-email');
            const infoCedula = document.getElementById('info-cedula');

            if (infoNombre) infoNombre.textContent = `${usuario.primer_nombre} ${usuario.primer_apellido}`;
            if (infoEmail) infoEmail.textContent = usuario.email;
            if (infoCedula) infoCedula.textContent = usuario.cedula;

            // C. LLENAR TABLA DE PAGOS
            const tbody = document.getElementById('tabla-pagos-body');
            if (tbody) {
                tbody.innerHTML = ''; // Limpiar tabla

                if (usuario.pagos && usuario.pagos.length > 0) {
                    usuario.pagos.forEach(pago => {
                        const fecha = new Date(pago.fecha_pago).toLocaleDateString();
                        // Asignar color a la fila según estado
                        let claseColor = '';
                        if(pago.estado === 'APROBADO') claseColor = 'positive';
                        if(pago.estado === 'RECHAZADO') claseColor = 'negative';
                        if(pago.estado === 'PENDIENTE') claseColor = 'warning';

                        const row = `
                            <tr class="${claseColor}">
                                <td>${fecha}</td>
                                <td>${pago.concepto}</td>
                                <td>$${pago.monto}</td>
                                <td><i class="icon ${getIconoEstado(pago.estado)}"></i> ${pago.estado}</td>
                            </tr>
                        `;
                        tbody.innerHTML += row;
                    });
                } else {
                    tbody.innerHTML = '<tr><td colspan="4" class="center aligned">No hay pagos registrados</td></tr>';
                }
            }
        }
    } catch (error) {
        console.error("Error cargando perfil:", error);
    }
}

/**
 * FUNCIÓN: Sube la foto al servidor y actualiza la imagen
 */
async function subirFoto(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('foto', file);

    const token = localStorage.getItem('token');

    try {
        // Feedback visual simple
        const nombreElem = document.getElementById('nombre-completo');
        const textoOriginal = nombreElem.textContent;
        nombreElem.textContent = "Subiendo foto...";

        const res = await fetch('/api/perfil/foto', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await res.json();

        if (res.ok) {
            // Actualizar la imagen inmediatamente
            document.getElementById('avatar-img').src = data.url;
            Swal.fire({
                icon: 'success',
                title: 'Foto actualizada',
                timer: 1500,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'No se pudo actualizar',
                text: data.error || 'Intenta nuevamente.'
            });
        }
        
        // Restaurar nombre
        nombreElem.textContent = textoOriginal;

    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Error al subir la imagen',
            text: 'Revisa tu conexión e inténtalo de nuevo.'
        });
    } finally {
        // Aseguramos que los datos estén frescos
        cargarPerfil();
    }
}

// Helper para iconos de la tabla
function getIconoEstado(estado) {
    if (estado === 'APROBADO') return 'check circle';
    if (estado === 'RECHAZADO') return 'times circle';
    return 'clock'; // Pendiente
}