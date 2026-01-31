let horarios = [];
let currentHorarioId = null;

$(document).ready(function() {
    // Inicialización de Semantic UI
    $('.ui.dropdown').dropdown();
    $('.ui.checkbox').checkbox();
    $('#sidebar-toggle').click(() => $('.ui.sidebar').sidebar('toggle'));

    // Cargar Datos Iniciales
    cargarHorarios();

    // --- EVENTOS PRINCIPALES ---
    
    // Abrir modal nuevo
    $('#nuevo-horario-btn, #nuevo-horario-empty').click(nuevoHorario);
    
    // Guardar (Crear/Editar)
    $('.submit-horario').click(guardarHorario);
    
    // Notificación simulada
    $('#publicar-horarios-btn').click(() => Swal.fire('Publicado', 'Se ha notificado a los residentes.', 'success'));
    
    // Agregar campo de restricción visual
    $('#agregar-restriccion').click(() => {
        $('#restricciones-list').append(`
            <div class="field restriction-item" style="display:flex; gap:5px; margin-bottom:5px;">
                <input type="text" class="restriccion-input" placeholder="Ej: Uso obligatorio de ducha">
                <button type="button" class="ui icon button red mini remove-restriccion">
                    <i class="times icon"></i>
                </button>
            </div>
        `);
    });
    
    // Eliminar restricción visual
    $(document).on('click', '.remove-restriccion', function() { 
        $(this).closest('.restriction-item').remove(); 
    });

    // Agregar excepción
    $('#btn-add-excepcion').click(agregarExcepcion);
});

// ==========================================
//  LÓGICA DE DATOS (CRUD)
// ==========================================

async function cargarHorarios() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:3000/api/horarios', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            horarios = await res.json();
            renderizarTodo();
        } else {
            console.error("Error al obtener horarios");
            // Si falla (ej: 401), redirigir a login
            if(res.status === 401) window.location.href = 'login.html';
        }
    } catch (e) { 
        console.error(e);
        $('#dashboard-container').html('<div class="ui error message">Error de conexión con el servidor.</div>');
    }
}

function renderizarTodo() {
    const tbody = $('#horarios-body');
    const dashboard = $('#dashboard-container');
    
    tbody.empty();
    dashboard.empty();

    if (horarios.length === 0) {
        $('#empty-state').show();
        $('.horarios-table-container').hide();
        // Dashboard vacío también
        dashboard.html('<div class="ui message info">No tienes horarios creados aún.</div>');
        return;
    }

    $('#empty-state').hide();
    $('.horarios-table-container').show();

    // Configuración visual por área
    const areaConfig = {
        'piscina': { icon: 'swimming pool', color: 'blue' },
        'gimnasio': { icon: 'dumbbell', color: 'orange' },
        'salon': { icon: 'birthday cake', color: 'purple' },
        'parque': { icon: 'child', color: 'green' },
        'bbq': { icon: 'fire', color: 'red' },
        'estacionamiento': { icon: 'car', color: 'grey' },
        'otro': { icon: 'clock', color: 'teal' }
    };

    horarios.forEach(h => {
        const config = areaConfig[h.area] || areaConfig['otro'];
        const diasStr = h.dias && h.dias.length > 0 
            ? h.dias.map(d => d.slice(0,3).toUpperCase()).join(', ') 
            : 'Sin días';

        // 1. RENDERIZAR FILA DE TABLA
        tbody.append(`
            <tr>
                <td>
                    <h4 class="ui image header">
                        <i class="${config.icon} icon ${config.color}" style="font-size:1.2em; margin-right:10px;"></i>
                        <div class="content">
                            ${h.nombre}
                            <div class="sub header">${h.area.toUpperCase()}</div>
                        </div>
                    </h4>
                </td>
                <td>${h.tipo}</td>
                <td>${diasStr}</td>
                <td>${h.hora_inicio} - ${h.hora_fin}</td>
                <td><div class="ui label ${h.estado === 'activo' ? 'green' : 'grey'} small">${h.estado}</div></td>
                <td>${h.capacidad ? h.capacidad : '-'}</td>
                <td>
                    <div class="ui icon buttons small">
                        <button class="ui button" onclick="editarHorario(${h.id})" title="Editar"><i class="edit icon"></i></button>
                        <button class="ui button" onclick="verExcepciones(${h.id})" title="Excepciones"><i class="calendar times icon"></i></button>
                        <button class="ui button red" onclick="eliminarHorario(${h.id})" title="Eliminar"><i class="trash icon"></i></button>
                    </div>
                </td>
            </tr>
        `);

        // 2. RENDERIZAR TARJETA DE DASHBOARD (Solo si está activo para no saturar)
        if (h.estado === 'activo') {
            const cardHtml = `
                <div class="area-card" style="border-top: 4px solid var(--${config.color}, #777); background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 15px; width: 100%;">
                    <div class="area-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="margin:0; color:#333;">
                            <i class="${config.icon} icon ${config.color}"></i> ${h.nombre}
                        </h3>
                        <div class="ui label green mini">ACTIVO</div>
                    </div>
                    <div class="ui list">
                        <div class="item"><i class="calendar outline icon"></i> ${diasStr}</div>
                        <div class="item"><i class="clock outline icon"></i> ${h.hora_inicio} - ${h.hora_fin}</div>
                        ${h.capacidad ? `<div class="item"><i class="users icon"></i> Capacidad: ${h.capacidad}</div>` : ''}
                    </div>
                </div>
            `;
            dashboard.append(cardHtml);
        }
    });
}

function nuevoHorario() {
    $('#form-horario')[0].reset();
    $('#horario-id').val('');
    $('#restricciones-list').empty();
    $('.ui.dropdown').dropdown('clear');
    $('#modal-horario-header').text('Nuevo Horario');
    $('#horario-modal').modal('show');
}

function editarHorario(id) {
    const h = horarios.find(x => x.id === id);
    if (!h) return;

    $('#modal-horario-header').text('Editar Horario');
    $('#horario-id').val(h.id);
    $('#area').dropdown('set selected', h.area);
    $('#tipo').dropdown('set selected', h.tipo);
    $('#nombre').val(h.nombre);
    $('#hora-inicio').val(h.hora_inicio);
    $('#hora-fin').val(h.hora_fin);
    $('#estado').dropdown('set selected', h.estado);
    $('#capacidad').val(h.capacidad);
    $('#descripcion').val(h.descripcion);

    // Marcar checkboxes de días
    $('input[name="dias"]').prop('checked', false);
    if(h.dias) {
        h.dias.forEach(d => $(`input[value="${d}"]`).prop('checked', true));
    }

    // Llenar restricciones
    $('#restricciones-list').empty();
    if(h.restricciones) {
        h.restricciones.forEach(r => {
            $('#restricciones-list').append(`
                <div class="field restriction-item" style="display:flex; gap:5px; margin-bottom:5px;">
                    <input type="text" class="restriccion-input" value="${r}">
                    <button type="button" class="ui icon button red mini remove-restriccion"><i class="times icon"></i></button>
                </div>
            `);
        });
    }

    $('#horario-modal').modal('show');
}

async function guardarHorario() {
    // Recopilar datos
    const dias = [];
    $('input[name="dias"]:checked').each(function() { dias.push($(this).val()); });
    
    const restricciones = [];
    $('.restriccion-input').each(function() { 
        if($(this).val()) restricciones.push($(this).val()); 
    });

    const payload = {
        id: $('#horario-id').val(),
        area: $('#area').val(),
        tipo: $('#tipo').val(),
        nombre: $('#nombre').val(),
        horaInicio: $('#hora-inicio').val(),
        horaFin: $('#hora-fin').val(),
        estado: $('#estado').val(),
        capacidad: $('#capacidad').val(),
        descripcion: $('#descripcion').val(),
        dias: dias,
        restricciones: restricciones
    };

    // Validaciones básicas
    if(!payload.area || !payload.nombre || !payload.horaInicio || !payload.horaFin || dias.length === 0) {
        return Swal.fire('Faltan datos', 'Completa los campos obligatorios y selecciona al menos un día.', 'warning');
    }

    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:3000/api/gestor/horarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            Swal.fire('Guardado', 'El horario ha sido registrado correctamente', 'success');
            $('#horario-modal').modal('hide');
            cargarHorarios();
        } else {
            const err = await res.json();
            Swal.fire('Error', err.error || 'No se pudo guardar', 'error');
        }
    } catch(e) { console.error(e); }
}

async function eliminarHorario(id) {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:3000/api/gestor/horarios/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        cargarHorarios();
        Swal.fire('Eliminado', 'El horario ha sido eliminado.', 'success');
    }
}

// ==========================================
//  LÓGICA DE EXCEPCIONES
// ==========================================

function verExcepciones(id) {
    currentHorarioId = id;
    const h = horarios.find(x => x.id === id);
    const lista = $('#lista-excepciones');
    lista.empty();

    // h.excepciones viene del backend (include: { excepciones: true })
    if(h.excepciones && h.excepciones.length > 0) {
        h.excepciones.forEach(ex => {
            const fecha = new Date(ex.fecha).toLocaleDateString();
            lista.append(`
                <div class="ui segment" style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>${fecha}</strong> - <span class="ui label mini">${ex.tipo}</span>
                    </div>
                    <button class="ui tiny icon button red" onclick="borrarExcepcion(${ex.id})"><i class="trash icon"></i></button>
                </div>
            `);
        });
    } else {
        lista.html('<p style="color:grey; text-align:center;">No hay excepciones registradas</p>');
    }
    $('#excepciones-modal').modal('show');
}

async function agregarExcepcion() {
    const payload = {
        horarioId: currentHorarioId,
        fecha: $('#excepcion-fecha').val(),
        tipo: $('#excepcion-tipo').val()
    };
    if(!payload.fecha) return Swal.fire('Error', 'Selecciona una fecha', 'warning');

    const token = localStorage.getItem('token');
    await fetch('http://localhost:3000/api/gestor/horarios/excepcion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
    
    cargarHorarios(); // Recargar todo para actualizar el objeto local
    $('#excepciones-modal').modal('hide');
    Swal.fire('Agregado', 'Excepción registrada', 'success');
}

async function borrarExcepcion(id) {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:3000/api/gestor/excepciones/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
    });
    cargarHorarios();
    $('#excepciones-modal').modal('hide');
    Swal.fire('Eliminado', 'Excepción borrada', 'success');
}