// Scripts/register.js

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const errorMessage = document.getElementById('error-message');
  
    if (!registerForm) return; // Protección por si el script carga en otra página
  
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Limpiar errores visuales
      errorMessage.style.display = 'none';
      errorMessage.textContent = '';
      errorMessage.className = 'ui red message'; // Resetear clase
  
      // 1. Obtener valores del HTML (Tus IDs actuales)
      const cedula = document.getElementById('cedula').value.trim();
      const email = document.getElementById('email').value.trim();
      
      const primer_nombre = document.getElementById('nombre1').value.trim();
      const segundo_nombre = document.getElementById('nombre2').value.trim();
      
      const primer_apellido = document.getElementById('apellido1').value.trim();
      const segundo_apellido = document.getElementById('apellido2').value.trim();
      
      const fecha_nacimiento = document.getElementById('fecha_nacimiento').value;
      const password = document.getElementById('password').value;
      const confirmar = document.getElementById('confirmar').value;
  
      // 2. Validaciones Frontend
      if (password !== confirmar) {
        mostrarError('Las contraseñas no coinciden');
        return;
      }
  
      // 3. Preparar el paquete para Oikos (Nombres de la Base de Datos)
      const datosParaEnviar = {
        cedula,
        email,
        password,
        primer_nombre,   // Mapeo directo
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        fecha_nacimiento
      };
  
      // 4. Enviar al Backend
      try {
        const respuesta = await fetch('http://localhost:3000/api/registro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosParaEnviar)
        });
  
        const data = await respuesta.json();
  
        if (respuesta.ok) {
          alert('¡Registro exitoso en Oikos! Ahora inicia sesión.');
          window.location.href = 'login.html';
        } else {
          mostrarError(data.error || 'Error desconocido al registrarse');
        }
  
      } catch (error) {
        console.error('Error de red:', error);
        mostrarError('No hay conexión con el servidor Oikos');
      }
    });
  
    function mostrarError(msg) {
      errorMessage.textContent = msg;
      errorMessage.style.display = 'block';
    }
});