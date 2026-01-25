// Scripts/reset_password.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('resetForm');
  const errorBox = document.getElementById('reset-error-message');

  if (!form) return;

  const showError = (msg) => {
    if (!errorBox) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo actualizar',
        text: msg
      });
      return;
    }
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
  };

  const clearError = () => {
    if (errorBox) {
      errorBox.style.display = 'none';
      errorBox.textContent = '';
    }
  };

  function getTokenFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const token = getTokenFromQuery();
    const pass = document.getElementById('newPassword').value;
    const conf = document.getElementById('confirmPassword').value;

    if (!token) return showError('Token faltante en la URL');
    if (pass.length < 8) return showError('La contraseña debe tener al menos 8 caracteres');
    if (!/[A-Za-z]/.test(pass) || !/\d/.test(pass)) return showError('Incluye letras y números');
    if (pass !== conf) return showError('Las contraseñas no coinciden');

    try {
      const res = await fetch('http://localhost:3000/api/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: pass })
      });
      const data = await res.json();
      if (!res.ok) return showError(data?.error || 'No se pudo actualizar');

      Swal.fire({
        icon: 'success',
        title: 'Contraseña actualizada',
        text: 'Ahora puedes iniciar sesión.'
      }).then(() => {
        window.location.href = 'login.html';
      });
    } catch (err) {
      console.error(err);
      showError('Error de conexión con el servidor');
    }
  });
});
