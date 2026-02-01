let encuestasData = [];

$(document).ready(function() {
    // Inicializar UI
    $('.ui.dropdown').dropdown();
    $('#sidebar-toggle').click(() => $('.ui.sidebar').sidebar('toggle'));
    $('.ui.sidebar').sidebar({ context: $('.pusher'), transition: 'overlay' });

    // Cargar datos reales
    cargarResultadosEncuestas();

    // Eventos Filtros
    $('#apply-filters').click(aplicarFiltros);
    $('#sort-by').change(ordenarEncuestas);
});

async function cargarResultadosEncuestas() {
    const token = localStorage.getItem('token');
    
    try {
        const res = await fetch('http://localhost:3000/api/gestor/encuestas/resultados', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Error al cargar');
        
        encuestasData = await res.json();
        
        renderizarEstadisticasGlobales();
        renderizarEncuestas(encuestasData);

    } catch (error) {
        console.error(error);
        $('#surveys-container').html('<div class="ui error message">No se pudieron cargar los resultados.</div>');
    }
}

function renderizarEstadisticasGlobales() {
    // Cálculos
    const totalEncuestas = encuestasData.length;
    const totalVotos = encuestasData.reduce((sum, e) => sum + e.total_votos, 0);
    const promedioVotos = totalEncuestas > 0 ? Math.round(totalVotos / totalEncuestas) : 0;
    
    // Inyectar HTML
    const html = `
        <div class="stat-card">
            <div class="stat-icon" style="background-color: #9A9CEA;"><i class="chart pie icon"></i></div>
            <div class="stat-content">
                <div class="stat-number">${totalEncuestas}</div>
                <div class="stat-label">Encuestas totales</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background-color: #4CAF50;"><i class="users icon"></i></div>
            <div class="stat-content">
                <div class="stat-number">${totalVotos}</div>
                <div class="stat-label">Votos totales</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background-color: #2196F3;"><i class="percent icon"></i></div>
            <div class="stat-content">
                <div class="stat-number">${promedioVotos}</div>
                <div class="stat-label">Promedio de votos</div>
            </div>
        </div>
    `;
    $('#stats-grid').html(html);
}

function renderizarEncuestas(data) {
    const container = $('#surveys-container');
    container.empty();

    if (data.length === 0) {
        container.html('<div class="ui message info">No se encontraron encuestas.</div>');
        return;
    }

    data.forEach(e => {
        // Configuración visual según estado
        let statusBadge = '';
        if(e.estado === 'active') statusBadge = '<span class="survey-status badge-active"><i class="unlock icon"></i> Activa</span>';
        if(e.estado === 'closed') statusBadge = '<span class="survey-status badge-closed"><i class="lock icon"></i> Finalizada</span>';
        if(e.estado === 'scheduled') statusBadge = '<span class="survey-status badge-scheduled"><i class="clock icon"></i> Programada</span>';

        const fechas = `${new Date(e.fecha_inicio).toLocaleDateString()} - ${new Date(e.fecha_fin).toLocaleDateString()}`;

        // Renderizar opciones y barras
        let opcionesHtml = '';
        e.opciones.forEach(op => {
            // Colores cíclicos para las barras
            const colores = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];
            const color = colores[op.id % colores.length];
            
            opcionesHtml += `
                <div class="answer-bar">
                    <div class="answer-label">${op.texto}</div>
                    <div class="answer-percentage-bar">
                        <div class="percentage-fill" style="width: ${op.porcentaje}%; background-color: ${color};"></div>
                    </div>
                    <div class="answer-value">${op.porcentaje}% (${op.votos} votos)</div>
                </div>
            `;
        });

        const cardHtml = `
            <div class="survey-card" data-status="${e.estado}">
                <div class="survey-header">
                    <div class="survey-title-section">
                        <h3 class="survey-title">${e.titulo}</h3>
                        <div class="survey-meta">
                            ${statusBadge}
                            <span class="survey-date"><i class="calendar icon"></i> ${fechas}</span>
                        </div>
                    </div>
                    <div class="survey-stats">
                        <div class="stat">
                            <div class="stat-value">${e.total_votos}</div>
                            <div class="stat-label">Votos</div>
                        </div>
                    </div>
                </div>
                
                <div class="survey-description">
                    <p>${e.descripcion}</p>
                </div>
                
                <div class="survey-results-summary">
                    <h4><i class="chart bar icon"></i> Resultados</h4>
                    <div class="result-answers">
                        ${opcionesHtml}
                    </div>
                </div>
            </div>
        `;
        container.append(cardHtml);
    });
}

function aplicarFiltros() {
    const status = $('#filter-status').val();
    let filtradas = encuestasData;

    if (status !== 'all') {
        filtradas = encuestasData.filter(e => e.estado === status);
    }
    
    // Aplicar ordenamiento actual también
    const sortBy = $('#sort-by').val();
    filtradas = ordenarLista(filtradas, sortBy);

    renderizarEncuestas(filtradas);
}

function ordenarEncuestas() {
    aplicarFiltros(); // Re-aplicar filtros y orden
}

function ordenarLista(lista, criterio) {
    const sorted = [...lista];
    
    if (criterio === 'newest') {
        sorted.sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio));
    } else if (criterio === 'oldest') {
        sorted.sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));
    } else if (criterio === 'responses') {
        sorted.sort((a, b) => b.total_votos - a.total_votos);
    }
    
    return sorted;
}