// Scripts/register.js – Registro por pasos con validación y cambio de paneles

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  if (!form) return;

  const steps = Array.from(document.querySelectorAll('.step'));
  const errorBox = document.getElementById('error-message');
  const progress = document.getElementById('progress-bar');
  const communityStep = document.getElementById('community-step');

  let current = 0; // 0..2

  // Helpers de validación
  const nameRegex = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s'-]{2,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const validators = {
    0: () => {
      const nombre1 = document.getElementById('nombre1').value.trim();
      const nombre2 = document.getElementById('nombre2').value.trim();
      const apellido1 = document.getElementById('apellido1').value.trim();
      const apellido2 = document.getElementById('apellido2').value.trim();

      if (!nameRegex.test(nombre1)) return 'Ingrese un primer nombre válido (mín. 2 letras)';
      if (nombre2 && !nameRegex.test(nombre2)) return 'Segundo nombre no válido';
      if (!nameRegex.test(apellido1)) return 'Ingrese un primer apellido válido (mín. 2 letras)';
      if (apellido2 && !nameRegex.test(apellido2)) return 'Segundo apellido no válido';
      return null;
    },
    1: () => {
      const cedula = document.getElementById('cedula').value.trim();
      const email = document.getElementById('email').value.trim();
      const fecha = document.getElementById('fecha_nacimiento').value;
      const telefono = document.getElementById('telefono')?.value.trim();
      const numeroCasa = document.getElementById('numero_casa')?.value.trim();
      const tipoHabitante = document.getElementById('tipo_habitante')?.value.trim();

      if (!/^\d{6,12}$/.test(cedula)) return 'La cédula debe tener entre 6 y 12 dígitos';
      if (!emailRegex.test(email)) return 'Correo electrónico no válido';
      if (!fecha) return 'Seleccione su fecha de nacimiento';
      const f = new Date(fecha);
      const hoy = new Date();
      if (isNaN(f.getTime()) || f > hoy) return 'Fecha de nacimiento inválida';
      if (telefono && !/^\+?\d{7,15}$/.test(telefono)) return 'Teléfono no válido (use solo dígitos, 7-15)';
      if (numeroCasa && !/^[A-Za-z0-9-]{1,10}$/.test(numeroCasa)) return 'Número de casa no válido';
      if (tipoHabitante && !['PROPIETARIO','INQUILINO','FAMILIAR','OTRO'].includes(tipoHabitante)) return 'Tipo de habitante no válido';
      return null;
    },
    2: () => {
      const pass = document.getElementById('password').value;
      const conf = document.getElementById('confirmar').value;
      if (pass.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
      if (!/[A-Za-z]/.test(pass) || !/\d/.test(pass)) return 'La contraseña debe incluir letras y números';
      if (pass !== conf) return 'Las contraseñas no coinciden';
      return null;
    }
  };

  function setError(msg) {
    if (!errorBox) return;
    if (!msg) {
      errorBox.style.display = 'none';
      errorBox.textContent = '';
    } else {
      errorBox.textContent = msg;
      errorBox.style.display = 'block';
    }
  }

  function showStep(index) {
    steps.forEach((s, i) => {
      s.style.display = i === index ? '' : 'none';
    });
    updateProgress(index);
    setError(null);
    current = index;
  }

  function updateProgress(index) {
    const percent = index === 0 ? 33 : index === 1 ? 66 : 100;
    // Semantic UI progress (si está disponible)
    if (window.$ && window.jQuery && progress && $(progress).progress) {
      $(progress).progress({ percent });
    } else if (progress) {
      // fallback simple
      const bar = progress.querySelector('.bar');
      if (bar) bar.style.width = percent + '%';
    }
  }

  function updateStepState(stepIndex) {
    const err = validators[stepIndex]();
    toggleNext(stepIndex, !err);
    if (!err) setError(null);
  }

  function toggleNext(stepIndex, enabled) {
    const stepEl = steps[stepIndex];
    if (!stepEl) return;
    const btn = stepEl.querySelector('.next-btn');
    if (btn) {
      btn.classList.toggle('disabled', !enabled);
      btn.setAttribute('aria-disabled', String(!enabled));
    }
  }

  function goNext() {
    const err = validators[current]();
    if (err) return setError(err);
    if (current < steps.length - 1) {
      showStep(current + 1);
    }
  }

  function goBack() {
    if (current > 0) showStep(current - 1);
  }

  // Listeners de botones Next/Back
  document.querySelectorAll('.next-btn').forEach(btn =>
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      goNext();
    })
  );
  document.querySelectorAll('.back-btn').forEach(btn =>
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      goBack();
    })
  );

  // Auto-validación y avance por campo
  ['nombre1','nombre2','apellido1','apellido2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => updateStepState(0));
  });

  ['cedula','email','fecha_nacimiento','telefono','numero_casa','tipo_habitante'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => updateStepState(1));
  });

  ['password','confirmar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => updateStepState(2));
  });

  // Enviar registro
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setError(null);

    // Validación final del paso 3
    const err = validators[2]();
    if (err) return setError(err);

    const payload = {
      primer_nombre: document.getElementById('nombre1').value.trim(),
      segundo_nombre: document.getElementById('nombre2').value.trim() || null,
      primer_apellido: document.getElementById('apellido1').value.trim(),
      segundo_apellido: document.getElementById('apellido2').value.trim() || null,
      cedula: document.getElementById('cedula').value.trim(),
      email: document.getElementById('email').value.trim(),
      fecha_nacimiento: document.getElementById('fecha_nacimiento').value || null,
      password: document.getElementById('password').value,
      telefono: document.getElementById('telefono')?.value.trim() || null,
      numero_casa: document.getElementById('numero_casa')?.value.trim() || null,
      tipo_habitante: document.getElementById('tipo_habitante')?.value.trim() || null
    };

    try {
      const resp = await fetch('http://localhost:3000/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();
      if (!resp.ok) {
        return setError(data?.error || 'No se pudo registrar. Intente nuevamente.');
      }

      // Éxito: mostrar panel de comunidad
      alert('¡Registro exitoso! Por favor inicia sesión.');
      window.location.href = 'login.html';

    } catch (error) {
      console.error(error);
      setError('Error de conexión con el servidor');
    }
  });

  // Inicialización
  showStep(0);
  updateStepState(0);
});