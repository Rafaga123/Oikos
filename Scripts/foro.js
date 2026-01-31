// --- ESTRUCTURA DE DATOS: PILA (STACK) ---
class PilaPosts {
    constructor() {
        this.items = [];
    }
    // Agregar elemento al tope
    push(element) {
        this.items.push(element);
    }
    // Sacar elemento del tope
    pop() {
        if (this.items.length === 0) return null;
        return this.items.pop();
    }
    isEmpty() {
        return this.items.length === 0;
    }
    limpiar() {
        this.items = [];
    }
}

// Instancia global de la pila
const pilaDelForo = new PilaPosts();

document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
    configurarModal();
    cargarPosts(); // Cargar datos reales al iniciar

    // Inicializar componentes Semantic
    $('.ui.dropdown').dropdown();
});

// --- LÓGICA DE API Y RENDERIZADO ---

async function cargarPosts() {
    const token = localStorage.getItem('token');
    const contenedor = document.getElementById('contenedor-posts'); // OJO: Debes agregar este ID en el HTML
    
    // Limpiamos visualmente y la pila
    contenedor.innerHTML = '<div class="ui active loader"></div>'; 
    pilaDelForo.limpiar();

    try {
        const res = await fetch('http://localhost:3000/api/foro', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Error al cargar posts');
        
        const posts = await res.json();
        contenedor.innerHTML = ''; // Quitar loader

        if (posts.length === 0) {
            contenedor.innerHTML = `
                <div class="ui placeholder segment" style="width: 100%; margin-top: 20px;">
                    <div class="ui icon header">
                        <i class="comments outline icon"></i>
                        El foro está muy tranquilo hoy
                    </div>
                    <div class="inline">Aún no hay publicaciones en tu comunidad. ¡Sé el primero en escribir algo!</div>
                </div>
            `;
            return;
        }

        // 1. LLENAR LA PILA
        // El servidor los manda por fecha ascendente (viejos primero).
        // Al hacer push, el más nuevo queda en el tope (ultimo index).
        posts.forEach(post => pilaDelForo.push(post));

        // 2. VACIAR LA PILA PARA RENDERIZAR
        // Al hacer pop, sacamos el más nuevo primero (LIFO) y lo pintamos arriba.
        while (!pilaDelForo.isEmpty()) {
            const post = pilaDelForo.pop();
            const htmlPost = crearHTMLPost(post);
            contenedor.innerHTML += htmlPost; // Añadir al DOM
        }

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<p style="text-align:center">No se pudieron cargar los posts.</p>';
    }
}

function crearHTMLPost(post) {
    const fecha = new Date(post.fecha_creacion).toLocaleDateString();
    const avatar = post.usuario.foto_perfil_url || '../Images/default.jpg';
    const claseLike = post.dio_like ? 'red' : ''; // Corazón rojo si ya dio like

    return `
    <div class="column">
        <div class="ui fluid card">
            <div class="content">
                <div class="right floated meta">${fecha}</div>
                <img class="ui avatar image" src="${avatar}"> ${post.usuario.primer_nombre}
            </div>
            <div class="content">
                <div class="header">${post.titulo}</div>
                <div class="description">
                    <p>${post.contenido}</p>
                </div>
            </div>
            <div class="extra content">
                <span class="left floated like-btn" onclick="toggleLike(${post.id}, this)" style="cursor: pointer;">
                    <i class="${claseLike} like icon"></i>
                    <span class="count">${post.cantidad_likes}</span> Likes
                </span>
            </div>
        </div>
    </div>
    `;
}

async function publicarPost() {
    const token = localStorage.getItem('token');
    const titulo = document.querySelector('input[name="Tema"]').value;
    const contenido = document.querySelector('input[name="Descripción"]').value;

    try {
        const res = await fetch('http://localhost:3000/api/foro', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ titulo, contenido })
        });

        if (res.ok) {
            // Éxito
            $('#modalAgregar').modal('hide');
            $('#alertSuccess').fadeIn().delay(2000).fadeOut();
            cargarPosts(); // Recargar todo para ver el nuevo post
        } else {
            Swal.fire({
                icon: 'error',
                title: 'No se publicó',
                text: 'Hubo un problema al crear la publicación.'
            });
        }
    } catch (error) {
        console.error(error);
    }
}

async function toggleLike(idPost, elementoHtml) {
    const token = localStorage.getItem('token');
    const icono = elementoHtml.querySelector('i');
    const contador = elementoHtml.querySelector('.count');
    let numeroLikes = parseInt(contador.innerText);

    try {
        const res = await fetch(`http://localhost:3000/api/foro/${idPost}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        if (data.dio_like) {
            icono.classList.add('red');
            contador.innerText = numeroLikes + 1;
        } else {
            icono.classList.remove('red');
            contador.innerText = numeroLikes - 1;
        }

    } catch (error) {
        console.error('Error dando like', error);
    }
}

// --- CONFIGURACIÓN VISUAL---

function initSidebar() {
    $('.ui.sidebar').sidebar({ context: $('.pusher'), transition: 'overlay' });
    $('#sidebar-toggle, .sidebar-toggle-btn').click(function() {
        $('.ui.sidebar').sidebar('toggle');
    });
}

function configurarModal() {
    $('#agregarBtn').on('click', function() {
        $('#modalAgregar .ui.form').form('clear');
        $('#modalAgregar').modal('show');
    });

    // Lógica del botón "Publicar" del modal
    $('#publicar').on('click', function() {
        const $form = $('#modalAgregar .ui.form');
        // Validar visualmente
        if( !$('input[name="Tema"]').val() || !$('input[name="Descripción"]').val() ) {
            $('#alertFail').fadeIn().delay(2000).fadeOut();
            return false;
        }
        // Si pasa, enviar a API
        publicarPost();
        return false; // Evitamos que cierre el modal automáticamente hasta que responda la API
    });
}