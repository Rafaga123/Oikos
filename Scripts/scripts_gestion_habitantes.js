let habitantes = [];
let editingId = null;

$(document).ready(function() {
    // Inicializar UI
    $('.ui.dropdown').dropdown();
    $('.ui.modal').modal();
    $('#sidebar-toggle').click(() => $('.ui.sidebar').sidebar('toggle'));

    // Cargar Datos
    loadHabitantsFromAPI();

    // Evento Nuevo Habitante
    $('#btn-nuevo-habitante').click(function() {
        editingId = null;
        $('#habitant-form')[0].reset();
        $('#modal-title').text('Nuevo Habitante (Caso Especial)');
        $('#msg-password-default').show(); // Mostrar aviso de contraseña
        $('input[name="cedula"]').prop('disabled', false); // Permitir editar cédula al crear
        $('input[name="correo"]').prop('disabled', false);
        $('#habitant-modal').modal('show');
    });

    // Evento Guardar (Crear o Editar)
    $('#save-habitant').click(async function() {
        if ($('#habitant-form')[0].checkValidity()) {
            
            // Recoger valores del formulario
            const nombre = $('input[name="nombre"]').val();
            const apellido = $('input[name="apellido"]').val();
            const estado = $('select[name="estado"]').val(); // Esto vale 'activo' o 'inactivo'

            // SI ESTAMOS EDITANDO (PUT)
            if (editingId) {
                const data = {
                    nombre: nombre,
                    apellido: apellido,
                    estado_solicitud: estado // Enviamos 'activo' o 'inactivo'
                };

                try {
                    const res = await fetch(`http://localhost:3000/api/gestor/habitante/${editingId}`, {
                        method: 'PUT',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(data)
                    });
                    
                    if(res.ok) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Datos actualizados',
                            timer: 1500,
                            showConfirmButton: false
                        });
                        $('#habitant-modal').modal('hide');
                        loadHabitantsFromAPI(); // Recargar tabla para ver el cambio de color
                    } else {
                        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar' });
                    }
                } catch (e) { console.error(e); }
            } 
            // SI ESTAMOS CREANDO (POST) - Lógica existente...
            else {
                guardarHabitante();
            }

        } else {
            $('.ui.form').addClass('error');
        }
    });

    // Cancelar modal
    $('.ui.button.cancel').click(() => $('#habitant-modal').modal('hide'));

    // Buscador
    $('.ui.search input').on('input', function() {
        const val = $(this).val().toLowerCase();
        const filtrados = habitantes.filter(h => 
            h.nombre.toLowerCase().includes(val) || 
            h.apellido.toLowerCase().includes(val) || 
            h.cedula.includes(val)
        );
        renderTable(filtrados);
    });
});

async function loadHabitantsFromAPI() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/gestor/habitantes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            habitantes = data.map(u => ({
                id: u.id,
                cedula: u.cedula,
                nombre: u.primer_nombre,
                apellido: u.primer_apellido,
                correo: u.email,
                anio: new Date(u.fecha_registro).getFullYear(),
                estado: u.estado_solicitud === 'ACEPTADO' ? 'activo' : 'inactivo',
                rol: u.rol.nombre
            }));
            renderTable(habitantes);
        }
    } catch (e) { console.error(e); }
}

function renderTable(data) {
    const tbody = $('#habitantes-body');
    tbody.empty();

    if (data.length === 0) {
        tbody.html('<tr><td colspan="7" class="center aligned">No hay habitantes registrados</td></tr>');
        return;
    }

    data.forEach(h => {
        const labelClass = h.estado === 'activo' ? 'green' : 'red';
        const esGestor = h.rol === 'ENCARGADO_COMUNIDAD';
        const gestorBadge = esGestor ? '<i class="shield alternate icon blue" title="Gestor"></i>' : '';

        const row = `
            <tr>
                <td>${h.cedula}</td>
                <td>${h.nombre} ${gestorBadge}</td>
                <td>${h.apellido}</td>
                <td>${h.correo}</td>
                <td>${h.anio}</td>
                <td><div class="ui label ${labelClass} mini">${h.estado.toUpperCase()}</div></td>
                <td>
                    <button class="ui icon button mini basic" onclick="editar(${h.id})" title="Editar"><i class="edit icon"></i></button>
                    ${!esGestor ? `<button class="ui icon button mini basic blue" onclick="promover(${h.id})" title="Hacer Gestor"><i class="user shield icon"></i></button>` : ''}
                </td>
            </tr>
        `;
        tbody.append(row);
    });
}

window.editar = function(id) {
    const h = habitantes.find(x => x.id === id);
    if(!h) return;

    editingId = id;
    $('#modal-title').text('Editar Habitante');
    $('#msg-password-default').hide(); // Ocultar aviso de contraseña
    
    // Llenar formulario
    $('input[name="nombre"]').val(h.nombre);
    $('input[name="apellido"]').val(h.apellido);
    $('input[name="cedula"]').val(h.cedula).prop('disabled', true); // No editar cédula
    $('input[name="correo"]').val(h.correo).prop('disabled', true); // No editar correo
    $('select[name="estado"]').dropdown('set selected', h.estado);
    $('select[name="anio_registro"]').dropdown('set selected', h.anio.toString());

    $('#habitant-modal').modal('show');
};

async function guardarHabitante() {
    const form = $('#habitant-form');
    // Validar campos requeridos manualmente si Semantic UI form validation no está activo
    const nombre = $('input[name="nombre"]').val();
    const apellido = $('input[name="apellido"]').val();
    const cedula = $('input[name="cedula"]').val();
    const correo = $('input[name="correo"]').val();
    
    if(!nombre || !apellido || !cedula || !correo) {
        Swal.fire('Faltan datos', 'Todos los campos son obligatorios', 'warning');
        return;
    }

    const payload = {
        nombre, apellido, cedula, correo,
        anio_registro: $('select[name="anio_registro"]').val(),
        estado: $('select[name="estado"]').val()
    };

    const token = localStorage.getItem('token');
    let url = 'http://localhost:3000/api/gestor/habitante'; // POST (Crear)
    let method = 'POST';

    if(editingId) {
        url = `http://localhost:3000/api/gestor/habitante/${editingId}`; // PUT (Editar)
        method = 'PUT';
    }

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            Swal.fire('Guardado', 'Datos actualizados correctamente', 'success');
            $('#habitant-modal').modal('hide');
            loadHabitantsFromAPI();
        } else {
            const err = await res.json();
            Swal.fire('Error', err.error || 'No se pudo guardar', 'error');
        }
    } catch(e) { console.error(e); }
}

window.promover = async function(id) {
    const result = await Swal.fire({
        title: '¿Hacer Gestor?',
        text: "Este usuario tendrá acceso administrativo completo.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, promover'
    });

    if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:3000/api/gestor/promover/${id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadHabitantsFromAPI();
        Swal.fire('Promovido', '', 'success');
    }
};

window.exportarExcel = function() {
    const tabla = document.getElementById("tabla-habitantes");
    const html = tabla.outerHTML;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = "habitantes_oikos.xls";
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
};