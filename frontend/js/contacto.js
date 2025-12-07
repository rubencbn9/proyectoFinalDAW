// Contact form functionality
const form = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const successAlert = document.getElementById('successAlert');
const errorAlert = document.getElementById('errorAlert');

const API_URL = 'http://localhost:9000/api/contacto/enviar';

if (form) {
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Ocultar alertas previas
        successAlert.classList.remove('active');
        errorAlert.classList.remove('active');

        // Deshabilitar botón y mostrar spinner
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span>Enviando...';

        // Obtener datos del formulario
        const formData = {
            nombre: document.getElementById('nombre').value.trim(),
            email: document.getElementById('email').value.trim(),
            asunto: document.getElementById('asunto').value,
            mensaje: document.getElementById('mensaje').value.trim()
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Mostrar éxito
                successAlert.textContent = '✅ ' + data.mensaje;
                successAlert.classList.add('active');
                form.reset();
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // Redirigir después de 3 segundos
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
            } else {
                throw new Error(data.mensaje || 'Error al enviar el mensaje');
            }

        } catch (error) {
            console.error('Error al enviar:', error);
            errorAlert.textContent = '❌ ' + (error.message || 'Hubo un error al enviar el mensaje. Inténtalo de nuevo.');
            errorAlert.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            // Restaurar botón
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Enviar mensaje';
        }
    });
}