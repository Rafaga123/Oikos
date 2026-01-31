$(document).ready(function() {
    // 1. Inicializar UI
    $('.ui.dropdown').dropdown();
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    
    if(!usuario) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Renderizar Sidebar según ROL
    renderizarSidebar(usuario.rol);
    $('#user-role-label').text(usuario.rol === 'ENCARGADO_COMUNIDAD' ? 'Gestor' : 'Habitante');

    // 3. Configurar Permisos de Edición
    configurarPermisos(usuario.rol);

    // 4. Cargar Datos
    cargarInfoComunidad();

    // 5. Eventos de Formularios
    $('#form-comunidad').submit(actualizarComunidad);
    $('#form-password').submit(cambiarPassword);
});

// --- LÓGICA DE INTERFAZ ---

function renderizarSidebar(rol) {
    const contenedor = $('#sidebar-container');
    let htmlSidebar = '';

    // NOTA: Se agregan clases y estilos inline en la imagen para forzar el diseño correcto
    if (rol === 'ENCARGADO_COMUNIDAD' || rol === 'ADMINISTRADOR') {
        // Sidebar GESTOR
        htmlSidebar = `
        <div class="ui vertical inverted sidebar menu sidebar-menu" style="background-color: #9A9CEA;">
            <div class="item">
                <div class="header">
                    <h2 class="ui inverted header"><i class="cog icon"></i><div class="content">Panel Gestor</div></h2>
                </div>
            </div>
            <div class="item">
                <div class="menu">
                    <a class="item" href="./gestor.html"><i class="home icon"></i> Panel de Control</a>
                    <a class="item" href="./gestion_habitantes.html"><i class="users icon"></i> Habitantes</a>
                    <a class="item" href="./solicitudes.html"><i class="chart bar icon"></i> Incidencias</a>
                    <a class="item" href="./solicitudes_nuevas.html"><i class="user icon"></i> Solicitudes</a>
                    <a class="item" href="./pagos_gestor.html"><i class="money bill alternate icon"></i> Pagos</a>
                    <a class="item" href="./crear_horario.html"><i class="clock icon"></i> Horarios</a>
                    <a class="active item" href="./configuracion.html"><i class="cogs icon"></i> Configuración</a>
                </div>
            </div>
            <div class="item">
                <div class="ui divider"></div>
                <a class="item" onclick="cerrarSesion()"><i class="sign out icon"></i> Cerrar Sesión</a>
            </div>
            <div class="sidebar-footer-image">
                <img src="../Images/logopng.png" alt="Logo">
            </div>
        </div>`;
    } else {
        // Sidebar HABITANTE
        htmlSidebar = `
        <div class="ui vertical inverted sidebar menu sidebar-menu" style="background-color: #9A9CEA;">
            <div class="item">
                <div class="header">
                    <h2 class="ui inverted header"><i class="home icon"></i><div class="content">Habitante</div></h2>
                </div>
            </div>
            <div class="item">
                <div class="menu">
                    <a class="item" href="./home_page.html"><i class="home icon"></i> Inicio</a>
                    <a class="item" href="./reglamento.html"><i class="book icon"></i> Reglamento</a>
                    <a class="item" href="./horario.html"><i class="clock icon"></i> Horarios</a>
                    <a class="item" href="./pagar.html"><i class="credit card icon"></i> Pagos</a>
                    <a class="item" href="./foro.html"><i class="comments icon"></i> Foro</a>
                    <a class="active item" href="./configuracion.html"><i class="cogs icon"></i> Configuración</a>
                </div>
            </div>
            <div class="item">
                <div class="ui divider"></div>
                <a class="item" onclick="cerrarSesion()"><i class="sign out icon"></i> Cerrar Sesión</a>
            </div>
            <div class="sidebar-footer-image">
                <img src="../Images/logo_neg.png" alt="Logo">
            </div>
        </div>`;
    }

    contenedor.html(htmlSidebar);
    
    // Inicializar lógica de sidebar
    $('.ui.sidebar').sidebar({ context: $('.pusher'), transition: 'overlay' });
    $('#sidebar-toggle').click(() => $('.ui.sidebar').sidebar('toggle'));
}

function configurarPermisos(rol) {
    if (rol === 'ENCARGADO_COMUNIDAD' || rol === 'ADMINISTRADOR') {
        // Habilitar edición
        $('#comunidad-nombre').prop('disabled', false);
        $('#comunidad-direccion').prop('disabled', false);
        $('#btn-guardar-comunidad').show();
        $('#zona-transferir').show();
        $('#divider-transferir').show();
    } else {
        // Modo solo lectura
        $('#btn-guardar-comunidad').hide();
        $('#zona-transferir').hide();
        $('#divider-transferir').hide();
    }
}

// --- LÓGICA DE DATOS ---

async function cargarInfoComunidad() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:3000/api/comunidad/info', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if(res.ok) {
            $('#comunidad-nombre').val(data.nombre);
            $('#comunidad-direccion').val(data.direccion);
            $('#comunidad-codigo').val(data.codigo_unico);
        }
    } catch (error) { console.error(error); }
}

// 1. ACTUALIZAR COMUNIDAD (Con confirmación)
async function actualizarComunidad(e) {
    e.preventDefault();
    
    const result = await Swal.fire({
        title: '¿Guardar cambios?',
        text: "Se actualizará la información para todos los habitantes.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Sí, guardar'
    });

    if (!result.isConfirmed) return;

    const token = localStorage.getItem('token');
    const nombre = $('#comunidad-nombre').val();
    const direccion = $('#comunidad-direccion').val();

    try {
        const res = await fetch('http://localhost:3000/api/comunidad', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ nombre, direccion })
        });

        if(res.ok) {
            Swal.fire('Actualizado', 'La información ha sido guardada.', 'success');
        } else {
            Swal.fire('Error', 'No tienes permisos o hubo un error.', 'error');
        }
    } catch(err) { console.error(err); }
}

// 2. CAMBIAR PASSWORD (Con confirmación)
async function cambiarPassword(e) {
    e.preventDefault();
    const passActual = $('#pass-actual').val();
    const passNueva = $('#pass-nueva').val();
    const passConfirm = $('#pass-confirm').val();

    if (passNueva !== passConfirm) {
        return Swal.fire('Error', 'Las contraseñas nuevas no coinciden.', 'warning');
    }

    const result = await Swal.fire({
        title: '¿Cambiar contraseña?',
        text: "Tendrás que usar la nueva contraseña la próxima vez.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cambiar'
    });

    if (!result.isConfirmed) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:3000/api/auth/cambiar-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ passwordActual: passActual, passwordNuevo: passNueva })
        });

        const data = await res.json();
        if (res.ok) {
            Swal.fire('Éxito', 'Contraseña actualizada.', 'success');
            $('#form-password')[0].reset();
        } else {
            Swal.fire('Error', data.error, 'error');
        }
    } catch(err) { console.error(err); }
}

function copiarCodigo() {
    const codigo = document.getElementById("comunidad-codigo");
    codigo.select();
    codigo.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(codigo.value);
    
    const btn = event.currentTarget;
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="check icon"></i> Copiado';
    setTimeout(() => { btn.innerHTML = originalHtml; }, 2000);
}

// --- ZONA DE PELIGRO (CON PASSWORD) ---

async function eliminarCuenta() {
    // 1. Confirmación inicial
    const result = await Swal.fire({
        title: '¿Estás completamente seguro?',
        text: "Esta acción eliminará tu cuenta permanentemente. No se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Continuar'
    });

    if (!result.isConfirmed) return;

    // 2. Pedir contraseña
    const { value: password } = await Swal.fire({
        title: 'Verificación de Seguridad',
        text: 'Ingresa tu contraseña para confirmar la eliminación:',
        input: 'password',
        inputPlaceholder: 'Tu contraseña actual',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Eliminar mi cuenta',
        inputValidator: (value) => {
            if (!value) return 'Debes ingresar tu contraseña';
        }
    });

    if (password) {
        const token = localStorage.getItem('token');
        try {
            // Enviamos la contraseña en el cuerpo (algunos frameworks requieren POST para body, pero fetch DELETE lo soporta)
            // Si hay problemas, cambiamos el método en backend a POST
            const res = await fetch('http://localhost:3000/api/auth/eliminar-cuenta', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ password: password }) // Enviamos password para validar en backend
            });

            if (res.ok) {
                await Swal.fire('Eliminado', 'Tu cuenta ha sido eliminada.', 'success');
                window.location.href = 'login.html';
            } else {
                const data = await res.json();
                Swal.fire('Error', data.error || 'Contraseña incorrecta', 'error');
            }
        } catch (err) { console.error(err); }
    }
}

async function transferirGestoria() {
    // 1. Pedir Cédula
    const { value: cedula } = await Swal.fire({
        title: 'Transferir Gestoría',
        text: 'Ingresa la Cédula del habitante al que cederás tu puesto.',
        input: 'text',
        inputPlaceholder: 'Ej: V-12345678',
        showCancelButton: true,
        confirmButtonText: 'Siguiente',
        inputValidator: (value) => {
            if (!value) return 'Debes escribir una cédula';
        }
    });

    if (!cedula) return;

    // 2. Pedir Contraseña
    const { value: password } = await Swal.fire({
        title: 'Confirmar Transferencia',
        text: `Vas a ceder tus permisos a la cédula: ${cedula}. Ingresa tu contraseña para confirmar:`,
        input: 'password',
        inputPlaceholder: 'Tu contraseña actual',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Transferir Cargo',
        inputValidator: (value) => {
            if (!value) return 'Debes ingresar tu contraseña';
        }
    });

    if (password) {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:3000/api/comunidad/transferir', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ cedulaNuevoGestor: cedula, password: password })
            });

            if (res.ok) {
                await Swal.fire('Transferencia Exitosa', 'Has cedido tu cargo. Serás redirigido al inicio de sesión.', 'success');
                cerrarSesion();
            } else {
                const data = await res.json();
                Swal.fire('Error', data.error || 'Contraseña incorrecta', 'error');
            }
        } catch (err) { console.error(err); }
    }
}