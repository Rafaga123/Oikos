(function() {
    // 1. Obtener el token del almacenamiento local
    const token = localStorage.getItem('token');
    const usuario = localStorage.getItem('usuario');

    // 2. Verificar si NO hay token
    if (!token || !usuario) {
        console.warn("Acceso denegado: Usuario no autenticado.");
        
        // Limpiamos cualquier rastro parcial por seguridad
        localStorage.clear();

        // 3. Redirigir
        window.location.href = '../index.html'; 
    }
    
    // Si llega aquí, es porque TIENE token y puede ver la página. OJITO
})();

/**
 * Función extra para CERRAR SESIÓN */
function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '../index.html';
}