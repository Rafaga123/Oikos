document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
    
    // Obtener ID de la URL (ej: encuesta.html?id=5)
    const urlParams = new URLSearchParams(window.location.search);
    const idEncuesta = urlParams.get('id');

    if (idEncuesta) {
        cargarDetalleEncuesta(idEncuesta);
    } else {
        alert('Encuesta no especificada');
        window.location.href = 'selecEncuesta.html';
    }
});

async function cargarDetalleEncuesta(id) {
    const token = localStorage.getItem('token');
    
    try {
        const res = await fetch(`http://localhost:3000/api/encuestas/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Error al cargar');
        
        const encuesta = await res.json();
        renderSurvey(encuesta); // Función que dibuja el HTML

    } catch (error) {
        console.error(error);
        $('#titulo-encuesta').text('Error al cargar la encuesta');
    }
}

function renderSurvey(data) {
    $('#titulo-encuesta').text(data.titulo);
    $('#descripcion-encuesta').text(data.descripcion);

    const $container = $('#contenedor-preguntas');
    $container.empty();

    // Generar opciones (Asumiendo encuesta simple de 1 pregunta principal por ahora o estructura flexible)
    // En tu modelo actual, Encuesta tiene Titulo/Desc y una lista de Opciones. 
    // Es como una "Pregunta única con varias opciones".
    
    let optionsHTML = '';
    data.opciones.forEach(opcion => {
        optionsHTML += `
            <div class="field">
                <div class="ui radio checkbox">
                    <input type="radio" name="opcion_elegida" value="${opcion.id}" required>
                    <label>${opcion.texto}</label>
                </div>
            </div>
        `;
    });

    const questionHTML = `
        <div class="pregunta-item">
            <h3 class="ui header texto-pregunta">Seleccione una opción:</h3>
            <div class="grouped fields">
                ${optionsHTML}
            </div>
        </div>
    `;
    $container.append(questionHTML);
    $('.ui.radio.checkbox').checkbox(); // Activar Semantic UI
    
    // Configurar envío
    configurarEnvio(data.id);
}

function configurarEnvio(idEncuesta) {
    $('#form-responder-encuesta').off('submit').on('submit', async function(e) {
        e.preventDefault();
        
        // Obtener opción seleccionada
        const idOpcion = $('input[name=opcion_elegida]:checked').val();
        
        if (!idOpcion) {
            alert('Debes seleccionar una opción');
            return;
        }

        const token = localStorage.getItem('token');
        
        try {
            const res = await fetch(`http://localhost:3000/api/encuestas/${idEncuesta}/votar`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ idOpcion: idOpcion })
            });

            if (res.ok) {
                mostrarExito();
            } else {
                const err = await res.json();
                alert(err.error || 'Error al votar');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        }
    });
}

function mostrarExito() {
    const alerta = document.getElementById('alertSuccess');
    alerta.style.display = 'flex';
    setTimeout(() => { alerta.style.opacity = '1'; }, 10);
    
    setTimeout(() => {
        window.location.href = "selecEncuesta.html";
    }, 2000);
}

function initSidebar() {
    $('.ui.sidebar').sidebar({ context: $('.pusher'), transition: 'overlay' });
    $('#sidebar-toggle').click(() => $('.ui.sidebar').sidebar('toggle'));
}