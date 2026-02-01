// --- ESTRUCTURA DE DATOS: PILA (STACK) ---
class Pila {
    constructor() { this.items = []; }
    push(element) { this.items.push(element); }
    pop() { return this.isEmpty() ? "La pila está vacía" : this.items.pop(); }
    peek() { return this.isEmpty() ? "La pila está vacía" : this.items[this.items.length - 1]; }
    isEmpty() { return this.items.length === 0; }
    size() { return this.items.length; }
    limpiar() { this.items = []; }
}

const pilaDelForo = new Pila();

$(document).ready(function() {
    // Inicializar UI
    $('.ui.dropdown').dropdown();
    $('.ui.sidebar').sidebar({ context: $('.pusher'), transition: 'overlay' });
    $('#sidebar-toggle').click(() => $('.ui.sidebar').sidebar('toggle'));

    // Cargar Posts al iniciar
    cargarPosts();

    // 1. PUBLICAR NUEVO POST
    $('#form-publicar').submit(async function(e) {
        e.preventDefault();
        const titulo = $('#nuevo-titulo').val().trim();
        const contenido = $('#nuevo-contenido').val().trim();
        const token = localStorage.getItem('token');

        if(!titulo || !contenido) return;

        try {
            const res = await fetch('/api/foro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ titulo, contenido })
            });

            if(res.ok) {
                $('#nuevo-titulo').val('');
                $('#nuevo-contenido').val('');
                const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
                Toast.fire({ icon: 'success', title: 'Publicado correctamente' });
                cargarPosts(); 
            }
        } catch(e) { console.error(e); }
    });

    // 2. EVENTO LIKE (Delegación)
    $(document).on('click', '.btn-like', function() {
        const id = $(this).data('id');
        darLike(id, this); 
    });

    // 3. EVENTO ELIMINAR (Delegación)
    $(document).on('click', '.btn-eliminar-admin', function() {
        const id = $(this).data('id');
        confirmarEliminarPost(id);
    });
});

async function cargarPosts() {
    const token = localStorage.getItem('token');
    const contenedor = document.getElementById('contenedor-posts');
    
    pilaDelForo.limpiar();
    contenedor.innerHTML = '<div class="ui active centered inline loader" style="margin-top:20px;"></div>';

    try {
        const res = await fetch('/api/foro', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Error al cargar posts');
        
        const posts = await res.json();
        contenedor.innerHTML = ''; 

        if (posts.length === 0) {
            contenedor.innerHTML = `
                <div class="ui placeholder segment center aligned">
                    <div class="ui icon header"><i class="comments outline icon"></i> Sin actividad</div>
                    <p>No hay publicaciones en el foro.</p>
                </div>
            `;
            return;
        }

        // Llenar Pila
        posts.forEach(post => pilaDelForo.push(post));

        // Renderizar LIFO
        while (!pilaDelForo.isEmpty()) {
            const post = pilaDelForo.pop();
            const html = crearHTMLPostAdmin(post);
            contenedor.insertAdjacentHTML('beforeend', html);
        }

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<div class="ui error message">No se pudieron cargar los posts.</div>';
    }
}

function crearHTMLPostAdmin(post) {
    const fecha = new Date(post.fecha_creacion).toLocaleString('es-ES', { 
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    
    // --- LÓGICA DEL CORAZÓN (ROJO O VACÍO) ---
    // Si dioLike es true, usamos la clase 'red'. Si no, 'outline'.
    const likeClass = post.dioLike ? 'red' : 'outline';
    
    const nombre = post.usuario.primer_nombre || 'Usuario';
    const apellido = post.usuario.primer_apellido || '';
    const nombreCompleto = `${nombre} ${apellido}`.trim(); 

    const autorBadge = post.usuario.rol.nombre === 'ENCARGADO_COMUNIDAD' 
        ? '<a class="ui blue label mini">ADMIN</a>' 
        : '';

    return `
        <div class="ui fluid card post-card" id="post-${post.id}">
            <div class="content">
                <button class="ui right floated icon button mini basic red btn-eliminar-admin" data-id="${post.id}" title="Eliminar publicación">
                    <i class="trash icon"></i>
                </button>

                <div class="header">
                    <img class="ui avatar image" src="${post.usuario.foto_perfil_url || '../Images/default.jpg'}">
                    ${nombreCompleto}
                    ${autorBadge}
                </div>
                <div class="meta">
                    <span class="date">${fecha}</span>
                </div>
                <div class="description">
                    <h4 class="ui header">${post.titulo}</h4>
                    <p>${post.contenido}</p>
                </div>
            </div>
            <div class="extra content">
                <span class="left floated like btn-like" data-id="${post.id}" style="cursor: pointer; user-select: none;">
                    <i class="heart ${likeClass} icon"></i>
                    <span class="likes-count">${post.cantidad_likes || 0}</span> Likes
                </span>
            </div>
        </div>
    `;
}

async function darLike(idPost, elementoBtn) {
    const token = localStorage.getItem('token');
    const countSpan = $(elementoBtn).find('.likes-count');
    const icon = $(elementoBtn).find('i');

    try {
        const res = await fetch(`http://localhost:3000/api/foro/${idPost}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            
            // --- ACTUALIZACIÓN EXACTA DESDE EL SERVIDOR ---
            // 1. Actualizamos el número con lo que dice la base de datos
            countSpan.text(data.totalLikes);
            
            // 2. Actualizamos el color según el estado real
            if (data.dioLike) {
                // Si dio like: poner rojo, quitar outline
                icon.removeClass('outline').addClass('red');
            } else {
                // Si quitó like: poner outline, quitar rojo
                icon.removeClass('red').addClass('outline');
            }
        }
    } catch (error) { 
        console.error(error); 
    }
}

async function confirmarEliminarPost(id) {
    const result = await Swal.fire({
        title: '¿Eliminar publicación?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3000/api/gestor/foro/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if(res.ok) {
                $(`#post-${id}`).transition('fade');
                setTimeout(() => { $(`#post-${id}`).remove(); }, 500);
                const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
                Toast.fire({ icon: 'success', title: 'Eliminado' });
            } else {
                Swal.fire('Error', 'No se pudo eliminar', 'error');
            }
        } catch(e) { console.error(e); }
    }
}