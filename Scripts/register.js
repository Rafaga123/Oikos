// Scripts/login.js

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los formularios (tu lógica de swap ya estaba bien, la mantengo simple aquí)
    const loginForm = document.getElementById('loginForm');
    const loginErrorMessage = document.getElementById('login-error-message');
  
    if (!loginForm) return;

    // --- Lógica de envío del Login ---
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if(loginErrorMessage) loginErrorMessage.style.display = 'none';
  
      const usuario = document.getElementById('usuario').value.trim();
      const password = document.getElementById('password').value;
  
      try {
        const respuesta = await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario, password })
        });
  
        const data = await respuesta.json();
  
        if (respuesta.ok) {
          // 1. Guardar sesión
          localStorage.setItem('token', data.token);
          localStorage.setItem('usuario', JSON.stringify(data.usuario));
  
          // 2. DECIDIR A DÓNDE IR (El Router de Oikos)
          const estado = data.usuario.estado_solicitud;
  
          if (estado === 'SIN_COMUNIDAD') {
            // Usuario nuevo -> Flujo de bienvenida
            console.log("Usuario nuevo detectado. Redirigiendo a bienvenida...");
            window.location.href = 'bienvenida.html'; // Tienes que crear este archivo pronto
          } else {
            // Usuario con comunidad (Pendiente o Aceptado) -> Perfil
            window.location.href = 'profile.html';
          }
  
        } else {
          mostrarError(data.error || 'Credenciales inválidas');
        }
  
      } catch (error) {
        console.error(error);
        mostrarError('Error de conexión con el servidor');
      }
    });
  
    function mostrarError(msg) {
        if(loginErrorMessage) {
            loginErrorMessage.textContent = msg;
            loginErrorMessage.style.display = 'block';
        } else {
            alert(msg);
        }
    }
  
});