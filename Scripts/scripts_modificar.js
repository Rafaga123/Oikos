let reglas = [];
let editingRuleId = null;
let currentCategoryFilter = 'all';
let ruleToDelete = null;

$(document).ready(function() {
    // Inicialización UI
    $('.ui.dropdown').dropdown();
    $('.ui.sidebar').sidebar({ context: $('.pusher'), transition: 'overlay' });
    $('#sidebar-toggle').click(() => $('.ui.sidebar').sidebar('toggle'));
    $('#confirm-modal').modal();
    
    // Cargar Datos
    loadRules();
    
    // Eventos
    $('#add-rule-btn, #first-rule-btn').click(showRuleEditor);
    $('#cancel-edit-btn').click(() => { hideRuleEditor(); resetForm(); });
    $('#rule-form').submit((e) => { e.preventDefault(); saveRule(); });
    $('#confirm-delete-btn').click(confirmDeleteAction);
    
    // Cancelar modal
    $('.ui.button.cancel').click(() => $('#confirm-modal').modal('hide'));

    // Filtros
    $('.category-filter-btn').click(function() {
        $('.category-filter-btn').removeClass('active');
        $(this).addClass('active');
        currentCategoryFilter = $(this).data('category');
        renderRules();
    });
});

// --- LÓGICA DE DATOS ---

async function loadRules() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:3000/api/reglas', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if(res.ok) {
            reglas = await res.json();
            renderRules();
        } else {
            console.error('Error API');
            $('#rules-list').html('<div class="ui error message">No se pudieron cargar las reglas.</div>');
        }
    } catch (error) {
        console.error(error);
        $('#rules-list').html('<div class="ui error message">Error de conexión.</div>');
    }
}

function renderRules() {
    const rulesList = $('#rules-list');
    const countLabel = $('#rules-count');
    rulesList.empty();
    
    let filteredRules = reglas;
    if (currentCategoryFilter !== 'all') {
        filteredRules = reglas.filter(r => r.categoria === currentCategoryFilter);
    }
    
    countLabel.text(`${filteredRules.length} regla${filteredRules.length !== 1 ? 's' : ''}`);
    
    if (filteredRules.length === 0) {
        rulesList.html(getEmptyStateHTML());
        if(currentCategoryFilter === 'all') $('#first-rule-btn').click(showRuleEditor);
        return;
    }
    
    filteredRules.forEach((regla, index) => {
        const catInfo = getCategoryInfo(regla.categoria);
        const html = `
            <div class="ui segment rule-item" style="border-left: 5px solid ${catInfo.color}">
                <div class="content">
                    <h3 class="ui header" style="margin-bottom: 5px;">
                        <div class="ui circular label" style="background:${catInfo.bg}; color:${catInfo.color}; margin-right:10px;">${index + 1}</div>
                        ${regla.titulo}
                    </h3>
                    
                    <div class="ui label tiny" style="background:${catInfo.bg}; color:${catInfo.color}; margin-bottom:10px;">
                        ${catInfo.name}
                    </div>
                    
                    <div class="description" style="color:#555; font-size:1.1em; line-height:1.5;">
                        ${regla.contenido}
                    </div>
                    
                    <div class="extra content" style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px; display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:#999; font-size:0.9em;">
                            <i class="calendar alternate outline icon"></i> 
                            ${new Date(regla.ultima_modificacion || regla.fecha_creacion).toLocaleDateString()}
                        </span>
                        
                        <div>
                            <button class="ui primary basic tiny button edit-rule-btn" data-id="${regla.id}">
                                <i class="edit icon"></i> Editar
                            </button>
                            <button class="ui red basic tiny button delete-rule-btn" data-id="${regla.id}">
                                <i class="trash icon"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        rulesList.append(html);
    });

    // Reasignar eventos
    $('.edit-rule-btn').click(function() { editRule($(this).data('id')); });
    $('.delete-rule-btn').click(function() { 
        ruleToDelete = $(this).data('id'); 
        $('#confirm-modal').modal('show');
    });
}

// --- CRUD ---

async function saveRule() {
    const titulo = $('#rule-title').val().trim();
    const categoria = $('#rule-category').val();
    const contenido = $('#rule-content').val().trim();
    const token = localStorage.getItem('token');

    if (!titulo || !categoria || !contenido) return showAlert('Completa todos los campos', 'warning');

    const method = editingRuleId ? 'PUT' : 'POST';
    const url = editingRuleId 
        ? `http://localhost:3000/api/gestor/reglas/${editingRuleId}`
        : 'http://localhost:3000/api/gestor/reglas';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ titulo, categoria, contenido })
        });

        if(res.ok) {
            showAlert(`Regla ${editingRuleId ? 'actualizada' : 'creada'} con éxito`, 'success');
            hideRuleEditor();
            resetForm();
            loadRules(); 
        } else {
            showAlert('Error al guardar', 'error');
        }
    } catch(e) { console.error(e); }
}

async function confirmDeleteAction() {
    if(!ruleToDelete) return;
    const token = localStorage.getItem('token');
    
    try {
        const res = await fetch(`http://localhost:3000/api/gestor/reglas/${ruleToDelete}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if(res.ok) {
            showAlert('Regla eliminada', 'success');
            $('#confirm-modal').modal('hide');
            loadRules();
        }
    } catch(e) { console.error(e); }
}

// --- UTILS ---

function showRuleEditor() {
    $('#rule-editor').slideDown();
    $('html, body').animate({ scrollTop: $('#rule-editor').offset().top - 100 }, 500);
}
function hideRuleEditor() { $('#rule-editor').slideUp(); }

function resetForm() {
    $('#rule-form')[0].reset();
    $('#rule-id').val('');
    $('#editor-title').html('<i class="edit icon"></i> Nueva Regla');
    editingRuleId = null;
    $('#rule-category').dropdown('clear');
}

function editRule(id) {
    const regla = reglas.find(r => r.id === id);
    if(regla) {
        editingRuleId = id;
        $('#rule-title').val(regla.titulo);
        $('#rule-content').val(regla.contenido);
        $('#rule-category').dropdown('set selected', regla.categoria);
        $('#editor-title').html('<i class="edit icon"></i> Editar Regla');
        showRuleEditor();
    }
}

function getCategoryInfo(cat) {
    const map = {
        'convivencia': { name: 'Convivencia', color: '#2e7d32', bg: '#e8f5e9' },
        'areas-comunes': { name: 'Áreas Comunes', color: '#1565c0', bg: '#e3f2fd' },
        'seguridad': { name: 'Seguridad', color: '#ef6c00', bg: '#fff3e0' },
        'administrativo': { name: 'Administrativo', color: '#7b1fa2', bg: '#f3e5f5' },
        'otros': { name: 'Otros', color: '#424242', bg: '#f5f5f5' }
    };
    return map[cat] || map['otros'];
}

function getEmptyStateHTML() {
    return `
        <div class="ui placeholder segment center aligned">
            <div class="ui icon header">
                <i class="file alternate outline icon"></i>
                Sin reglas configuradas
            </div>
            <button class="ui primary button" id="first-rule-btn">
                <i class="plus icon"></i> Crear Primera Regla
            </button>
        </div>
    `;
}

function showAlert(msg, type) {
    Swal.fire({
        icon: type,
        title: type === 'success' ? 'Éxito' : 'Atención',
        text: msg,
        timer: 2000,
        showConfirmButton: false
    });
}