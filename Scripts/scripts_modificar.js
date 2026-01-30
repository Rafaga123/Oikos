let reglas = [];
let editingRuleId = null;
let currentCategoryFilter = 'all';
let ruleToDelete = null;

$(document).ready(function() {
    $('.ui.dropdown').dropdown();
    $('#confirm-modal').modal();
    
    // Cargar desde API
    loadRules();
    
    // Eventos
    $('#add-rule-btn, #first-rule-btn').click(showRuleEditor);
    $('#cancel-edit-btn').click(() => { hideRuleEditor(); resetForm(); });
    $('#rule-form').submit((e) => { e.preventDefault(); saveRule(); });
    $('#confirm-delete-btn').click(confirmDeleteAction);

    $('.category-filter-btn').click(function() {
        $('.category-filter-btn').removeClass('active');
        $(this).addClass('active');
        currentCategoryFilter = $(this).data('category');
        renderRules(); // Renderizar localmente lo que ya bajamos
    });
});

async function loadRules() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:3000/api/reglas', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) {
            reglas = await res.json();
            renderRules();
        }
    } catch (error) {
        console.error(error);
        showAlert('Error al cargar reglas', 'error');
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
            <div class="rule-item" style="border-left: 4px solid ${catInfo.color}">
                <div class="rule-header">
                    <div style="display: flex; align-items: center;">
                        <div class="rule-number" style="background:${catInfo.bg}; color:${catInfo.color}">${index + 1}</div>
                        <div class="rule-title">${regla.titulo}</div>
                    </div>
                </div>
                <div class="rule-category" style="background:${catInfo.bg}; color:${catInfo.color}">${catInfo.name}</div>
                <div class="rule-content">${regla.contenido}</div>
                <div class="rule-actions">
                    <button class="ui primary basic tiny button edit-rule-btn" data-id="${regla.id}"><i class="edit icon"></i> Editar</button>
                    <button class="ui red basic tiny button delete-rule-btn" data-id="${regla.id}"><i class="trash icon"></i> Eliminar</button>
                </div>
            </div>
        `;
        rulesList.append(html);
    });

    // Reasignar eventos a los nuevos botones
    $('.edit-rule-btn').click(function() { editRule($(this).data('id')); });
    $('.delete-rule-btn').click(function() { 
        ruleToDelete = $(this).data('id'); 
        $('#confirm-modal').modal('show');
    });
}

async function saveRule() {
    const titulo = $('#rule-title').val().trim();
    const categoria = $('#rule-category').val();
    const contenido = $('#rule-content').val().trim();
    const token = localStorage.getItem('token');

    if (!titulo || !categoria || !contenido) return showAlert('Completa todos los campos', 'error');

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
            loadRules(); // Recargar todo
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

// Utilidades UI
function showRuleEditor() {
    $('#rule-editor').slideDown();
    $('html, body').animate({ scrollTop: $('#rule-editor').offset().top - 100 }, 500);
}
function hideRuleEditor() { $('#rule-editor').slideUp(); }
function resetForm() {
    $('#rule-form')[0].reset();
    $('#rule-id').val('');
    $('#editor-title').text('Nueva Regla');
    editingRuleId = null;
    $('.ui.dropdown').dropdown('clear');
}
function editRule(id) {
    const regla = reglas.find(r => r.id === id);
    if(regla) {
        editingRuleId = id;
        $('#rule-title').val(regla.titulo);
        $('#rule-content').val(regla.contenido);
        $('#rule-category').dropdown('set selected', regla.categoria);
        $('#editor-title').text('Editar Regla');
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
    return `<div class="empty-state"><i class="law icon"></i><h3>No hay reglas</h3></div>`;
}
function showAlert(msg, type) {
    Swal.fire({
        icon: type,
        title: type === 'success' ? 'Éxito' : 'Error',
        text: msg,
        timer: 2000,
        showConfirmButton: false
    });
}