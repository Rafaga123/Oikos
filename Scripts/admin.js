$(document).ready(function() {
    // Inicializar UI
    $('.ui.dropdown').dropdown();
    $('#sidebar-toggle').click(() => $('.ui.sidebar').sidebar('toggle'));

    // Cargar estadísticas reales
    cargarEstadisticas();
});

async function cargarEstadisticas() {
    const token = localStorage.getItem('token');
    
    try {
        const res = await fetch('/api/gestor/dashboard-stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Error API');
        
        const data = await res.json();
        
        // 1. Habitantes Activos (Porcentaje)
        const totalHab = data.habitantes.total || 1; // Evitar división por 0
        const activos = data.habitantes.activos;
        const pctActivos = Math.round((activos / totalHab) * 100);
        
        $('#val-habitantes').text(activos); // Cantidad numérica
        $('#pct-habitantes').text(pctActivos + '%'); // Texto del círculo
        animarCirculo('#circle-habitantes', pctActivos);

        // 2. Pagos (Pendientes texto + Barras historial)
        $('#val-pagos-pendientes').text(data.pagos.pendientes);
        generarGraficaBarras(data.pagos.historial);

        // 3. Incidentes Pendientes
        $('#val-incidentes').text(data.incidentes);

        // 4. Solicitudes Nuevas
        // Para el círculo de solicitudes, mostraremos un "porcentaje de atención" inverso
        // O simplemente llenamos el círculo completo si hay solicitudes pendientes para llamar la atención.
        const solicitudes = data.solicitudes;
        $('#val-solicitudes').text(solicitudes);
        $('#pct-solicitudes').text(solicitudes); // Mostramos el número dentro del círculo también
        
        // Si hay solicitudes, ponemos el círculo al 100% para alertar, si no 0%
        const pctSolicitudes = solicitudes > 0 ? 100 : 0; 
        animarCirculo('#circle-solicitudes', pctSolicitudes);

    } catch (error) {
        console.error(error);
        // Fallback visual si hay error
        $('.chart-value').text('-');
        $('#chart-pagos-barras').html('<p style="font-size:0.8em; color:grey; text-align:center; padding-top:20px">Sin datos</p>');
    }
}

// Función para animar los gráficos circulares SVG
function animarCirculo(selector, porcentaje) {
    const circle = $(selector);
    const radius = 15.9155;
    const circumference = 2 * Math.PI * radius; // Aprox 100 en este sistema de coordenadas
    
    // Reset inicial
    circle.css({
        'stroke-dasharray': `0, 100`,
        'transition': 'none'
    });

    // Animar
    setTimeout(() => {
        circle.css({
            'transition': 'stroke-dasharray 1.5s ease',
            'stroke-dasharray': `${porcentaje}, 100`
        });
    }, 100);
}

// Función para procesar pagos y crear gráfico de barras
function generarGraficaBarras(historialPagos) {
    const contenedor = $('#chart-pagos-barras');
    contenedor.empty();

    // 1. Agrupar pagos por mes (últimos 6 meses)
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const conteoPorMes = {};
    const hoy = new Date();

    // Inicializar últimos 6 meses en 0
    for (let i = 5; i >= 0; i--) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        const key = meses[d.getMonth()];
        conteoPorMes[key] = 0;
    }

    // Llenar con datos reales
    historialPagos.forEach(p => {
        const d = new Date(p.fecha_pago);
        const key = meses[d.getMonth()];
        if (conteoPorMes.hasOwnProperty(key)) {
            conteoPorMes[key]++;
        }
    });

    // 2. Encontrar valor máximo para escalar (altura 100%)
    const valores = Object.values(conteoPorMes);
    const maxVal = Math.max(...valores, 5); // Mínimo escala de 5 para que no se vea feo si hay pocos

    // 3. Generar HTML de las barras
    Object.keys(conteoPorMes).forEach(mes => {
        const cantidad = conteoPorMes[mes];
        const altura = (cantidad / maxVal) * 100; // Porcentaje de altura
        
        const barraHtml = `
            <div class="bar" style="height: 0%" data-height="${altura}%">
                <div class="bar-tooltip">${cantidad}</div>
                <div class="bar-label">${mes}</div>
            </div>
        `;
        contenedor.append(barraHtml);
    });

    // 4. Animar altura
    setTimeout(() => {
        $('.bar').each(function() {
            const h = $(this).data('height');
            $(this).css('height', h);
        });
    }, 100);
}