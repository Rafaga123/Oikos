document.addEventListener('DOMContentLoaded', function() {
    // Selección visual de método de pago
    document.querySelectorAll('.pm-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.pm-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Preview banco
    const bancoDestino = document.getElementById('bancoDestino');
    const bankPreviewText = document.querySelector('#bankPreview .bank-text');
    if (bancoDestino && bankPreviewText) {
        bancoDestino.addEventListener('change', function() {
            bankPreviewText.textContent = this.value ? this.options[this.selectedIndex].text : 'Aún no has seleccionado un banco';
        });
    }

    // Nombre del voucher cargado
    const voucherFile = document.getElementById('voucherFile');
    const voucherName = document.getElementById('voucherName');
    if (voucherFile && voucherName) {
        voucherFile.addEventListener('change', function() {
            voucherName.textContent = this.files && this.files.length ? this.files[0].name : '';
        });
    }

    // Botón regresar
    const btnBack = document.getElementById('btnBack');
    if (btnBack) {
        btnBack.addEventListener('click', function() {
            window.location.href = '../Pages/profile.html';
        });
    }

    // Envío simulado
    const btnSubmit = document.getElementById('btnSubmit');
    if (btnSubmit) {
        btnSubmit.addEventListener('click', function() {
            const codigo = (document.getElementById('codigoRef') || {}).value?.trim?.() || '';
            const monto = (document.getElementById('monto') || {}).value || '';
            const fecha = (document.getElementById('fechaPago') || {}).value || '';
            const bancoVal = bancoDestino ? bancoDestino.value : '';

            if (!bancoVal || !codigo || !monto || !fecha) {
                mostrarAlertaTemporal('danger', 'Completa los campos obligatorios antes de enviar');
                return;
            }

            // Simular envío
            btnSubmit.disabled = true;
            const originalText = btnSubmit.textContent;
            btnSubmit.textContent = 'Enviando...';

            setTimeout(() => {
                btnSubmit.disabled = false;
                btnSubmit.textContent = originalText;
                mostrarAlertaTemporal('success', 'Pago reportado correctamente. Gracias.');
            }, 900);
        });
    }

    // Inicializar botones de copia
    setupCopyButtons();

    // Cargar datos dinámicamente
    cargarDatosPagoMovil();
    cargarDatosTransferencias();

    // Inicializar pestañas del modal
    setupModalTabs();
});

// Alerta temporal
function mostrarAlertaTemporal(tipo, mensaje) {
    const alertEl = document.getElementById('alertSuccess');
    if (!alertEl) return;
    
    let clase = '';
    let titulo = '';
    
    switch(tipo) {
        case 'success':
            clase = 'success';
            titulo = 'Éxito';
            break;
        case 'danger':
            clase = 'danger';
            titulo = 'Error';
            break;
        case 'warning':
            clase = 'warning';
            titulo = 'Advertencia';
            break;
        default:
            clase = 'info';
            titulo = 'Información';
    }
    
    alertEl.className = 'alert ' + clase;
    alertEl.innerHTML = `
        <span class="closebtn" onclick="this.parentElement.style.display='none'">&times;</span>
        <strong>${titulo}:</strong> ${mensaje}
    `;
    
    alertEl.style.display = 'block';
    alertEl.style.opacity = '0';
    void alertEl.offsetWidth;
    alertEl.style.opacity = '1';
    
    setTimeout(() => {
        alertEl.style.opacity = '0';
        setTimeout(() => {
            alertEl.style.display = 'none';
        }, 450);
    }, 4000);
}

// Funcionalidad del botón flotante de Pago Móvil
$(document).ready(function() {
    // Elementos del DOM
    const floatingBtn = $('#floatingPmButton');
    const pmModal = $('#pmModal');
    const pmCloseBtn = $('#pmCloseBtn');
    
    // Abrir modal
    floatingBtn.click(function(e) {
        e.preventDefault();
        pmModal.addClass('active');
        $('body').css('overflow', 'hidden');
    });
    
    // Cerrar modal
    pmCloseBtn.click(function() {
        pmModal.removeClass('active');
        $('body').css('overflow', 'auto');
    });
    
    // Cerrar modal al hacer clic fuera
    pmModal.click(function(e) {
        if (e.target === this) {
            pmModal.removeClass('active');
            $('body').css('overflow', 'auto');
        }
    });
    
    // Cerrar modal con ESC
    $(document).keydown(function(e) {
        if (e.key === 'Escape' && pmModal.hasClass('active')) {
            pmModal.removeClass('active');
            $('body').css('overflow', 'auto');
        }
    });
    
    // Animación del botón flotante
    function animateFloatingButton() {
        floatingBtn.animate({
            bottom: '35px'
        }, 800, function() {
            floatingBtn.animate({
                bottom: '30px'
            }, 800);
        });
    }
    
    // Animar cada 4 segundos
    setInterval(animateFloatingButton, 4000);
    
    // Hover effects
    floatingBtn.hover(
        function() {
            floatingBtn.stop();
        },
        function() {
            setTimeout(animateFloatingButton, 1000);
        }
    );
    
    // Resaltar botón cuando se selecciona pago móvil
    $('.pm-btn').click(function() {
        const method = $(this).data('method');
        if (method === 'mobile') {
            floatingBtn.css({
                'background-color': '#2185d0',
                'box-shadow': '0 4px 15px rgba(33, 133, 208, 0.4)'
            });
            
            const originalTitle = floatingBtn.attr('title');
            floatingBtn.attr('title', '¡Haz clic para ver los datos de Pago Móvil!');
            
            setTimeout(function() {
                floatingBtn.attr('title', originalTitle);
            }, 3000);
        }
    });
});

// Función para cambiar entre pestañas
function cambiarTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.payment-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const tabElement = document.getElementById(`tab-${tabId}`);
    const tabButton = document.querySelector(`.payment-tab[data-tab="${tabId}"]`);
    
    if (tabElement) tabElement.classList.add('active');
    if (tabButton) tabButton.classList.add('active');
}

// Configurar pestañas del modal
function setupModalTabs() {
    document.querySelectorAll('.payment-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            cambiarTab(tabId);
        });
    });
}

// Función para cargar datos de Pago Móvil
function cargarDatosPagoMovil() {
    const datosPagomovil = {
        "banesco": {
            telefono: "0414-555-1234",
            cedula: "V-26.789.456",
            banco: "Banesco",
            beneficiario: "OIKOS"
        },
        "bdv": {
            telefono: "0412-987-6543",
            cedula: "V-26.789.456",
            banco: "Banco de Venezuela",
            beneficiario: "OIKOS"
        },
        "provincial": {
            telefono: "0416-789-0123",
            cedula: "V-26.789.456",
            banco: "Banco Provincial",
            beneficiario: "OIKOS"
        }
    };

    Object.keys(datosPagomovil).forEach(banco => {
        const data = datosPagomovil[banco];
        const telElement = document.getElementById(`pm-tel-${banco}`);
        const cedulaElement = document.getElementById(`pm-cedula-${banco}`);
        const bancoElement = document.getElementById(`pm-banco-${banco}`);
        const beneficiarioElement = document.getElementById(`pm-beneficiario-${banco}`);
        
        if (telElement) telElement.textContent = data.telefono;
        if (cedulaElement) cedulaElement.textContent = data.cedula;
        if (bancoElement) bancoElement.textContent = data.banco;
        if (beneficiarioElement) beneficiarioElement.textContent = data.beneficiario;
    });
}

// Función para cargar datos de Transferencias
function cargarDatosTransferencias() {
    const datosTransferencias = {
        "banesco": {
            cuenta: "0134-1234-56-1234567890",
            tipo: "Corriente",
            beneficiario: "OIKOS",
            cedula: "J-12345678-9",
            email: "cuentas@oikos.com"
        },
        "bdv": {
            cuenta: "0102-9876-54-3210987654",
            tipo: "Ahorro",
            beneficiario: "OIKOS",
            cedula: "J-12345678-9",
            email: "cuentas@oikos.com"
        },
        "provincial": {
            cuenta: "0108-5678-12-3456789012",
            tipo: "Corriente",
            beneficiario: "OIKOS",
            cedula: "J-12345678-9",
            email: "cuentas@oikos.com"
        }
    };

    Object.keys(datosTransferencias).forEach(banco => {
        const data = datosTransferencias[banco];
        const cuentaElement = document.getElementById(`transfer-cuenta-${banco}`);
        const tipoElement = document.getElementById(`transfer-tipo-${banco}`);
        const beneficiarioElement = document.getElementById(`transfer-beneficiario-${banco}`);
        const cedulaElement = document.getElementById(`transfer-cedula-${banco}`);
        const emailElement = document.getElementById(`transfer-email-${banco}`);
        
        if (cuentaElement) cuentaElement.textContent = data.cuenta;
        if (tipoElement) tipoElement.textContent = data.tipo;
        if (beneficiarioElement) beneficiarioElement.textContent = data.beneficiario;
        if (cedulaElement) cedulaElement.textContent = data.cedula;
        if (emailElement) emailElement.textContent = data.email;
    });
}

// Función para copiar al portapapeles
function setupCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(button => {
        // Remover event listeners previos para evitar duplicados
        button.replaceWith(button.cloneNode(true));
    });
    
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', function() {
            const textToCopy = this.getAttribute('data-copy');
            
            navigator.clipboard.writeText(textToCopy).then(() => {
                showCopyNotification(this);
            }).catch(err => {
                console.error('Error al copiar: ', err);
                // Fallback para navegadores antiguos
                fallbackCopy(textToCopy, this);
            });
        });
    });
}

// Notificación de copiado mejorada
function showCopyNotification(button) {
    const notification = document.getElementById('copyNotification');
    const message = document.getElementById('copyMessage');
    
    if (!notification || !message) return;
    
    const btnText = button.textContent.toLowerCase();
    let notificationMessage = 'Texto copiado al portapapeles';
    
    if (btnText.includes('teléfono')) {
        notificationMessage = 'Teléfono copiado al portapapeles';
    } else if (btnText.includes('cédula') || btnText.includes('rif')) {
        notificationMessage = 'Cédula/RIF copiado al portapapeles';
    } else if (btnText.includes('cuenta')) {
        notificationMessage = 'Número de cuenta copiado al portapapeles';
    }
    
    message.textContent = notificationMessage;
    notification.style.display = 'block';
    notification.style.opacity = '1';
    
    // Efecto visual en el botón
    const originalHTML = button.innerHTML;
    const originalClass = button.className;
    button.innerHTML = '<i class="check icon"></i> ¡Copiado!';
    button.className = originalClass + ' copied';
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
        
        button.innerHTML = originalHTML;
        button.className = originalClass;
    }, 2000);
}

// Fallback para copiar en navegadores antiguos
function fallbackCopy(text, button) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopyNotification(button);
    } catch (err) {
        console.error('Fallback copy failed:', err);
    }
    
    document.body.removeChild(textArea);
}