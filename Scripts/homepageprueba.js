document.addEventListener('DOMContentLoaded', function() { //Ejecuta la acción una vez esté completamente cargado el DOM
    
    //SIDEBAR 

    //Seleccion los elementos por su clase
    const sidebar = document.querySelector('.ui.left.vertical.inverted.sidebar.labeled.icon.menu');
    const pusher = document.querySelector('.pusher');

    //Seleccionamos todos los botones de alternancia (el del menú superior y el del sidebar)
    const toggleButtons = document.querySelectorAll('.sidebar-toggle-btn');
    
    //Funcion para manejar los eventos (click)
    function toggleSidebar() {
        // Simula la función .sidebar('toggle')
        // Al usar .classList.toggle(), se añade la clase si no existe, o se elimina si existe.
        
        // El sidebar se muestra u oculta (clase 'visible')
        sidebar.classList.toggle('visible'); 
        
        //Empuja el contenido principal se "empuja" o vuelve a su posición original (clase 'pushed')
        pusher.classList.toggle('pushed'); 
        
        //El body se atenúa cuando el sidebar está visible
        document.body.classList.toggle('dimmed'); 
    }
    
    // Asigna la función 'toggleSidebar' a todos los botones que tienen la clase
    toggleButtons.forEach(button => {
        button.addEventListener('click', toggleSidebar); //Ejecuta la funcion toggleSidebar al hacer click
    });

    //Carrousel de anuncios
    initAnnouncementCarousel();

});

//Función para inicializar el carrusel de anuncios
function initAnnouncementCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const indicatorsContainer = document.querySelector('.carousel-indicators');
    
    // Si no hay carrusel en la página, salir
    if (!slides.length || !indicatorsContainer) return;
    
    let currentSlide = 0;
    let slideInterval;
    
    // Crear indicadores dinámicamente
    function createIndicators() {
        indicatorsContainer.innerHTML = '';
        
        slides.forEach((slide, index) => {
            const indicator = document.createElement('div');
            indicator.classList.add('indicator');
            if (index === currentSlide) {
                indicator.classList.add('active');
            }
            indicator.addEventListener('click', () => {
                goToSlide(index);
            });
            indicatorsContainer.appendChild(indicator);
        });
    }
    
    // Función para ir a un slide específico
    function goToSlide(n) {
        slides[currentSlide].classList.remove('active');
        
        currentSlide = n;
        
        // Si el índice es mayor que el número de slides, volver al primero
        if (currentSlide >= slides.length) {
            currentSlide = 0;
        }
        
        // Si el índice es menor que 0, ir al último slide
        if (currentSlide < 0) {
            currentSlide = slides.length - 1;
        }
        
        slides[currentSlide].classList.add('active');
        updateIndicators();
    }
    
    // Función para actualizar los indicadores
    function updateIndicators() {
        const indicators = document.querySelectorAll('.indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentSlide);
        });
    }
    
    // Función para ir al siguiente slide
    function nextSlide() {
        goToSlide(currentSlide + 1);
    }
    
    // Función para ir al slide anterior
    function prevSlide() {
        goToSlide(currentSlide - 1);
    }
    
    // Iniciar auto-avance
    function startAutoSlide() {
        slideInterval = setInterval(nextSlide, 5000);
    }
    
    // Pausar auto-avance
    function stopAutoSlide() {
        clearInterval(slideInterval);
    }
    
    // Inicializar el carrusel
    function initCarousel() {
        // Crear indicadores
        createIndicators();
        
        // Inicializar primer slide
        slides[currentSlide].classList.add('active');
        
        // Event listeners para los botones
        if (nextBtn) {
            nextBtn.addEventListener('click', nextSlide);
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', prevSlide);
        }
        
        // Iniciar auto-avance
        startAutoSlide();
        
        // Pausar el auto-avance cuando el mouse está sobre el carrusel
        const carousel = document.querySelector('.carousel-container');
        if (carousel) {
            carousel.addEventListener('mouseenter', stopAutoSlide);
            carousel.addEventListener('mouseleave', startAutoSlide);
        }
    }
    
    // Inicializar carrusel
    initCarousel();
}