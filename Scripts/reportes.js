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

function crearHtmlReporte(categoria, texto, fecha, importancia) {
    // Definimos los colores para la barra según la categoría
    const coloresBarra = {
        'Mantenimiento': 'blue',
        'Seguridad': 'red',
        'Limpieza': 'green',
        'Otros': 'grey'          // Gris
    };

    // Definimos los colores de Semantic UI para las etiquetas de importancia
    const coloresImportancia = {
        'Alto': 'red',
        'Medio': 'yellow',
        'Bajo': 'green'
    };

    const colorBarra = coloresBarra[categoria] || 'grey';
    const colorLabel = coloresImportancia[importancia] || 'grey';

    return `
        <div class="report-item">
            <div style="display: flex; justify-content: space-between;">
                <strong>Reporte de ${categoria}</strong>
                <div>
                    <div class="ui ${colorLabel} mini label">${importancia}</div>
                    <div class="ui orange mini label">Pendiente</div>
                </div>
            </div>
            
            <div class="ui ${colorBarra} basic label mini" style="margin-top:5px">${categoria}</div>
            
            <div class="report-body" style="border-left: 4px solid ${colorBarra};">
                ${texto}
            </div>

            <div class="meta-info">
                <i class="user icon"></i> Residente 3A | <i class="calendar icon"></i> ${fecha}
            </div>
            <div style="clear:both"></div>
        </div>
    `;
}

//Lo que sucede al darle click al botón
function enviarReporte() {
    const cat = document.getElementById('input-categoria').value;
    const imp = document.getElementById('input-importancia').value;
    const txt = document.getElementById('input-texto').value;
    const contenedor = document.getElementById('contenedor-reportes');

    if (!txt || txt.length < 10) {
        mostrarError("El reporte es demasiado corto. Por favor, detalle mejor la situación.");
        return;
    }

    const fechaHoy = new Date().toLocaleDateString();
    
    // Generamos el HTML usando la maqueta y lo ponemos al principio
    const nuevoReporte = crearHtmlReporte(cat, txt, fechaHoy, imp);
    contenedor.insertAdjacentHTML('afterbegin', nuevoReporte);

    //Alerta de éxito
    mostrarExito("Tu reporte ha sido enviado y ya aparece en tu historial.");

    // Limpiamos
    document.getElementById('input-texto').value = "";
}

//FUNCIONES PARA MOSTRAR LA ALERTAS
function mostrarError(mensaje) {
    const alerta = document.getElementById('alertFail');
    const textoAlerta = document.getElementById('alertMessage');

    //Cambiamos el texto y mostramos el bloque
    textoAlerta.innerText = mensaje;
    alerta.style.display = 'flex';
    
    //Delay para que la transición de opacidad funcione
    setTimeout(() => {
        alerta.style.opacity = '1';
    }, 10);

    //Desvanecer y ocultar después de 4 segundos
    setTimeout(() => {
        alerta.style.opacity = '0';
        setTimeout(() => {
            alerta.style.display = 'none';
        }, 600); //Espera a que termine la animación CSS
    }, 4000);
}

function mostrarExito(mensaje) {
    const alerta = document.getElementById('alertSuccess');
    const textoAlerta = document.getElementById('successMessage');

    textoAlerta.innerText = mensaje;
    alerta.style.display = 'flex';
    
    setTimeout(() => {
        alerta.style.opacity = '1';
    }, 10);

    setTimeout(() => {
        alerta.style.opacity = '0';
        setTimeout(() => {
            alerta.style.display = 'none';
        }, 600);
    }, 3000); // 3 segundos es suficiente para un éxito
}

enviarReporte();