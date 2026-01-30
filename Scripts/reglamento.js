document.addEventListener('DOMContentLoaded', function(){
    initSidebar();
    
    //inicializar los dropdown
    $('.ui.dropdown').dropdown({
        placeholder: 'auto'
    });
});

//SIDEBAR
function initSidebar() {

    //Botones de control
    const allToggleSelectors = '#sidebar-toggle, .sidebar-toggle-btn';

    //Inicializamos y controlamos el sidebar usando la API de Semantic UI
    $('.ui.sidebar').sidebar({
        context: $('.pusher'),
        transition: 'overlay'
    });

    $(allToggleSelectors).click(function() {
        //La función 'toggle' lo abrirá si está cerrado, y lo cerrará si está abierto.
        $('.ui.sidebar').sidebar('toggle');
    });
}