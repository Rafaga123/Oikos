document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    // Protección: Si no hay token, volver al login
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // --- Elementos UI ---
    const mainSelection = document.getElementById('main-selection');
    const formCrear = document.getElementById('form-crear');
    const formUnirse = document.getElementById('form-unirse');

    // --- Navegación simple (Mostrar/Ocultar) ---
    document.getElementById('btn-crear').addEventListener('click', () => {
        mainSelection.style.display = 'none';
        formCrear.style.display = 'block';
    });

    document.getElementById('btn-unirse').addEventListener('click', () => {
        mainSelection.style.display = 'none';
        formUnirse.style.display = 'block';
    });

    document.getElementById('cancelar-crear').addEventListener('click', reload);
    document.getElementById('cancelar-unir').addEventListener('click', reload);

    function reload() { location.reload(); }

    // --- LÓGICA: CREAR COMUNIDAD ---
    formCrear.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('crear-nombre').value;
        const direccion = document.getElementById('crear-direccion').value;

        try {
            const res = await fetch('http://localhost:3000/api/comunidades', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // ¡Importante!
                },
                body: JSON.stringify({ nombre, direccion })
            });
            
            const data = await res.json();
            if (res.ok) {
                const codigo = data.codigo;

                // Actualizar usuario en localStorage para reflejar el nuevo rol
                let usuario = JSON.parse(localStorage.getItem('usuario'));
                usuario.rol = 'ENCARGADO_COMUNIDAD';
                localStorage.setItem('usuario', JSON.stringify(usuario));

                Swal.fire({
                    icon: 'success',
                    title: '¡Comunidad creada!',
                    html: `Tu código es <strong>${codigo}</strong>. Guárdalo y compártelo con tus vecinos.`,
                    showCancelButton: true,
                    confirmButtonText: 'Copiar código',
                    cancelButtonText: 'Ir al inicio',
                    reverseButtons: true
                }).then(async (result) => {
                    const goHome = () => { window.location.href = 'gestor.html'; };
                    if (result.isConfirmed) {
                        try {
                            await navigator.clipboard.writeText(codigo);
                            await Swal.fire({
                                icon: 'success',
                                title: 'Código copiado',
                                timer: 1400,
                                showConfirmButton: false
                            });
                        } catch (copyErr) {
                            console.error(copyErr);
                            await Swal.fire({
                                icon: 'warning',
                                title: 'No se pudo copiar',
                                text: 'Copia el código manualmente si lo necesitas.'
                            });
                        }
                    }
                    goHome();
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'No se pudo crear',
                    text: data.error || 'Intenta nuevamente.'
                });
            }
        } catch (err) { 
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No pudimos comunicarnos con el servidor.'
            }); 
        }
    });

    // --- LÓGICA: UNIRSE A COMUNIDAD ---
    formUnirse.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const codigo = document.getElementById('unir-codigo').value;
        const casa = document.getElementById('unir-casa').value;
        const tipo = document.getElementById('unir-tipo').value;

        try {
            const res = await fetch('http://localhost:3000/api/comunidades/unirse', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ codigo, numero_casa: casa, tipo_habitante: tipo })
            });

            const data = await res.json();
            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Solicitud enviada',
                    text: 'El encargado revisará tu solicitud pronto.'
                }).then(() => {
                    window.location.href = '../index.html';
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'No se pudo enviar',
                    text: data.error || 'Revisa el código o intenta más tarde.'
                });
            }
        } catch (err) { 
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No pudimos comunicarnos con el servidor.'
            }); 
        }
    });
});