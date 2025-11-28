document.addEventListener('DOMContentLoaded', () => {
  // Inicializar la barra de progreso de Semantic UI
  $('#progress-bar').progress({
    total: 3,
    text: {
      active: 'Paso {value} de {total}',
    }
  });

  const registerForm = document.getElementById('register-form');
  const errorMessage = document.getElementById('error-message');
  const communityStep = document.getElementById('community-step');
  
  const steps = Array.from(document.querySelectorAll('.step'));
  const nextButtons = Array.from(document.querySelectorAll('.next-btn'));
  const backButtons = Array.from(document.querySelectorAll('.back-btn'));
  
  let currentStep = 1;

  // Manejar botones "Siguiente"
  nextButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Ocultar errores
      errorMessage.style.display = 'none';
      errorMessage.textContent = '';

      // Validar campos del paso actual (simple validación de no estar vacíos)
      const currentStepElement = document.getElementById(`step-${currentStep}`);
      const inputs = Array.from(currentStepElement.querySelectorAll('input[required]'));
      
      let isValid = true;
      inputs.forEach(input => {
        if (!input.value.trim()) {
          isValid = false;
          input.parentElement.classList.add('error'); // Semantic UI resalta el campo
        } else {
          input.parentElement.classList.remove('error');
        }
      });

      if (!isValid) {
        errorMessage.textContent = 'Por favor, complete todos los campos requeridos.';
        errorMessage.style.display = 'block';
        return;
      }

      // Ocultar paso actual y mostrar el siguiente
      if (currentStep < steps.length) {
        currentStepElement.style.display = 'none';
        currentStep++;
        document.getElementById(`step-${currentStep}`).style.display = 'block';
        
        // Actualizar barra de progreso
        $('#progress-bar').progress('increment');
      }
    });
  });

  // Manejar botones "Volver"
  backButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (currentStep > 1) {
            // Ocultar errores
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';

            // Ocultar paso actual y mostrar el anterior
            document.getElementById(`step-${currentStep}`).style.display = 'none';
            currentStep--;
            document.getElementById(`step-${currentStep}`).style.display = 'block';

            // Decrementar barra de progreso
            $('#progress-bar').progress('decrement');
        }
    });
  });

  // Manejar el envío final del formulario
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';

    const password = document.getElementById('password').value;
    const confirmar_password = document.getElementById('confirmar').value;

    if (password !== confirmar_password) {
      errorMessage.textContent = 'Las contraseñas no coinciden';
      errorMessage.style.display = 'block';
      return;
    }

    // Recolectar todos los datos del formulario
    const formData = new FormData(registerForm);
    const body = Object.fromEntries(formData.entries());

    // Renombrar claves para que coincidan con el backend
    body.primer_nombre = body.nombre1;
    body.segundo_nombre = body.nombre2;
    body.primer_apellido = body.apellido1;
    body.segundo_apellido = body.apellido2;
    delete body.nombre1;
    delete body.nombre2;
    delete body.apellido1;
    delete body.apellido2;
    delete body.confirmar;


    try {
      const response = await fetch('http://localhost:3000/api/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        // Ocultar el formulario y la barra de progreso
        registerForm.style.display = 'none';
        document.getElementById('progress-bar').style.display = 'none';
        document.querySelector('.ui.attached.message').style.display = 'none';
        
        // Mostrar el paso de la comunidad
        communityStep.style.display = 'block';
        
        // Actualizar barra de progreso a completado
        $('#progress-bar').progress('set success');

      } else {
        errorMessage.textContent = data.error || 'Ocurrió un error en el registro.';
        errorMessage.style.display = 'block';
      }

    } catch (error) {
      console.error('Error de conexión:', error);
      errorMessage.textContent = 'No se pudo conectar con el servidor. Intenta más tarde.';
      errorMessage.style.display = 'block';
    }
  });

  // Lógica para los botones de comunidad (puedes expandir esto)
  document.getElementById('create-community-btn').addEventListener('click', () => {
    alert('Funcionalidad "Crear Comunidad" no implementada aún.');
    // window.location.href = 'crear_comunidad.html'; // Ejemplo
  });

  document.getElementById('join-community-btn').addEventListener('click', () => {
    alert('Funcionalidad "Unirse a Comunidad" no implementada aún.');
    // window.location.href = 'unirse_comunidad.html'; // Ejemplo
  });
});
