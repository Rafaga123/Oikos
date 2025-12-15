// Scripts/crear_comunidad.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('crear-comunidad-form');
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

    const nombre = document.getElementById('nombre').value.trim();
    const codigo_unico = document.getElementById('codigo_unico').value.trim();
    const direccion = document.getElementById('direccion').value.trim();

    if (!nombre || !codigo_unico) {
      return showError('Nombre y código único son obligatorios');
    }

    try {
      const resp = await fetch('http://localhost:3000/api/comunidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, codigo_unico, direccion: direccion || null })
      });
      const data = await resp.json();

      if (!resp.ok) {
        return showError(data?.error || 'No se pudo crear la comunidad');
      }

      showSuccess('Comunidad creada correctamente. Comparte el código con tus vecinos.');
      form.reset();
    } catch (err) {
      console.error(err);
      showError('Error de conexión con el servidor');
    }
  });
});
