document.addEventListener('DOMContentLoaded', () => {
  // --- Referencias a los Formularios y Botones ---
  const loginForm = document.getElementById('loginForm');
  const forgotForm = document.getElementById('forgotForm');
  
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const backToLogin = document.getElementById('backToLogin');

  // --- Referencias a los Divs de Error ---
  const loginErrorMessage = document.getElementById('login-error-message');
  const forgotErrorMessage = document.getElementById('forgot-error-message');

  // --- Lógica para MOSTRAR/OCULTAR formularios ---
  
  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault(); // Previene que el link '#' recargue la página
    loginForm.style.display = 'none';
    forgotForm.style.display = 'block';
  });

  backToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    forgotForm.style.display = 'none';
    loginForm.style.display = 'block';
  });

  // --- Lógica del Formulario de LOGIN ---
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginErrorMessage.style.display = 'none';

    // 1. Obtener valores (¡usando 'usuario'!)
    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;

    // 2. Crear el body
    const body = { usuario, password };

    // 3. Enviar al backend (¡que ahora es más inteligente!)
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        // ¡ÉXITO!
        alert('¡Bienvenido!');
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        window.location.href = 'home_page.html'; // Redirige al perfil
      } else {
        // Muestra error del backend
        loginErrorMessage.textContent = data.error;
        loginErrorMessage.style.display = 'block';  
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      loginErrorMessage.textContent = 'No se pudo conectar con el servidor.';
      loginErrorMessage.style.display = 'block';
    }
  });

  // --- Lógica del Formulario de OLVIDAR CONTRASEÑA ---
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    forgotErrorMessage.style.display = 'none';
    
    // NOTA: Aún no hemos creado este endpoint en el backend.
    // Esto requeriría un servicio de envío de emails (como SendGrid).
    // Por ahora, solo mostramos un mensaje.
    
    const email = document.getElementById('forgotEmail').value;
    alert('Función de recuperar contraseña aún no implementada.');
    
    // (Cuando esté listo, aquí iría el fetch a '/api/forgot-password')
    
    // forgotErrorMessage.textContent = 'Si el correo existe, se enviará un enlace.';
    // forgotErrorMessage.style.display = 'block';
  });
});