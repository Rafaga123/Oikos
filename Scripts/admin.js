$(document).ready(function() {
            // Inicializar dropdowns
            $('.ui.dropdown').dropdown();
            
            // Controlar sidebar en móviles
            $('#sidebar-toggle').click(function() {
                $('.ui.sidebar').sidebar('toggle');
            });
            
           // Hacer que las tarjetas sean clickeables
            $('.link-card').click(function() {
            const button = $(this).find('.button');
            if (button.length) {
            // Obtener la URL del atributo data-href del botón
            const targetPage = button.data('href');
        
            if (targetPage) {
            // Simular clic en el botón
            button.addClass('loading');
            setTimeout(() => {
                button.removeClass('loading');
                window.location.href = targetPage;
            }, 800);
        }
    }
});
            
            // Para pantallas grandes, mostrar sidebar como fijo
            if ($(window).width() > 768) {
                $('.ui.sidebar').addClass('visible');
                $('.ui.sidebar').sidebar({
                    context: $('.pusher'),
                    transition: 'overlay'
                });
            }

// Animaciones para los gráficos
    $(document).ready(function() {
        // Animar gráficos circulares
        $('.circle').each(function() {
            const circle = $(this);
            const radius = 15.9155; // Radio del círculo SVG
            const circumference = 2 * Math.PI * radius;
            const strokeDashArray = circle.attr('stroke-dasharray');
            const [value] = strokeDashArray.split(',').map(Number);
            
            circle.css({
                'stroke-dasharray': `0, ${circumference}`,
                'stroke-dashoffset': circumference
            });
            
            setTimeout(() => {
                circle.css({
                    'stroke-dasharray': `${(value/100) * circumference}, ${circumference}`,
                    'transition': 'stroke-dasharray 1.5s ease'
                });
            }, 300);
        });
        
        // Animar gráfico de línea
        $('.line-path').each(function() {
            const path = $(this);
            const length = 300; // Longitud aproximada de la línea
            
            path.css({
                'stroke-dasharray': length,
                'stroke-dashoffset': length
            });
            
            setTimeout(() => {
                path.css({
                    'stroke-dashoffset': '0',
                    'transition': 'stroke-dashoffset 1.5s ease'
                });
            }, 500);
        });
        
        // Animar barras
        $('.bar').each(function() {
            const bar = $(this);
            const originalHeight = bar.css('height');
            
            bar.css({
                'height': '0%',
                'transition': 'height 1s ease'
            });
            
            setTimeout(() => {
                bar.css('height', originalHeight);
            }, 800);
        });
    });

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

 });