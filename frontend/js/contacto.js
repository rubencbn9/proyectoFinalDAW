// Contact form functionality
const form = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const successAlert = document.getElementById('successAlert');
const errorAlert = document.getElementById('errorAlert');

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
            // Simular envío (puedes conectar esto a tu backend)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Mostrar éxito
            successAlert.classList.add('active');
            form.reset();
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Redirigir después de 3 segundos
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);

        } catch (error) {
            console.error('Error al enviar:', error);
            errorAlert.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            // Restaurar botón
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Enviar mensaje';
        }
    });
}
