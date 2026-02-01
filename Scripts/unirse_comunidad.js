// Scripts/unirse_comunidad.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('unirse-comunidad-form');
  const errorBox = document.getElementById('error-message');
  const successBox = document.getElementById('success-message');

  if (!form) return;

  const showError = (msg) => {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
  };

  const showSuccess = (msg) => {
    if (!successBox) return;
    successBox.classList.remove('hidden');
    successBox.querySelector('span').textContent = msg;
    if (errorBox) errorBox.style.display = 'none';
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorBox) errorBox.style.display = 'none';

    const cedula = document.getElementById('cedula').value.trim();
    const codigo_unico = document.getElementById('codigo_unico').value.trim();

    if (!cedula || !codigo_unico) {
      return showError('Completa tu cédula y el código de comunidad');
    }

    try {
      const resp = await fetch('/api/comunidades/unirse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, codigo_unico })
      });
      const data = await resp.json();

      if (!resp.ok) {
        return showError(data?.error || 'No se pudo enviar la solicitud');
      }

      showSuccess('Solicitud enviada. Espera la confirmación de la comunidad.');
      form.reset();
    } catch (err) {
      console.error(err);
      showError('Error de conexión con el servidor');
    }
  });
});
