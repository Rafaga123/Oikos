document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
    initSurvey();

    $('.ui.dropdown').dropdown();
});

// SIDEBAR
function initSidebar() {
    const allToggleSelectors = '#sidebar-toggle, .sidebar-toggle-btn';

    $('.ui.sidebar').sidebar({
        context: $('.pusher'),
        transition: 'overlay'
    });

    $(allToggleSelectors).click(function() {
        $('.ui.sidebar').sidebar('toggle');
    });
}

//LÓGICA PARA GENERAR LA ENCUESTA
function initSurvey() {
    //datos simulados mientras la conexion con la no este lista
    const surveyMock = {
        titulo: "Cuota de Mantenimiento Diciembre",
        descripcion: "Su opinión es vital para definir las prioridades del condominio este mes.",
        preguntas: [
            {
                id: 101,
                texto: "¿Cómo califica el servicio de limpieza de las áreas comunes?",
                opciones: ["Excelente", "Bueno", "Regular", "Deficiente"]
            },
            {
                id: 102,
                texto: "¿Está de acuerdo con la propuesta de pintura de fachadas?",
                opciones: ["Sí", "No", "Prefiero otra prioridad"]
            }
        ]
    };

    function mostrarExito(mensaje) {
        const alerta = document.getElementById('alertSuccess');
        const textoAlerta = document.getElementById('successMessage');

        textoAlerta.innerText = mensaje;
        alerta.style.display = 'flex'; //flex para que el icono y texto alineen bien

        //delay para que el navegador note el cambio de display antes de la opacidad
        setTimeout(() => {
            alerta.style.opacity = '1';
        }, 10);

        //Ciclo de cierre
        setTimeout(() => {
            alerta.style.opacity = '0';
            setTimeout(() => {
                alerta.style.display = 'none';
                //Una vez que la alerta desaparece, volvemos al listado
                window.location.href = "selecEncuesta.html";
            }, 600);
        }, 3000); 
    }

    //Renderizado dinámico
    function renderSurvey(data) {
        $('#titulo-encuesta').text(data.titulo);
        $('#descripcion-encuesta').text(data.descripcion);

        const $container = $('#contenedor-preguntas');
        $container.empty();

        data.preguntas.forEach((q, index) => {
            let optionsHTML = '';
                
            q.opciones.forEach(opcion => {
                optionsHTML += `
                    <div class="field">
                        <div class="ui radio checkbox">
                            <input type="radio" name="p_${q.id}" value="${opcion}" required>
                            <label>${opcion}</label>
                        </div>
                    </div>
                `;
            });

            const questionHTML = `
                <div class="pregunta-item">
                    <h3 class="ui header texto-pregunta">${index + 1}. ${q.texto}</h3>
                    <div class="grouped fields">
                        ${optionsHTML}
                    </div>
                </div>
            `;
            $container.append(questionHTML);
        });

        //Activar componentes de Semantic UI inyectados
        $('.ui.radio.checkbox').checkbox();
    }

    //Ejecutar renderizado
    renderSurvey(surveyMock);

    //Manejo del formulario
    $('#form-responder-encuesta').on('submit', function(e) {
        e.preventDefault();
        
        //Obtenemos los datos seleccionados
        const results = $(this).serializeArray();
        console.log("Datos para el backend de Node.js:", results);

        mostrarExito("¡Encuesta enviada! Sus respuestas han sido guardadas con éxito. Será redirigido al listado de encuestas...");
    });
}