document.addEventListener('DOMContentLoaded', function() {
    initSidebar();

    // Inicializar componentes Semantic
    $('.ui.dropdown').dropdown();
});

// --- CONFIGURACIÓN VISUAL---

function initSidebar() {
    $('.ui.sidebar').sidebar({ context: $('.pusher'), transition: 'overlay' });
    $('#sidebar-toggle, .sidebar-toggle-btn').click(function() {
        $('.ui.sidebar').sidebar('toggle');
    });
}