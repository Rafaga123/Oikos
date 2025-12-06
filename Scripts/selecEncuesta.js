document.addEventListener("DOMContentLoaded", function() {
    initSidebar();
});

function initSidebar() {
    //Seleccion los elementos por su clase
    const sidebar = document.querySelector('.ui.left.vertical.inverted.sidebar.labeled.icon.menu');
    const pusher = document.querySelector('.pusher');
    //Seleccionamos todos los botones de alternancia (el del menú superior y el del sidebar)
    const toggleButtons = document.querySelectorAll('.sidebar-toggle-btn');
    
    //Funcion para manejar los eventos (click)
    function toggleSidebar() {
        //se añade la clase si no existe, o se elimina si existe
        sidebar.classList.toggle('visible');  //El sidebar se muestra u oculta
        pusher.classList.toggle('pushed'); //Empuja el contenido principal o vuelve a su posición original
        document.body.classList.toggle('dimmed'); //El body se atenúa cuando el sidebar está visible
    }
    
    //Asigna la función a todos los botones que tienen la clase
    toggleButtons.forEach(button => {
        button.addEventListener('click', toggleSidebar); //Ejecuta la función al hacer click
    });
}