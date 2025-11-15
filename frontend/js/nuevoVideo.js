// Tags functionality
const tagInput = document.getElementById('tagInput');
const tagsContainer = document.getElementById('tagsContainer');
const tags = []; // Array para almacenar las etiquetas
const MAX_TAGS = 10;


tagInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const tagValue = this.value.trim();
        
        if (tagValue && tags.length < MAX_TAGS && !tags.includes(tagValue)) {
            addTag(tagValue);
            this.value = '';
        }
    }
});

function addTag(tagValue) {
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

videoUrlInput.addEventListener('input', function() {
    const url = this.value.trim();
    
    if (url) {
        const platform = detectPlatform(url);
        if (platform) {
            platformInfo.textContent = `Platform: ${platform}`;
            videoPreview.classList.add('active');
        } else {
            videoPreview.classList.remove('active');
        }
    } else {
        videoPreview.classList.remove('active');
    }
});

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


// Form submission
const form = document.getElementById('addVideoForm');
const submitBtn = document.getElementById('submitBtn');
const successAlert = document.getElementById('successAlert');
const errorAlert = document.getElementById('errorAlert');

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    //Obtener el token ANTES de cualquier envío
    const token = localStorage.getItem('jwtToken') || localStorage.getItem('token'); 

    // Ocultar alertas previas
    successAlert.classList.remove('active');
    errorAlert.classList.remove('active');
    
    // Deshabilitar botón
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span>Añadiendo video...';
    
    //Comprobar autenticación
    if (!token) {
        const authError = new Error('No hay sesión activa. Por favor, inicia sesión.');
        console.error('Error de autenticación:', authError);
        // Usar throw new Error() fuera de try/catch para un manejo más simple.
        errorAlert.textContent = authError.message;
        errorAlert.classList.add('active');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Añadir Video';
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
        // El backend debe ignorar esto y usar el ID del JWT, pero lo dejamos por si acaso
        usuarioId: 1 
    };

    try {
        //Enviar solicitud con el token
        const response = await fetch('http://localhost:9000/api/videos/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // <-- ¡CRÍTICO PARA EL 500!
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Video added successfully:', data);
            successAlert.classList.add('active');
            
            // Limpieza y redirección
            form.reset();
            tags.length = 0;
            document.querySelectorAll('.tag').forEach(tag => tag.remove());
            videoPreview.classList.remove('active');
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
        errorAlert.textContent = error.message || 'Ocurrió un error inesperado.';
        errorAlert.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Añadir Video';
    }
});