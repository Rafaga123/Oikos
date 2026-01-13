document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
    formForo();

    //Inicializar dropdowns
    $('.ui.dropdown').dropdown();
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

//FORO
function formForo(){
    //Activar dropdown
    $('.ui.dropdown').dropdown();

    //Activar dimmer
    $('.special.card .image').dimmer({ on: 'hover' });

    //Inicialización y configuración del Modal
    $('#modalAgregar').modal({
        // Validación de campos obligatorios al intentar publicar
        onApprove: function() {
            //El form dentro del modal
            const $form = $('#modalAgregar .ui.form');

            //Se utiliza el semantic ui form validation para verificar los campos requeridos
            $form.form({
                fields: {
                    Tema: 'empty', //El campo con name="Tema" no puede estar vacío
                    Descripción: 'empty', //El campo con name="Descripción" no puede estar vacío
                }
            });

            //Si la validación falla, Semantic UI automáticamente muestra los mensajes
            if ($form.form('is valid')) {
                //Si el formulario es válido, podemos proceder a mostrar la alerta de éxito.
                
                //Muestra la alerta de éxito
                setTimeout(() => {
                    $('#alertSuccess').fadeIn();

                    // Oculta la alerta después de 3 segundos
                    setTimeout(() => {
                        $('#alertSuccess').fadeOut();
                    }, 3000);
                }, 500);
                
                //retorna true para permitir que el modal cierre
                return true; 
            }
            
            //Muestra la alerta de éxito
            setTimeout(() => {
                $('#alertFail').fadeIn();

                //Oculta la alerta después de 3 segundos
                setTimeout(() => {
                    $('#alertFail').fadeOut();
                }, 3000);
            }, 500);
            //Si el formulario no es válido, retorna false para mantener el modal abierto
            return false;
        },

        //preguntar si está seguro al intentar 'Cancelar'
        onDeny: function() {
            //Utilizamos la función de confirmación nativa del navegador
            const confirmar = confirm('¿Estás seguro de que deseas cancelar? Se perderán los cambios.');
            
            //Retorna true si el usuario confirma (permite que el modal se cierre)
            // Retorna FALSE si el usuario cancela (mantiene el modal abierto)
            return confirmar; 
        }
    });

    //Abrir el modal
    $('#agregarBtn').on('click', function() {
        //Reinicia el estado del formulario (mensajes de error) antes de mostrarlo
        $('#modalAgregar .ui.form').form('clear');
        $('#modalAgregar').modal('show');
    });
    
}