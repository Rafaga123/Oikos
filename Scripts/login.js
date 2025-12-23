// Scripts/login.js

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginErrorMessage = document.getElementById('login-error-message');

  if (!loginForm) return;

  const showError = (msg) => {
    if (!loginErrorMessage) return alert(msg);
    loginErrorMessage.textContent = msg;
    loginErrorMessage.style.display = 'block';
  };

  const clearError = () => {
    if (loginErrorMessage) {
      loginErrorMessage.style.display = 'none';
      loginErrorMessage.textContent = '';
    }
  };

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita envío por querystring
    clearError();

    const usuario = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value;

    if (!usuario || !password) {
      return showError('Ingresa usuario y contraseña');
    }

    try {
      const respuesta = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        return showError(data?.error || 'Credenciales inválidas');
      }

      // Persistir sesión mínima
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));

      // Redirección por rol
      const rol = data.usuario.rol;
      if (data.usuario.estado_solicitud === 'SIN_COMUNIDAD') {
        window.location.href = 'bienvenida.html'; // <--- El usuario nuevo va aquí
      } else if (rol === 'ENCARGADO_COMUNIDAD') {
        window.location.href = 'admin.html'; // página de gestor (debo estar pendiente de cambiar el nombre luego)
      } else if (rol === 'ADMINISTRADOR') {
        window.location.href = '/administrador/administrador.html'; // página de administrador
      } else {
        window.location.href = 'home_page.html';
      }
    } catch (error) {
      console.error(error);
      showError('Error de conexión con el servidor');
    }
  });
});