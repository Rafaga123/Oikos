// Scripts/Estructuras/Cola.js

class Cola {
    constructor() {
        this.items = [];
    }

    enqueue(element) {
        this.items.push(element);
    }

    dequeue() {
        if (this.isEmpty()) return null;
        return this.items.shift(); // Saca el primero (FIFO)
    }

    front() {
        if (this.isEmpty()) return null;
        return this.items[0];
    }

    isEmpty() {
        return this.items.length === 0;
    }

    size() {
        return this.items.length;
    }
    
    print() {
        console.log(this.items);
    }
}

class ColaDePublicacion {
    constructor() {
        this.items = [];
    }
    encolar(elemento) { this.items.push(elemento); }
    desencolar() { return this.items.shift(); }
    estaVacia() { return this.items.length === 0; }
}

// Instancia global
const colaPublicaciones = new ColaDePublicacion();
let procesando = false;

$(document).ready(function() {
    // Inicializar Semantic UI
    $('.ui.dropdown').dropdown();
    $('.ui.checkbox').checkbox();
    $('#sidebar-toggle').click(() => $('.ui.sidebar').sidebar('toggle'));

    // --- LÓGICA VISUAL (Tabs y Preview) ---
    let selectedType = null;
    
    $('.type-card').click(function() {
        $('.type-card').removeClass('selected');
        $(this).addClass('selected');
        selectedType = $(this).data('type');
        $('.creation-form').removeClass('active');
        $(`#${selectedType}-form`).addClass('active');
        updatePreview();
    });

    // --- MANEJO DE OPCIONES DE ENCUESTA ---
    let optionCount = 2;
    $('#add-option').click(() => {
        optionCount++;
        $('#survey-options').append(`
            <div class="option-item">
                <input type="text" placeholder="Opción ${optionCount}" class="survey-option" required>
                <button type="button" class="ui icon button remove-option"><i class="minus icon"></i></button>
            </div>
        `);
        updatePreview();
    });
    
    $(document).on('click', '.remove-option', function() {
        if ($('.option-item').length > 2) {
            $(this).closest('.option-item').remove();
            updatePreview();
        }
    });

    // --- LÓGICA DE LA COLA ---

    // 1. Encolar Anuncio
    $('#announcementForm').submit(function(e) {
        e.preventDefault();
        const data = {
            tipo: 'anuncio', // Flag para saber a qué endpoint ir
            titulo: $('#announcement-title').val(),
            categoria: $('#announcement-category').val(),
            contenido: $('#announcement-content').val(),
            fecha_expiracion: $('#announcement-expiry').val(),
            prioridad: $('#announcement-priority').parent().checkbox('is checked')
        };
        
        colaPublicaciones.encolar(data);
        mostrarNotificacionEncolado('Anuncio');
        procesarCola(); // Intentar procesar
    });

    // 2. Encolar Encuesta
    $('#surveyForm').submit(function(e) {
        e.preventDefault();
        const opciones = [];
        $('.survey-option').each(function() {
            if($(this).val()) opciones.push($(this).val());
        });

        if (opciones.length < 2) return alert('Mínimo 2 opciones');

        const data = {
            tipo: 'encuesta', // Flag
            titulo: $('#survey-title').val(),
            descripcion: $('#survey-description').val(),
            fecha_fin: $('#survey-end-date').val(),
            tipo_voto: $('input[name="vote-type"]:checked').val(),
            opciones: opciones
        };
        
        if (!data.fecha_fin) {
            Swal.fire({
                    icon: 'warning',
                    title: '¡Error!',
                    text: `Por favor selecciona una fecha de cierre.`,
                    timer: 2000
                });
        return;
        }

        colaPublicaciones.encolar(data);
        mostrarNotificacionEncolado('Encuesta');
        procesarCola(); // Intentar procesar
    });

    // 3. Procesador de la Cola (Recursivo o Iterativo)
    async function procesarCola() {
        if (procesando || colaPublicaciones.estaVacia()) return;

        procesando = true;
        const item = colaPublicaciones.desencolar(); // Sacar el primero (FIFO)

        try {
            const token = localStorage.getItem('token');
            let url = '';
            
            // Decidir endpoint según el tipo guardado en el objeto
            if (item.tipo === 'anuncio') url = 'http://localhost:3000/api/gestor/anuncios';
            else url = 'http://localhost:3000/api/gestor/encuestas';

            const res = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(item)
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Publicado!',
                    text: `El ${item.tipo} se procesó correctamente desde la cola.`,
                    timer: 2000
                });
                // Limpiar formularios
                $('form').trigger('reset');
            } else {
                throw new Error('Error en servidor');
            }

        } catch (error) {
            console.error(error);
            Swal.fire('Error', `Falló al procesar ${item.tipo}`, 'error');
        } finally {
            procesando = false;
            // Si quedaron cosas en la cola, seguir procesando
            if (!colaPublicaciones.estaVacia()) {
                setTimeout(procesarCola, 500); // Pequeño delay para no saturar
            }
        }
    }

    function mostrarNotificacionEncolado(tipo) {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
        Toast.fire({
            icon: 'info',
            title: `${tipo} agregado a la cola de procesamiento...`
        });
    }

    // --- VISTA PREVIA ---
    $('#announcementForm input, #announcementForm textarea, #announcementForm select').on('input change', updatePreview);
    $('#surveyForm input, #surveyForm textarea').on('input change', updatePreview);
    $('#preview-announcement, #preview-survey').click(updatePreview);

    function updatePreview() {
        const preview = $('#preview-content');
        if (!selectedType) return preview.html('<p class="text-muted">Selecciona un tipo...</p>');
        
        if (selectedType === 'announcement') {
            const title = $('#announcement-title').val() || '[Título]';
            const content = $('#announcement-content').val() || '...';
            const cat = $('#announcement-category').val() || 'General';
            preview.html(`
                <div class="ui segment">
                    <div class="ui blue ribbon label">${cat}</div>
                    <h3>${title}</h3>
                    <p>${content}</p>
                </div>
            `);
        } else {
            const title = $('#survey-title').val() || '[Pregunta]';
            preview.html(`
                <div class="ui segment">
                    <div class="ui orange ribbon label">Encuesta</div>
                    <h3>${title}</h3>
                    <div class="ui form"><div class="grouped fields"><label>Opciones...</label></div></div>
                </div>
            `);
        }
    }
});