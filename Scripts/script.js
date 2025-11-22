//SIDEBAR
document.addEventListener('DOMContentLoaded', function() { //Ejecuta la acción una vez esté completamente cargado el DOM
    
    //Seleccion los elementos por su clase
    const sidebar = document.querySelector('.ui.left.vertical.inverted.sidebar.labeled.icon.menu');
    const pusher = document.querySelector('.pusher');

    //Seleccionamos todos los botones de alternancia (el del menú superior y el del sidebar)
    const toggleButtons = document.querySelectorAll('.sidebar-toggle-btn');
    
    //Funcion para manejar los eventos (click)
    function toggleSidebar() {
        // Simula la función .sidebar('toggle')
        // Al usar .classList.toggle(), se añade la clase si no existe, o se elimina si existe.
        
        // El sidebar se muestra u oculta (clase 'visible')
        sidebar.classList.toggle('visible'); 
        
        //Empuja el contenido principal se "empuja" o vuelve a su posición original (clase 'pushed')
        pusher.classList.toggle('pushed'); 
        
        //El body se atenúa cuando el sidebar está visible
        document.body.classList.toggle('dimmed'); 
    }
    
    // Asigna la función 'toggleSidebar' a todos los botones que tienen la clase
    toggleButtons.forEach(button => {
        button.addEventListener('click', toggleSidebar); //Ejecuta la funcion toggleSidebar al hacer click
    });

});