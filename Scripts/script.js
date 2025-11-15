$(document).ready(function() {

    //Se inicializa el sidebar con los callbacks
    $('.ui.left.vertical.inverted.sidebar.labeled.icon.menu')
        .sidebar({
            context: $('body'), 
            dimPage: true,      
            transition: 'push',
            
        });
        
    //Vincula el evento click al botón del sidebar
    $('.sidebar-toggle-btn').on('click', function() {
        $('.ui.left.vertical.inverted.sidebar.labeled.icon.menu').sidebar('toggle');
    });
});