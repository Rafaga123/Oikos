// Scripts/register.js – Registro por pasos con validación y cambio de paneles

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  if (!form) return;

  const steps = Array.from(document.querySelectorAll('.step'));
  const errorBox = document.getElementById('error-message');
  const progress = document.getElementById('progress-bar');

  let current = 0; // 0..2

  // Helpers de validación
  const nameRegex = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s'-]{2,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const phoneRegex = /^\+\d{8,15}$/;

  const countryDialCodes = [
    { code: 'VE', dial: '+58' },
    { code: 'CO', dial: '+57' },
    { code: 'MX', dial: '+52' },
    { code: 'AR', dial: '+54' },
    { code: 'CL', dial: '+56' },
    { code: 'US', dial: '+1' },
    { code: 'ES', dial: '+34' },
    { code: 'BR', dial: '+55' },
    { code: 'PE', dial: '+51' },
    { code: 'EC', dial: '+593' }
  ];

  const countrySelect = document.getElementById('pais-telefono');
  const phoneInput = document.getElementById('telefono');
  const birthInput = document.getElementById('fecha_nacimiento');

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
      const birth = birthInput?.value;
      const telefonoRaw = phoneInput?.value || '';
      const telefono = normalizePhone(telefonoRaw);

      if (!/^\d{6,12}$/.test(cedula)) return 'La cédula debe tener entre 6 y 12 dígitos';
      if (!emailRegex.test(email)) return 'Correo electrónico no válido';
      if (!birth) return 'Ingrese su fecha de nacimiento';
      const birthDate = new Date(birth);
      if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) return 'Fecha de nacimiento no válida';
      if (!phoneRegex.test(telefono)) return 'El teléfono debe iniciar con + y tener entre 8 y 15 dígitos';
      const matchedDial = countryDialCodes.find(c => telefono.startsWith(c.dial));
      if (!matchedDial) return 'Seleccione un país válido para el teléfono';
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
    const percent = Math.round(((index + 1) / steps.length) * 100);
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
  
    // Aseguramos que el DOM esté cargado antes de ejecutar
    $(document).ready(function() {
    $('#mobile-btn').on('click', function(e) {
        e.preventDefault();
        // Alternamos la visibilidad del menú flotante
        $('#mobile-menu-content').toggleClass('active');
    });
});
  // Auto-validación y avance por campo
  ['nombre1','nombre2','apellido1','apellido2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => updateStepState(0));
  });

  ['cedula','email','fecha_nacimiento','telefono'].forEach(id => {
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
      fecha_nacimiento: birthInput?.value,
      telefono: normalizePhone(phoneInput?.value || ''),
      password: document.getElementById('password').value
    };

    try {
      const resp = await fetch('http://localhost:3000/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();
      if (!resp.ok) {
        const message = data?.error || 'No se pudo registrar. Intente nuevamente.';
        setError(message);
        if (window.Swal) {
          Swal.fire({ icon: 'error', title: 'Registro no completado', text: message });
        }
        return;
      }

      if (window.Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Registro exitoso!',
          text: 'Inicia sesión para continuar.'
        }).then(() => {
          window.location.href = 'login.html';
        });
      } else {
        window.location.href = 'login.html';
      }

    } catch (error) {
      console.error(error);
      const message = 'Error de conexión con el servidor';
      setError(message);
      if (window.Swal) {
        Swal.fire({ icon: 'error', title: 'Sin conexión', text: message });
      }
    }
  });

  // Inicialización
  showStep(0);
  updateStepState(0);

  function normalizePhone(value) {
    return (value || '').replace(/[\s-]/g, '');
  }

  function getDialByCode(code) {
    return countryDialCodes.find(c => c.code === code)?.dial || null;
  }

  function detectCountryFromPhone(value) {
    const normalized = normalizePhone(value);
    if (!normalized.startsWith('+')) return null;
    // Buscar coincidencia más larga de prefijo
    const match = countryDialCodes
      .filter(c => normalized.startsWith(c.dial))
      .sort((a, b) => b.dial.length - a.dial.length)[0];
    return match ? match.code : null;
  }

  function applyDialToPhone(dial) {
    if (!phoneInput || !dial) return;
    const normalized = normalizePhone(phoneInput.value);
    const existing = countryDialCodes.find(c => normalized.startsWith(c.dial));
    const rest = existing ? normalized.slice(existing.dial.length) : normalized.replace(/^\+?/, '');
    phoneInput.value = dial + rest;
  }

  if (countrySelect && phoneInput) {
    // Ajustar número cuando cambia el país
    countrySelect.addEventListener('change', () => {
      const dial = getDialByCode(countrySelect.value);
      if (dial) applyDialToPhone(dial);
    });

    // Detectar país automáticamente al escribir prefijo
    phoneInput.addEventListener('input', () => {
      const detected = detectCountryFromPhone(phoneInput.value);
      if (detected && countrySelect.value !== detected) {
        countrySelect.value = detected;
      }
      updateStepState(1);
    });

    // Al salir, si no tiene +, agregar prefijo seleccionado
    phoneInput.addEventListener('blur', () => {
      const dial = getDialByCode(countrySelect.value);
      const normalized = normalizePhone(phoneInput.value);
      if (dial && normalized && !normalized.startsWith('+')) {
        phoneInput.value = dial + normalized.replace(/^0+/, '');
      }
      updateStepState(1);
    });

    // Inicializar con el prefijo seleccionado
    const initialDial = getDialByCode(countrySelect.value);
    if (initialDial && !phoneInput.value) {
      phoneInput.value = initialDial;
    }
  }
});