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
});