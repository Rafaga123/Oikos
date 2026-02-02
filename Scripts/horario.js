document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
    cargarDashboardHorarios();
});

async function cargarDashboardHorarios() {
    const token = localStorage.getItem('token');
    const container = document.querySelector('.horarios-dashboard');
    
    try {
        const res = await fetch('http://localhost:3000/api/horarios', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if(!res.ok) throw new Error('Error API');
        
        const horarios = await res.json();
        container.innerHTML = ''; // Limpiar contenido estático

        if (horarios.length === 0) {
            container.innerHTML = '<div class="ui message info">No hay horarios configurados en tu comunidad.</div>';
            return;
        }

        // Mapeo de iconos y colores según el área (valor del select del gestor)
        const areaConfig = {
            'piscina': { icon: 'swimming pool', color: 'blue' },
            'gimnasio': { icon: 'dumbbell', color: 'orange' },
            'salon': { icon: 'birthday cake', color: 'purple' },
            'parque': { icon: 'child', color: 'green' },
            'bbq': { icon: 'fire', color: 'red' },
            'lavanderia': { icon: 'tshirt', color: 'teal' },
            'estacionamiento': { icon: 'car', color: 'grey' },
            'otro': { icon: 'clock', color: 'black' }
        };

        horarios.forEach(h => {
            // Solo mostrar activos a menos que sea un aviso especial
            if(h.estado === 'inactivo') return;

            const config = areaConfig[h.area] || areaConfig['otro'];
            const diasTexto = h.dias.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
            
            // Renderizar tarjeta
            const cardHtml = `
                <div class="area-card" style="border-top: 4px solid var(--${config.color}, #9A9CEA)">
                    <div class="area-header">
                        <div class="area-title">
                            <div class="area-icon" style="background-color: var(--${config.color}-light, #eee); color: var(--${config.color}, #333)">
                                <i class="${config.icon} icon"></i>
                            </div>
                            ${h.nombre}
                        </div>
                        <div class="area-status ${h.estado === 'activo' ? 'status-abierto' : 'status-cerrado'}">
                            ${h.estado.toUpperCase()}
                        </div>
                    </div>
                    
                    <div class="horario-item">
                        <div class="horario-dias"><i class="calendar alternate outline icon"></i> ${diasTexto}</div>
                        <div class="horario-horas"><i class="clock outline icon"></i> ${h.hora_inicio} - ${h.hora_fin}</div>
                        ${h.capacidad ? `<div class="horario-notas"><i class="users icon"></i> Máx: ${h.capacidad} personas</div>` : ''}
                    </div>

                    ${h.descripcion ? `<div class="ui segment secondary"><small>${h.descripcion}</small></div>` : ''}

                    ${h.restricciones.length > 0 ? `
                        <div class="ui list bulleted">
                            ${h.restricciones.map(r => `<div class="item">${r}</div>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
            container.insertAdjacentHTML('beforeend', cardHtml);
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="ui message error">Error al cargar horarios.</div>';
    }
}

function initSidebar() {
    $('.ui.sidebar').sidebar({ context: $('.pusher'), transition: 'overlay' });
    $('#sidebar-toggle').click(() => $('.ui.sidebar').sidebar('toggle'));
}