// --- ESTRUCTURA DE DATOS: PILA (STACK) ---
class PilaPosts {
    //Se ejecuta al crear la pila. Inicializa un arreglo vacío para guardar los datos
    constructor() { this.items = []; }

    //Agrega un elemento a la parte superior
    push(element) { this.items.push(element); }
    
    //Saca y devuelve el último elemento 
    //Si está vacía, devuelve null para evitar errores
    pop() { return this.isEmpty() ? null : this.items.pop(); }
    //devuelve true si la pila está vacía
    isEmpty() { return this.items.length === 0; }
    limpiar() { this.items = []; }
}

const pilaDelForo = new PilaPosts();

$(document).ready(function() {
    initSidebar();
    configurarModal();
    $('.ui.dropdown').dropdown();
    
    // Cargar posts al iniciar
    cargarPosts();
});

// --- LÓGICA DE API ---

async function cargarPosts() {
    const token = localStorage.getItem('token');
    const contenedor = document.getElementById('contenedor-posts'); 
    
    if(!contenedor) return;

    pilaDelForo.limpiar();
    contenedor.innerHTML = '<div class="ui active centered inline loader" style="margin-top:20px;"></div>';

    try {
        const res = await fetch('http://localhost:3000/api/foro', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Error al cargar posts');
        
        const posts = await res.json();
        contenedor.innerHTML = ''; 

        if (posts.length === 0) {
            contenedor.innerHTML = `
                <div class="ui placeholder segment center aligned" style="margin-top: 20px;">
                    <div class="ui icon header">
                        <i class="comments outline icon"></i>
                        El foro está tranquilo
                    </div>
                    <p>Sé el primero en iniciar una conversación.</p>
                </div>
            `;
            return;
        }

        // Llenar Pila
        posts.forEach(post => pilaDelForo.push(post));

        // Renderizar LIFO
        while (!pilaDelForo.isEmpty()) {
            const post = pilaDelForo.pop();
            const html = crearHTMLPost(post);
            contenedor.insertAdjacentHTML('beforeend', html);
        }

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<div class="ui error message">No se pudieron cargar las publicaciones.</div>';
    }
}

function crearHTMLPost(post) {
    const fecha = new Date(post.fecha_creacion).toLocaleDateString();
    const avatar = post.usuario.foto_perfil_url || '../Images/default.jpg';
    
    // Si dioLike es true -> clase 'red', si no -> vacía
    // NOTA: El backend debe devolver 'dioLike' (camelCase) según tu index.js
    const claseLike = post.dioLike ? 'red' : ''; 
    const nombre = `${post.usuario.primer_nombre} ${post.usuario.primer_apellido || ''}`.trim();

    return `
    <div class="column" style="margin-bottom: 20px;">
        <div class="ui fluid card">
            <div class="content">
                <div class="right floated meta">${fecha}</div>
                <img class="ui avatar image" src="${avatar}"> ${nombre}
            </div>
            <div class="content">
                <div class="header">${post.titulo}</div>
                <div class="description">
                    <p>${post.contenido}</p>
                </div>
            </div>
            <div class="extra content">
                <span class="left floated like-btn" onclick="toggleLike(${post.id}, this)" style="cursor: pointer; user-select: none;">
                    <i class="${claseLike} like icon"></i>
                    <span class="count">${post.cantidad_likes}</span> Likes
                </span>
            </div>
        </div>
    </div>
    `;
}

async function toggleLike(idPost, elementoHtml) {
    const token = localStorage.getItem('token');
    const icono = elementoHtml.querySelector('i');
    const contador = elementoHtml.querySelector('.count');

    // 1. Deshabilitar clics temporalmente para evitar spam
    elementoHtml.style.pointerEvents = 'none';

    try {
        const res = await fetch(`http://localhost:3000/api/foro/${idPost}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if(res.ok) {
            const data = await res.json();
            
            // 2. Usar siempre el valor del servidor
            // Esto evita números negativos o desincronizados
            contador.innerText = data.totalLikes;
            
            // Actualizar icono según el estado real
            if (data.dioLike) {
                icono.classList.add('red');
            } else {
                icono.classList.remove('red');
            }
        }
    } catch (error) {
        console.error('Error al dar like:', error);
    } finally {
        // 3. Reactivar el botón
        elementoHtml.style.pointerEvents = 'auto';
    }
}

async function publicarPost() {
    const token = localStorage.getItem('token');
    const titulo = document.querySelector('input[name="Tema"]').value.trim();
    
    // Busca input o textarea
    let contenido = document.querySelector('input[name="Descripción"]')?.value || document.querySelector('textarea[name="Descripción"]')?.value;
    contenido = contenido ? contenido.trim() : '';

    if(!titulo || !contenido) {
        $('#alertFail').fadeIn().delay(2000).fadeOut();
        return;
    }

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
            $('#modalAgregar').modal('hide');
            // Limpiar campos
            document.querySelector('input[name="Tema"]').value = '';
            if(document.querySelector('input[name="Descripción"]')) document.querySelector('input[name="Descripción"]').value = '';
            if(document.querySelector('textarea[name="Descripción"]')) document.querySelector('textarea[name="Descripción"]').value = '';
            
            $('#alertSuccess').fadeIn().delay(2000).fadeOut();
            cargarPosts(); 
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo publicar el mensaje.'
            });
        }
    } catch (error) {
        console.error(error);
    }
}

// --- CONFIGURACIÓN VISUAL ---

function initSidebar() {
    $('.ui.sidebar').sidebar({ context: $('.pusher'), transition: 'overlay' });
    $('#sidebar-toggle, .sidebar-toggle-btn').click(function() {
        $('.ui.sidebar').sidebar('toggle');
    });
}

function configurarModal() {
    $('#agregarBtn').on('click', function() {
        $('#modalAgregar').modal('show');
    });

    // Lógica del botón "Publicar" del modal
    $('#publicar').on('click', function() {
        publicarPost();
    });
}

function subirInicio() {
    // Esto intenta subir tanto el body como el contenedor de Semantic UI
    $('html, body, .pusher').animate({ scrollTop: 0 }, 'slow');
}