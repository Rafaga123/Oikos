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

  // Botón regresar (ejemplo: volver al perfil)
  const btnBack = document.getElementById('btnBack');
  if (btnBack) {
    btnBack.addEventListener('click', function() {
      window.location.href = '../Pages/profile.html';
    });
  }

  // Envío simulado porque no hay backend
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

  // Alerta temporal usando div #alertSuccess
  function mostrarAlertaTemporal(tipo, mensaje) {
    const alertEl = document.getElementById('alertSuccess');
    if (!alertEl) return;
    alertEl.className = 'alert ' + (tipo === 'success' ? 'success' : tipo === 'danger' ? 'danger' : 'info');
    alertEl.innerHTML = `<span class="closebtn" onclick="this.parentElement.style.display='none'">&times;</span>
      <strong>${tipo.charAt(0).toUpperCase() + tipo.slice(1)}:</strong> ${mensaje}`;
    alertEl.style.display = 'block';

    // fuerza reflow para asegurar transición en algunos navegadores
    void alertEl.offsetWidth;
    alertEl.style.opacity = '1';
    setTimeout(() => {
      alertEl.style.opacity = '0';
      setTimeout(() => alertEl.style.display = 'none', 450);
    }, 3000);
  }


  // Alerta temporal usando div #alertSuccess
function mostrarAlertaTemporal(tipo, mensaje) {
  const alertEl = document.getElementById('alertSuccess');
  if (!alertEl) return;
  
  // Configurar clase según tipo
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
  
  // Mostrar alerta con animación
  alertEl.style.display = 'block';
  alertEl.style.opacity = '0';
  
  // Forzar reflow para asegurar transición
  void alertEl.offsetWidth;
  
  // Animar entrada
  alertEl.style.opacity = '1';
  
  // Ocultar automáticamente después de 4 segundos
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
    const copyNotification = $('#copyNotification');
    const copyMessage = $('#copyMessage');
    
    // Abrir modal al hacer clic en el botón flotante
    floatingBtn.click(function(e) {
        e.preventDefault();
        pmModal.addClass('active');
        // Prevenir scroll del body cuando el modal está abierto
        $('body').css('overflow', 'hidden');
    });
    
    // Cerrar modal
    pmCloseBtn.click(function() {
        pmModal.removeClass('active');
        $('body').css('overflow', 'auto');
    });
    
    // Cerrar modal al hacer clic fuera del contenido
    pmModal.click(function(e) {
        if (e.target === this) {
            pmModal.removeClass('active');
            $('body').css('overflow', 'auto');
        }
    });
    
    // Cerrar modal con la tecla ESC
    $(document).keydown(function(e) {
        if (e.key === 'Escape' && pmModal.hasClass('active')) {
            pmModal.removeClass('active');
            $('body').css('overflow', 'auto');
        }
    });
    
    // Función para copiar texto al portapapeles
    function copyToClipboard(text) {
        // Crear un elemento textarea temporal
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        
        // Seleccionar y copiar
        textarea.select();
        textarea.setSelectionRange(0, 99999); // Para dispositivos móviles
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showCopyNotification('Número copiado al portapapeles');
            } else {
                showCopyNotification('No se pudo copiar, intenta manualmente', 'error');
            }
        } catch (err) {
            console.error('Error al copiar: ', err);
            showCopyNotification('Error al copiar', 'error');
        }
        
        // Limpiar
        document.body.removeChild(textarea);
    }
    
    // Mostrar notificación de copiado
    function showCopyNotification(message, type = 'success') {
        copyMessage.text(message);
        
        // Cambiar color según el tipo
        if (type === 'error') {
            copyNotification.css('background-color', '#db2828');
        } else {
            copyNotification.css('background-color', '#21ba45');
        }
        
        copyNotification.addClass('show');
        
        // Ocultar después de 3 segundos
        setTimeout(function() {
            copyNotification.removeClass('show');
        }, 3000);
    }
    
    // Manejar clics en botones de copiar
    $(document).on('click', '.copy-btn', function() {
        const textToCopy = $(this).data('copy');
        const button = $(this);
        
        // Copiar al portapapeles
        copyToClipboard(textToCopy);
        
        // Cambiar texto del botón temporalmente
        const originalText = button.html();
        button.html('<i class="check icon"></i> ¡Copiado!');
        button.addClass('copied');
        
        // Restaurar después de 2 segundos
        setTimeout(function() {
            button.html(originalText);
            button.removeClass('copied');
        }, 2000);
    });
    
    // Animación sutil del botón flotante
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
    
    // También animar cuando el mouse entra/sale
    floatingBtn.hover(
        function() {
            // Cancelar animación automática al hover
            floatingBtn.stop();
        },
        function() {
            // Continuar animación después de 1 segundo
            setTimeout(animateFloatingButton, 1000);
        }
    );
    
    // Hacer que el botón flotante sea más visible cuando se selecciona pago móvil
    const pmButtons = $('.pm-btn');
    
    pmButtons.click(function() {
        const method = $(this).data('method');
        
        if (method === 'mobile') {
            // Hacer el botón más visible cuando se selecciona pago móvil
            floatingBtn.css({
                'background-color': '#2185d0',
                'box-shadow': '0 4px 15px rgba(33, 133, 208, 0.4)'
            });
            
            // Mostrar un tooltip temporal
            const originalTitle = floatingBtn.attr('title');
            floatingBtn.attr('title', '¡Haz clic para ver los datos de Pago Móvil!');
            
            // Restaurar después de 3 segundos
            setTimeout(function() {
                floatingBtn.attr('title', originalTitle);
            }, 3000);
        }
    });
    
    console.log('Botón flotante de Pago Móvil cargado correctamente');
});

});