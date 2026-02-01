document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
    $('.ui.dropdown').dropdown();
    
    // Cargar anuncios reales antes de iniciar el carrusel
    cargarAnuncios();
});

// --- API Y LÓGICA DE DATOS ---

async function cargarAnuncios() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('carousel-container');
    
    try {
        const res = await fetch('http://localhost:3000/api/anuncios', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Error al cargar');

        const anuncios = await res.json();
        container.innerHTML = ''; // Limpiar

        if (anuncios.length === 0) {
            // Mostrar mensaje si no hay nada
            container.innerHTML = `
                <div class="carousel-slide active" style="text-align: center; padding: 40px;">
                    <h3 class="announcement-title">Todo tranquilo por aquí</h3>
                    <div class="announcement-content">
                        <p>No hay anuncios recientes en tu comunidad.</p>
                        <img src="../Images/logo.png" alt="No hay anuncios" style="max-width: 200px; margin-top: 20px;">
                    </div>
                </div>
            `;
            // Ocultar flechas si no hay anuncios o solo hay uno vacio
            document.querySelector('.carousel-nav').style.display = 'none';
            return;
        }

        // Generar HTML por cada anuncio
        anuncios.forEach((anuncio, index) => {
            const fecha = new Date(anuncio.fecha_publicacion).toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            
            // Clase active solo para el primero
            const activeClass = index === 0 ? 'active' : '';
            
            // Etiqueta de prioridad
            const priorityBadge = anuncio.prioridad 
                ? '<div class="ui red ribbon label">IMPORTANTE</div>' 
                : '';

            const slide = `
                <div class="carousel-slide ${activeClass}">
                    ${priorityBadge}
                    <h3 class="announcement-title" style="${anuncio.prioridad ? 'margin-top:10px' : ''}">
                        ${anuncio.titulo}
                    </h3>
                    <div class="announcement-date">Publicado: ${fecha}</div>
                    <div class="announcement-content">
                        <p>${anuncio.contenido.replace(/\n/g, '<br>')}</p>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', slide);
        });

        // Una vez inyectado el HTML, iniciamos la lógica visual del carrusel
        initAnnouncementCarousel();

    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="ui message red">No se pudieron cargar los anuncios.</div>';
    }
}

// --- LÓGICA VISUAL (Tu código original adaptado) ---

function initAnnouncementCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const indicatorsContainer = document.querySelector('.carousel-indicators');
    
    // Si hay 0 o 1 slide, ocultamos controles de navegación
    if (slides.length <= 1) {
        if(prevBtn) prevBtn.style.display = 'none';
        if(nextBtn) nextBtn.style.display = 'none';
        return; 
    } else {
        // Asegurar que se vean si hay más de 1
        if(prevBtn) prevBtn.style.display = 'block';
        if(nextBtn) nextBtn.style.display = 'block';
    }
    
    let currentSlide = 0;
    let slideInterval;
    
    function createIndicators() {
        indicatorsContainer.innerHTML = '';
        slides.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.classList.add('indicator');
            if (index === currentSlide) indicator.classList.add('active');
            
            indicator.addEventListener('click', () => {
                goToSlide(index);
                resetAutoSlide(); // Reiniciar timer al interactuar
            });
            indicatorsContainer.appendChild(indicator);
        });
    }
    
    function goToSlide(n) {
        slides[currentSlide].classList.remove('active');
        currentSlide = (n + slides.length) % slides.length; // Ciclo infinito matemático
        slides[currentSlide].classList.add('active');
        updateIndicators();
    }
    
    function updateIndicators() {
        const indicators = document.querySelectorAll('.indicator');
        indicators.forEach((ind, index) => {
            ind.classList.toggle('active', index === currentSlide);
        });
    }
    
    function nextSlide() { goToSlide(currentSlide + 1); }
    function prevSlide() { goToSlide(currentSlide - 1); }
    
    function startAutoSlide() {
        slideInterval = setInterval(nextSlide, 6000); // 6 segundos
    }
    
    function resetAutoSlide() {
        clearInterval(slideInterval);
        startAutoSlide();
    }
    
    // Inicialización
    createIndicators();
    
    if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetAutoSlide(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetAutoSlide(); });
    
    startAutoSlide();
    
    // Pausar con el mouse
    const carousel = document.querySelector('.announcement-carousel'); // Selector corregido al contenedor padre
    if (carousel) {
        carousel.addEventListener('mouseenter', () => clearInterval(slideInterval));
        carousel.addEventListener('mouseleave', startAutoSlide);
    }
}

// SIDEBAR
function initSidebar() {
    const allToggleSelectors = '#sidebar-toggle, .sidebar-toggle-btn';
    $('.ui.sidebar').sidebar({ context: $('.pusher'), transition: 'overlay' });
    $(allToggleSelectors).click(function() {
        $('.ui.sidebar').sidebar('toggle');
    });
}