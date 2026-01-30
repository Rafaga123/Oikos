let horarios = [];
let excepciones = [];
let currentHorarioId = null;
let restriccionCount = 1;

$(document).ready(function() {
    $('.ui.dropdown').dropdown();
    $('.ui.modal').modal();
    
    // Cargar datos reales
    cargarHorarios();

    // Eventos
    $('#nuevo-horario-btn, #nuevo-horario-empty').click(nuevoHorario);
    $('#publicar-horarios-btn').click(() => Swal.fire('Publicado', 'Los residentes recibirán una notificación.', 'success'));
    $('.submit-horario').click(guardarHorario);
    $('.cancel-horario').click(() => $('#horario-modal').modal('hide'));
    
    // Restricciones
    $('#agregar-restriccion').click(() => {
        $('#restricciones-list').append(`
            <div class="restriccion-item">
                <input type="text" class="restriccion-input" placeholder="Nueva regla...">
                <button type="button" class="ui icon button eliminar-restriccion"><i class="times icon"></i></button>
            </div>
        `);
    });
    $(document).on('click', '.eliminar-restriccion', function() { $(this).closest('.restriccion-item').remove(); });

    // Excepciones
    $('#agregar-excepcion').click(agregarExcepcion);
    
    // Confirmaciones
    $('.confirm-delete').click(() => ejecutarAccion(eliminarHorario));
    $('.confirm-activar').click(() => ejecutarAccion(() => cambiarEstadoHorario('activo')));
    $('.confirm-desactivar').click(() => ejecutarAccion(() => cambiarEstadoHorario('inactivo')));
    $('.cancel-confirm').click(() => $('#confirm-modal').modal('hide'));
});

async function cargarHorarios() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:3000/api/horarios', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) {
            horarios = await res.json();
            renderizarTabla();
            actualizarDashboard(); // Función visual opcional si quieres mantener las tarjetas de arriba
        }
    } catch(e) { console.error(e); }
}

function renderizarTabla() {
    const body = $('#horarios-body');
    body.empty();
    
    if (horarios.length === 0) {
        $('#empty-state').show();
        $('.horarios-table-container').hide();
        return;
    }
    
    $('#empty-state').hide();
    $('.horarios-table-container').show();

    horarios.forEach(h => {
        const row = `
            <tr>
                <td><strong>${h.area.toUpperCase()}</strong><br><small>${h.nombre}</small></td>
                <td>${h.tipo}</td>
                <td>${h.dias.map(d => d.slice(0,3)).join(', ')}</td>
                <td>${h.hora_inicio} - ${h.hora_fin}</td>
                <td><div class="ui label ${h.estado === 'activo' ? 'green' : 'red'}">${h.estado}</div></td>
                <td>${h.capacidad || '-'}</td>
                <td>${new Date(h.ultima_modificacion).toLocaleDateString()}</td>
                <td>
                    <button class="ui tiny icon button" onclick="editarHorario(${h.id})"><i class="edit icon"></i></button>
                    <button class="ui tiny icon button" onclick="confirmarAccion(${h.id}, 'eliminar')"><i class="trash icon"></i></button>
                    <button class="ui tiny icon button" onclick="verExcepciones(${h.id})"><i class="calendar times icon"></i></button>
                    ${h.estado === 'activo' 
                        ? `<button class="ui tiny icon button orange" onclick="confirmarAccion(${h.id}, 'desactivar')"><i class="pause icon"></i></button>`
                        : `<button class="ui tiny icon button green" onclick="confirmarAccion(${h.id}, 'activar')"><i class="play icon"></i></button>`
                    }
                </td>
            </tr>
        `;
        body.append(row);
    });
}

async function guardarHorario() {
    const dias = [];
    $('input[name="dias"]:checked').each(function() { dias.push($(this).val()); });
    
    const restricciones = [];
    $('.restriccion-input').each(function() { if($(this).val()) restricciones.push($(this).val()); });

    const payload = {
        id: $('#horario-id').val(),
        area: $('#area').val(),
        tipo: $('#tipo').val(),
        nombre: $('#nombre').val(),
        horaInicio: $('#hora-inicio').val(),
        horaFin: $('#hora-fin').val(),
        estado: $('#estado').val(),
        capacidad: $('#capacidad').val(),
        grupo: $('#grupo').val(),
        fechaInicio: $('#fecha-inicio').val(),
        fechaFin: $('#fecha-fin').val(),
        descripcion: $('#descripcion').val(),
        dias: dias,
        restricciones: restricciones
    };

    if(!payload.area || !payload.nombre || !payload.horaInicio || !payload.horaFin || dias.length === 0) {
        return Swal.fire('Error', 'Completa los campos obligatorios y selecciona días.', 'warning');
    }

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/api/gestor/horarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if(res.ok) {
            Swal.fire('Guardado', 'Horario actualizado correctamente', 'success');
            $('#horario-modal').modal('hide');
            cargarHorarios();
        } else {
            Swal.fire('Error', 'No se pudo guardar', 'error');
        }
    } catch(e) { console.error(e); }
}

function nuevoHorario() {
    $('#form-horario')[0].reset();
    $('#horario-id').val('');
    $('#restricciones-list').empty();
    $('.ui.dropdown').dropdown('clear');
    $('#horario-modal').modal('show');
}

function editarHorario(id) {
    const h = horarios.find(x => x.id === id);
    if(!h) return;

    $('#horario-id').val(h.id);
    $('#area').dropdown('set selected', h.area);
    $('#tipo').dropdown('set selected', h.tipo);
    $('#nombre').val(h.nombre);
    $('#hora-inicio').val(h.hora_inicio);
    $('#hora-fin').val(h.hora_fin);
    $('#estado').dropdown('set selected', h.estado);
    $('#capacidad').val(h.capacidad);
    $('#grupo').dropdown('set selected', h.grupo);
    $('#descripcion').val(h.descripcion);
    
    // Fechas (Formato YYYY-MM-DD para input date)
    if(h.fecha_inicio) $('#fecha-inicio').val(h.fecha_inicio.split('T')[0]);
    if(h.fecha_fin) $('#fecha-fin').val(h.fecha_fin.split('T')[0]);

    // Días
    $('input[name="dias"]').prop('checked', false);
    h.dias.forEach(d => $(`input[value="${d}"]`).prop('checked', true));

    // Restricciones
    $('#restricciones-list').empty();
    h.restricciones.forEach(r => {
        $('#restricciones-list').append(`
            <div class="restriccion-item">
                <input type="text" class="restriccion-input" value="${r}">
                <button type="button" class="ui icon button eliminar-restriccion"><i class="times icon"></i></button>
            </div>
        `);
    });

    $('#horario-modal').modal('show');
}

// ... (Lógica de confirmaciones y eliminaciones similar a lo que ya tienes, pero usando fetch) ...

let accionPendiente = null;
function confirmarAccion(id, tipo) {
    currentHorarioId = id;
    if(tipo === 'eliminar') {
        $('.confirm-delete').show(); $('.confirm-activar, .confirm-desactivar').hide();
        $('#confirm-message').text('¿Eliminar este horario permanentemente?');
    } else if (tipo === 'activar') {
        $('.confirm-activar').show(); $('.confirm-delete, .confirm-desactivar').hide();
        $('#confirm-message').text('¿Activar este horario?');
    } else {
        $('.confirm-desactivar').show(); $('.confirm-delete, .confirm-activar').hide();
        $('#confirm-message').text('¿Desactivar este horario?');
    }
    $('#confirm-modal').modal('show');
}

async function ejecutarAccion(callback) {
    await callback();
    $('#confirm-modal').modal('hide');
    cargarHorarios();
}

async function eliminarHorario() {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:3000/api/gestor/horarios/${currentHorarioId}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
    });
}

async function cambiarEstadoHorario(estado) {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:3000/api/gestor/horarios/${currentHorarioId}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ estado })
    });
}

// Lógica de Excepciones (Simplificada)
function verExcepciones(id) {
    currentHorarioId = id;
    const h = horarios.find(x => x.id === id);
    $('#lista-excepciones').empty();
    
    // Renderizar excepciones existentes (h.excepciones viene del include del backend)
    if(h.excepciones && h.excepciones.length > 0) {
        h.excepciones.forEach(ex => {
            $('#lista-excepciones').append(`
                <div class="ui segment">
                    <strong>${new Date(ex.fecha).toLocaleDateString()}</strong> - ${ex.tipo}
                    <p>${ex.descripcion}</p>
                    <button class="ui tiny red button" onclick="borrarExcepcion(${ex.id})">Borrar</button>
                </div>
            `);
        });
    } else {
        $('#lista-excepciones').html('<div class="ui info message">No hay excepciones</div>');
    }
    $('#excepciones-modal').modal('show');
}

async function agregarExcepcion() {
    const payload = {
        horarioId: currentHorarioId,
        fecha: $('#excepcion-fecha').val(),
        tipo: $('#excepcion-tipo').val(),
        descripcion: 'Excepción manual' 
    };
    if(!payload.fecha) return;

    const token = localStorage.getItem('token');
    await fetch('http://localhost:3000/api/gestor/horarios/excepcion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
    
    cargarHorarios(); // Recargar para actualizar lista interna
    $('#excepciones-modal').modal('hide');
    Swal.fire('Agregado', 'Excepción guardada', 'success');
}

async function borrarExcepcion(id) {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:3000/api/gestor/excepciones/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
    });
    cargarHorarios();
    $('#excepciones-modal').modal('hide');
}