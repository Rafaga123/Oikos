document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
    $('.ui.dropdown').dropdown();
    cargarReglamento();
});

async function cargarReglamento() {
    const token = localStorage.getItem('token');
    const contenedor = document.getElementById('contenedor-reglamento');
    
    try {
        const res = await fetch('/api/reglas', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Error al cargar');
        
        const reglas = await res.json();
        contenedor.innerHTML = ''; // Quitar loader

        if (reglas.length === 0) {
            contenedor.innerHTML = `
                <div class="ui placeholder segment">
                    <div class="ui icon header">
                        <i class="file alternate outline icon"></i>
                        Sin Reglamento
                    </div>
                    <div class="inline">El gestor aún no ha publicado las reglas del condominio.</div>
                </div>
            `;
            return;
        }

        // Agrupar reglas por categoría
        const categorias = {
            'convivencia': [], 'areas-comunes': [], 'seguridad': [], 'administrativo': [], 'otros': []
        };

        reglas.forEach(r => {
            if (categorias[r.categoria]) {
                categorias[r.categoria].push(r);
            } else {
                categorias['otros'].push(r);
            }
        });

        // Generar HTML
        let htmlContent = '<div class="ui styled fluid accordion">';
        
        for (const [key, lista] of Object.entries(categorias)) {
            if (lista.length > 0) {
                const info = getCategoryInfo(key);
                htmlContent += `
                    <div class="active title" style="color: ${info.color}">
                        <i class="dropdown icon"></i>
                        ${info.name}
                    </div>
                    <div class="active content">
                        <div class="ui relaxed divided list">
                `;
                
                lista.forEach(r => {
                    htmlContent += `
                        <div class="item">
                            <div class="content">
                                <div class="header">${r.titulo}</div>
                                <div class="description" style="margin-top:5px">${r.contenido}</div>
                            </div>
                        </div>
                    `;
                });

                htmlContent += `</div></div>`; // Cerrar list y content
            }
        }
        
        htmlContent += '</div>'; // Cerrar accordion
        
        // Agregar intro
        contenedor.innerHTML = `
            <p>A continuación se presentan las normas vigentes de nuestra comunidad:</p>
            ${htmlContent}
        `;

        // Activar acordeón
        $('.ui.accordion').accordion();

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<div class="ui negative message">No se pudo cargar el reglamento.</div>';
    }
}

function getCategoryInfo(cat) {
    const map = {
        'convivencia': { name: 'Convivencia y Ruido', color: '#2e7d32' },
        'areas-comunes': { name: 'Uso de Áreas Comunes', color: '#1565c0' },
        'seguridad': { name: 'Seguridad y Acceso', color: '#ef6c00' },
        'administrativo': { name: 'Pagos y Administración', color: '#7b1fa2' },
        'otros': { name: 'Disposiciones Generales', color: '#424242' }
    };
    return map[cat] || map['otros'];
}

function initSidebar() {
    const allToggleSelectors = '#sidebar-toggle, .sidebar-toggle-btn';
    $('.ui.sidebar').sidebar({ context: $('.pusher'), transition: 'overlay' });
    $(allToggleSelectors).click(() => $('.ui.sidebar').sidebar('toggle'));
}