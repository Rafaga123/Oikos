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
                alert(`¡Éxito! Tu código de comunidad es: ${data.codigo}\nGuárdalo para dárselo a tus vecinos.`);
                // Actualizar usuario en localStorage para reflejar el nuevo rol
                let usuario = JSON.parse(localStorage.getItem('usuario'));
                usuario.rol = 'ENCARGADO_COMUNIDAD';
                localStorage.setItem('usuario', JSON.stringify(usuario));
                
                window.location.href = 'home_page.html';
            } else {
                alert(data.error);
            }
        } catch (err) { alert('Error de conexión'); }
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
                alert('Solicitud enviada. Espera a que el encargado te apruebe.');
                window.location.href = 'home_page.html'; // O una página de "Pendiente"
            } else {
                alert(data.error);
            }
        } catch (err) { alert('Error de conexión'); }
    });
});