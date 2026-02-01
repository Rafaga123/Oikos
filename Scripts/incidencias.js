document.addEventListener('DOMContentLoaded', function(){
    initSidebar();
    
    // Inicializar dropdowns
    if(window.jQuery) {
        $('.ui.dropdown').dropdown({ placeholder: 'auto' });
    }

    // Cargar reportes existentes de la BD
    cargarMisReportes();
});

// --- API Y LÓGICA DE DATOS ---

async function cargarMisReportes() {
    const token = localStorage.getItem('token');
    const contenedor = document.getElementById('contenedor-reportes');
    
    try {
        const res = await fetch('/api/incidencias/mis-reportes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Error al cargar reportes');

        const reportes = await res.json();
        contenedor.innerHTML = ''; // Limpiar

        if (reportes.length === 0) {
            contenedor.innerHTML = `
                <div class="ui placeholder segment">
                    <div class="ui icon header">
                        <i class="file alternate outline icon"></i>
                        No has realizado reportes aún.
                    </div>
                </div>`;
            return;
        }

    reportes.forEach(rep => {
        const html = crearHtmlReporte(
            rep.categoria,   
            rep.descripcion, 
            new Date(rep.fecha_reporte).toLocaleDateString(), 
            rep.importancia, 
            rep.estado
        );
        contenedor.insertAdjacentHTML('beforeend', html);
    }); 

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<div class="ui negative message">Error cargando tus reportes.</div>';
    }
}

async function enviarReporte() {
    const cat = document.getElementById('input-categoria').value; // Ej: "Mantenimiento"
    const imp = document.getElementById('input-importancia').value; // Ej: "Alto"
    const txt = document.getElementById('input-texto').value;
    
    if (!cat || !imp || !txt) {
        mostrarError("Completa todos los campos");
        return;
    }

    const token = localStorage.getItem('token');
    
    // AHORA ENVIAMOS CAMPOS LIMPIOS Y SEPARADOS
    const datosParaEnviar = {
        titulo: `Reporte de ${cat}`, // Un título genérico o podrías pedir un input de titulo
        descripcion: txt,
        categoria: cat,       // <--- Campo nuevo BD
        importancia: imp,     // <--- Campo nuevo BD
        foto_url: ""
    };

    try {
        const res = await fetch('/api/incidencias', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datosParaEnviar)
        });

        if (res.ok) {
            mostrarExito("Reporte enviado correctamente.");
            document.getElementById('input-texto').value = "";
            cargarMisReportes(); 
        } else {
            mostrarError("Error al enviar reporte");
        }
    } catch (error) {
        console.error(error);
    }
}

// --- GENERADOR DE HTML ---

function crearHtmlReporte(categoria, texto, fecha, importancia, estadoBD) {
    // Colores visuales
    const coloresBarra = {
        'Mantenimiento': 'blue',
        'Seguridad': 'red',
        'Limpieza': 'green',
        'Otros': 'grey'
    };

    const coloresImportancia = {
        'Alto': 'red', 'Alta': 'red',
        'Medio': 'yellow', 'Media': 'yellow',
        'Bajo': 'green', 'Baja': 'green'
    };

    // Mapeo de Estado BD -> Visual
    let estadoLabel = 'Pendiente';
    let estadoColor = 'orange';

    if (estadoBD === 'EN_PROGRESO') { estadoLabel = 'En Revisión'; estadoColor = 'blue'; }
    if (estadoBD === 'RESUELTO') { estadoLabel = 'Resuelto'; estadoColor = 'green'; }
    if (estadoBD === 'CERRADO') { estadoLabel = 'Rechazado'; estadoColor = 'red'; }

    const colorBarra = coloresBarra[categoria] || 'grey';
    const colorImp = coloresImportancia[importancia] || 'grey';

    return `
        <div class="report-item" style="background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>${categoria}</strong>
                <div>
                    <div class="ui ${colorImp} mini label">${importancia}</div>
                    <div class="ui ${estadoColor} mini label">${estadoLabel}</div>
                </div>
            </div>
            
            <div class="report-body" style="border-left: 4px solid ${colorBarra}; padding-left: 10px; margin: 10px 0; color: #555;">
                ${texto}
            </div>

            <div class="meta-info" style="font-size: 0.85em; color: #888;">
                <i class="calendar icon"></i> ${fecha}
            </div>
        </div>
    `;
}

// --- UTILIDADES DE UI ---

function initSidebar() {
    const allToggleSelectors = '#sidebar-toggle, .sidebar-toggle-btn';
    $('.ui.sidebar').sidebar({ context: $('.pusher'), transition: 'overlay' });
    $(allToggleSelectors).click(function() {
        $('.ui.sidebar').sidebar('toggle');
    });
}

function mostrarError(mensaje) {
    const alerta = document.getElementById('alertFail');
    const textoAlerta = document.getElementById('alertMessage');
    textoAlerta.innerText = mensaje;
    alerta.style.display = 'flex';
    alerta.style.opacity = '1';
    
    setTimeout(() => {
        alerta.style.opacity = '0';
        setTimeout(() => alerta.style.display = 'none', 600);
    }, 4000);
}

function mostrarExito(mensaje) {
    const alerta = document.getElementById('alertSuccess');
    const textoAlerta = document.getElementById('successMessage');
    textoAlerta.innerText = mensaje;
    alerta.style.display = 'flex';
    alerta.style.opacity = '1';

    setTimeout(() => {
        alerta.style.opacity = '0';
        setTimeout(() => alerta.style.display = 'none', 600);
    }, 3000);
}