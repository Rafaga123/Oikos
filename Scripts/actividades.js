document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
    $('.ui.dropdown').dropdown();
    loadResidentActivities();
});

async function loadResidentActivities() {
    const token = localStorage.getItem('token');
    const grid = document.getElementById('activities-grid');
    
    try {
        const res = await fetch('/api/actividades', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Error API');
        
        const data = await res.json();
        grid.innerHTML = '';

        if (data.length === 0) {
            grid.innerHTML = '<div class="ui message info" style="margin: 0 auto;">No hay actividades programadas.</div>';
            return;
        }

        // Filtramos solo las confirmadas o pendientes (no canceladas, opcional)
        // O mostramos todas. Aquí muestro todas ordenadas.
        const activities = data.filter(a => a.estado !== 'cancelled');

        // Renderizado usando el diseño de Tarjetas Semantic UI
        activities.forEach(a => {
            const fecha = new Date(a.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' });
            
            // Icono según tipo
            let icon = 'calendar icon';
            if(a.tipo === 'meeting') icon = 'users icon';
            if(a.tipo === 'maintenance') icon = 'tools icon';
            if(a.tipo === 'reservation') icon = 'clock icon';

            const html = `
                <div class="column">
                    <div class="ui fluid card">
                        <div class="content">
                            <div class="header">
                                <i class="${icon} red"></i> ${a.titulo}
                            </div>
                            <div class="meta">
                                <span class="date"><i class="calendar icon"></i> ${fecha}</span>
                            </div>
                            <div class="meta">
                                <span class="time"><i class="clock icon"></i> ${a.hora_inicio}</span>
                            </div>
                            <div class="meta">
                                <span class="location"><i class="map marker alternate icon"></i> ${getAreaName(a.area)}</span>
                            </div>
                            <div class="description" style="margin-top: 10px;">
                                <p>${a.descripcion}</p>
                            </div>
                        </div>
                        ${a.estado === 'pending' ? '<div class="extra content"><span class="ui orange label mini">Pendiente</span></div>' : ''}
                    </div>
                </div>
            `;
            grid.insertAdjacentHTML('beforeend', html);
        });

    } catch (error) {
        console.error(error);
        grid.innerHTML = '<div class="ui error message">Error cargando actividades.</div>';
    }
}

function getAreaName(area) {
    const areas = { 
        'salon': 'Salón de fiestas', 
        'parque': 'Parque Infantil', 
        'piscina': 'Área de Piscina', 
        'gym': 'Gimnasio', 
        'bbq': 'Zona BBQ', 
        'estacionamiento': 'Estacionamiento', 
        'jardin': 'Jardines', 
        'otro': 'Área Común' 
    };
    return areas[area] || area;
}

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