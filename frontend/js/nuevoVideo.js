const tagInput = document.getElementById('tagInput');
const tagsContainer = document.getElementById('tagsContainer');
const tags = []; // Array para almacenar las etiquetas
const MAX_TAGS = 10;

// Solo agregar event listener si existe el elemento
if (tagInput) {
    tagInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tagValue = this.value.trim();

            if (tagValue && tags.length < MAX_TAGS && !tags.includes(tagValue)) {
                addTag(tagValue);
                this.value = '';
            }
        }
    });
}

function addTag(tagValue) {
    if (!tagsContainer || !tagInput) return;
    tags.push(tagValue);

    const tagElement = document.createElement('span');
    tagElement.className = 'tag';
    window.removeTag = removeTag;
    tagElement.innerHTML = `
        ${tagValue}
        <span class="tag-remove" onclick="removeTag('${tagValue}', this)">×</span>
    `;

    tagsContainer.insertBefore(tagElement, tagInput);
}

function removeTag(tagValue, element) {
    const index = tags.indexOf(tagValue);
    if (index > -1) {
        tags.splice(index, 1);
    }
    element.parentElement.remove();
}

// Video URL detection
const videoUrlInput = document.getElementById('videoUrl');
const videoPreview = document.getElementById('videoPreview');
const platformInfo = document.getElementById('platformInfo');

if (videoUrlInput) {
    videoUrlInput.addEventListener('input', function () {
        const url = this.value.trim();

        if (url) {
            const platform = detectPlatform(url);
            if (platform) {
                if (platformInfo) platformInfo.textContent = `Platform: ${platform}`;
                if (videoPreview) videoPreview.classList.add('active');
            } else {
                if (videoPreview) videoPreview.classList.remove('active');
            }
        } else {
            if (videoPreview) videoPreview.classList.remove('active');
        }
    });
}

//------------------------------------------------------
// GESTION DE USUARIO
//------------------------------------------------------

// Obtener nombre del usuario guardado
const nombreUsuario = localStorage.getItem('nombre')
    || localStorage.getItem('username')
    || 'Usuario';

// Mostrar nombre completo si existe el contenedor
const userNameElement = document.getElementById("usuario");
if (userNameElement) {
    userNameElement.textContent = nombreUsuario;
}

// Actualizar inicial del botón de perfil
const profileBtn = document.querySelector('.profile-btn');
if (profileBtn) {
    const inicial = nombreUsuario.charAt(0).toUpperCase();
    profileBtn.textContent = inicial;
    profileBtn.setAttribute("aria-label", `Perfil de ${nombreUsuario}`);
}

// Cargar foto de perfil del usuario
async function loadUserProfilePicture() {
    const token = localStorage.getItem('jwtToken') || localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('http://localhost:9000/api/auth/me', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) return;

        const usuario = await response.json();
        const profileBtn = document.querySelector('.profile-btn');

        if (profileBtn && usuario.profilePicture) {
            const UPLOAD_URL = 'http://localhost:9000/uploads';
            profileBtn.innerHTML = `<img src="${UPLOAD_URL}/${usuario.profilePicture}" alt="Perfil">`;
            profileBtn.classList.add('has-image');
        }
    } catch (error) {
        console.log('No se pudo cargar la foto de perfil');
    }
}

// Cargar foto de perfil
loadUserProfilePicture();


function detectPlatform(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return 'YouTube';
    } else if (url.includes('tiktok.com')) {
        return 'TikTok';
    } else if (url.includes('vimeo.com')) {
        return 'Vimeo';
    } else if (url.includes('dailymotion.com')) {
        return 'Dailymotion';
    } else if (url.includes('twitch.tv')) {
        return 'Twitch';
    }
    return null;
}

//------------------------------------------------------
// AGREGAR VIDEO
//------------------------------------------------------

// Envío del formulario
const form = document.getElementById('addVideoForm');
const submitBtn = document.getElementById('submitBtn');
const successAlert = document.getElementById('successAlert');
const errorAlert = document.getElementById('errorAlert');

if (form) {
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        //Obtener el token ANTES de cualquier envio
        const token = localStorage.getItem('jwtToken') || localStorage.getItem('token');

        // Ocultar alertas previas
        if (successAlert) successAlert.classList.remove('active');
        if (errorAlert) errorAlert.classList.remove('active');

        // Deshabilitar boton
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span>Añadiendo video...';
        }

        //Comprobar autenticación
        if (!token) {
            const authError = new Error('No hay sesión activa. Por favor, inicia sesión.');
            console.error('Error de autenticación:', authError);
            if (errorAlert) {
                errorAlert.textContent = authError.message;
                errorAlert.classList.add('active');
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Añadir Video';
            }
            return;
        }

        //  Construir formData 
        const formData = {
            titulo: document.getElementById('videoTitle').value.trim(),
            descripcion: document.getElementById('videoDescription').value.trim(),
            url: document.getElementById('videoUrl').value.trim(),
            fuente: detectPlatform(document.getElementById('videoUrl').value.trim()),
            miniaturaUrl: null,
            visto: false,
            // Enviar el nombre de la categoría 
            categoria: document.getElementById('videoCategory').value,
            etiquetas: tags,
            // El backend debe ignorar esto y usar el ID del JWT
            usuarioId: 1
        };

        try {
            //Enviar solicitud con el token
            const response = await fetch('http://localhost:9000/api/videos/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Video added successfully:', data);
                if (successAlert) successAlert.classList.add('active');

                // Limpieza y redirección
                form.reset();
                tags.length = 0;
                document.querySelectorAll('.tag').forEach(tag => tag.remove());
                if (videoPreview) videoPreview.classList.remove('active');
                window.scrollTo({ top: 0, behavior: 'smooth' });

                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                // Manejar errores de servidor
                let errorMessage = 'Error al añadir el video. Inténtalo de nuevo.';

                // Intenta leer el cuerpo de la respuesta 
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData || errorMessage;
                } catch (jsonError) {
                    // Si la respuesta no es JSON, usa el estado.
                    errorMessage = `Error ${response.status}: ${response.statusText}`;
                }

                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('❌ Error adding video:', error);
            if (errorAlert) {
                errorAlert.textContent = error.message || 'Ocurrió un error inesperado.';
                errorAlert.classList.add('active');
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            // Restaurar boton
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Añadir Video';
            }
        }
    });
}