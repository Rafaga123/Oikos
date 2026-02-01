document.addEventListener("DOMContentLoaded", function() {
    initSidebar();
    $('.ui.dropdown').dropdown();
    cargarEncuestas();
});

async function cargarEncuestas() {
    const token = localStorage.getItem('token');
    const contenedor = document.getElementById('lista-encuestas');
    
    try {
        const res = await fetch('/api/encuestas', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Error API');
        
        const encuestas = await res.json();
        contenedor.innerHTML = ''; // Limpiar


        if (encuestas.length === 0) {
            // Quitamos la clase grid/cards temporalmente para que el mensaje ocupe todo el ancho
            contenedor.className = ''; 
            contenedor.innerHTML = `
                <div class="ui placeholder segment">
                    <div class="ui icon header">
                        <i class="clipboard check icon"></i>
                        Todo al día
                    </div>
                    <div class="inline">No hay encuestas activas en este momento.</div>
                </div>
            `;
            return;
        } else {
            // Aseguramos que la clase vuelva a ser grid si hay datos
            contenedor.className = 'ui four cards';
        }

        encuestas.forEach(enc => {
            const fechaFin = new Date(enc.fecha_fin).toLocaleDateString();
            // Si ya votó, cambiamos el botón
            const btnTexto = enc.yaVote ? 'Ya respondida' : 'Hacer Encuesta';
            const btnClase = enc.yaVote ? 'disabled' : '';
            // Pasamos el ID de la encuesta en la URL
            const link = enc.yaVote ? '#' : `./encuesta.html?id=${enc.id}`; 

            const html = `
                <div class="card">
                    <div class="blurring dimmable image">
                        <div class="ui dimmer">
                            <div class="content">
                                <div class="center">
                                    <a href="${link}" class="ui inverted button ${btnClase}">${btnTexto}</a>
                                </div>
                            </div>
                        </div>
                        <img src="../Images/Comunidad.png"> </div>
                    <div class="content">
                        <a class="header">${enc.titulo}</a>
                        <div class="meta">
                            <span class="date">Hasta: ${fechaFin}</span>
                        </div>
                    </div>
                    <div class="extra content">
                        <a><i class="users icon"></i> ${enc.totalVotos} votos</a>
                    </div>
                </div>
            `;
            contenedor.insertAdjacentHTML('beforeend', html);
        });

        // Reactivar efecto dimmer
        $('.blurring.dimmable.image').dimmer({ on: 'hover' });

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<div class="ui message red">Error al cargar.</div>';
    }
}

function initSidebar() {
    const allToggleSelectors = '#sidebar-toggle, .sidebar-toggle-btn';
    $('.ui.sidebar').sidebar({ context: $('.pusher'), transition: 'overlay' });
    $(allToggleSelectors).click(() => $('.ui.sidebar').sidebar('toggle'));
}