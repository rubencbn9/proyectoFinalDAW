const API_URL = 'http://localhost:9000/api';
const UPLOAD_URL = 'http://localhost:9000/uploads';

// Variable para actualizaciones de la foto de perfil
let currentUserId = null;

// Verificar autenticación
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('No hay token, redirigiendo a registro...');
        window.location.href = '/registro.html';
        return false;
    }
    return true;
}

// Obtener headers con autenticación
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Obtener headers de autenticación sin Content-Type (para multipart/form-data)
function getAuthHeadersForUpload() {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`
    };
}

//------------------------------------------------------
//FUNCIONES DE FOTO DE PERFIL
//------------------------------------------------------

// Mostrar la foto de perfil desde el nombre de archivo
function displayProfilePicture(filename) {
    const profilePic = document.getElementById('profilePicture');
    if (!profilePic) return;

    const imageUrl = `${UPLOAD_URL}/${filename}`;
    profilePic.innerHTML = `<img src="${imageUrl}" alt="Foto de perfil" onerror="handleProfileImageError()">`;
    profilePic.classList.add('has-image');
}

// Mostrar avatar por defecto con la inicial
function displayDefaultAvatar(username) {
    const profilePic = document.getElementById('profilePicture');
    if (!profilePic) return;

    const primeraLetra = (username || 'U').charAt(0).toUpperCase();
    profilePic.innerHTML = primeraLetra;
    profilePic.classList.remove('has-image');
}

// Actualizar el botón del header con la foto o la inicial
function updateHeaderProfileButton(profilePicture, username) {
    const headerProfileBtn = document.getElementById('headerProfileBtn');
    if (!headerProfileBtn) return;

    if (profilePicture) {
        const imageUrl = `${UPLOAD_URL}/${profilePicture}`;
        headerProfileBtn.innerHTML = `<img src="${imageUrl}" alt="Perfil">`;
        headerProfileBtn.classList.add('has-image');
    } else {
        const primeraLetra = (username || 'U').charAt(0).toUpperCase();
        headerProfileBtn.textContent = primeraLetra;
        headerProfileBtn.classList.remove('has-image');
    }
}

// Manejar error de carga de la foto de perfil - rebotar al avatar por defecto
function handleProfileImageError() {
    const username = document.getElementById('username')?.value || 'U';
    displayDefaultAvatar(username);
}

// Establecer el estado de carga de la foto de perfil
function setProfilePictureLoading(isLoading) {
    const profilePic = document.getElementById('profilePicture');
    const uploadBtn = document.getElementById('uploadPhotoBtn');
    const deleteBtn = document.getElementById('deletePhotoBtn');

    if (isLoading) {
        profilePic?.classList.add('loading');
        if (uploadBtn) uploadBtn.disabled = true;
        if (deleteBtn) deleteBtn.disabled = true;
    } else {
        profilePic?.classList.remove('loading');
        if (uploadBtn) uploadBtn.disabled = false;
        if (deleteBtn) deleteBtn.disabled = false;
    }
}

// Cargar datos del usuario al iniciar
async function loadUserData() {
    if (!checkAuth()) return;

    console.log('Cargando datos del usuario...');

    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: getAuthHeaders()
        });

        console.log('Respuesta del servidor:', response.status);

        if (response.status === 401 || response.status === 403) {
            console.log('Token inválido, limpiando localStorage...');
            localStorage.clear();
            window.location.href = '/registro.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const usuario = await response.json();
        console.log('Usuario cargado:', usuario);

        // Almacenar ID del usuario para operaciones de foto de perfil
        currentUserId = usuario.idUsuario;

        // Actualizar campos del formulario
        document.getElementById('username').value = usuario.username || 'No disponible';
        document.getElementById('email').value = usuario.email || 'No disponible';

        // Formatear y mostrar fecha de registro
        if (usuario.fechaRegistro) {
            const fecha = new Date(usuario.fechaRegistro);
            document.getElementById('fechaRegistro').value = fecha.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        // Actualizar foto de perfil - mostrar imagen si existe, o inicial si no
        if (usuario.profilePicture) {
            displayProfilePicture(usuario.profilePicture);
        } else {
            displayDefaultAvatar(usuario.username);
        }

        // Actualizar botón del header con foto o inicial
        updateHeaderProfileButton(usuario.profilePicture, usuario.username);

        console.log('Datos del usuario cargados correctamente');
        showNotification('Perfil cargado correctamente', 'success');

    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        showNotification(`Error al cargar datos: ${error.message}`, 'error');

        // Si hay un error de autenticación, redirigir
        if (error.message.includes('401') || error.message.includes('403')) {
            setTimeout(() => {
                localStorage.clear();
                window.location.href = '/registro.html';
            }, 2000);
        }
    }
}
//------------------------------------------------------
// FUNCIONES DE SUBIDA/ELIMINACION DE LA FOTO DE PERFIL 
//------------------------------------------------------

// Subir nueva foto de perfil
async function uploadPhoto() {
    if (!currentUserId) {
        showNotification('Error: Usuario no identificado', 'error');
        return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            showNotification('Por favor selecciona un archivo de imagen válido', 'error');
            return;
        }

        // Validar tamaño de archivo (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            showNotification('La imagen no puede superar los 5MB', 'error');
            return;
        }

        // Mostrar estado de carga
        setProfilePictureLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_URL}/usuarios/${currentUserId}/profile-picture`, {
                method: 'POST',
                headers: getAuthHeadersForUpload(),
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Error al subir la imagen');
            }

            const updatedUser = await response.json();
            console.log('Imagen subida correctamente:', updatedUser);

            // Mostrar la nueva foto de perfil
            if (updatedUser.profilePicture) {
                displayProfilePicture(updatedUser.profilePicture);
                // Actualizar el botón del header
                updateHeaderProfileButton(updatedUser.profilePicture, updatedUser.username);
            }

            showNotification('✅ Foto de perfil actualizada correctamente', 'success');

        } catch (error) {
            console.error('Error al subir foto de perfil:', error);
            showNotification(`Error al subir la foto: ${error.message}`, 'error');
        } finally {
            setProfilePictureLoading(false);
        }
    };

    input.click();
}

// Eliminar la foto de perfil actual
async function removePhoto() {
    if (!currentUserId) {
        showNotification('Error: Usuario no identificado', 'error');
        return;
    }

    // Confirmar eliminación
    if (!confirm('¿Estás seguro de que quieres eliminar tu foto de perfil?')) {
        return;
    }

    // Mostrar estado de carga
    setProfilePictureLoading(true);

    try {
        const response = await fetch(`${API_URL}/usuarios/${currentUserId}/profile-picture`, {
            method: 'DELETE',
            headers: getAuthHeadersForUpload()
        });

        if (!response.ok && response.status !== 204) {
            const errorText = await response.text();
            throw new Error(errorText || 'Error al eliminar la imagen');
        }

        console.log('Foto de perfil eliminada correctamente');

        //  Mostrar avatar por defecto
        const username = document.getElementById('username').value;
        displayDefaultAvatar(username);
        // Actualizar el botón del header
        updateHeaderProfileButton(null, username);

        showNotification('✅ Foto de perfil eliminada correctamente', 'success');

    } catch (error) {
        console.error('Error al eliminar foto de perfil:', error);
        showNotification(`Error al eliminar la foto: ${error.message}`, 'error');
    } finally {
        setProfilePictureLoading(false);
    }
}

//------------------------------------------------------
// FUNCIONES DE CAMBIO CONTRASEÑA
//------------------------------------------------------

// Cambiar contraseña
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validaciones frontend
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Por favor rellena todos los campos de contraseña', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    if (newPassword === currentPassword) {
        showNotification('La nueva contraseña debe ser diferente a la actual', 'error');
        return;
    }

    // Deshabilitar botón mientras se procesa
    const btn = event.target;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Cambiando...';

    try {
        const response = await fetch(`${API_URL}/auth/change-password`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        const data = await response.text();

        if (!response.ok) {
            throw new Error(data || 'Error al cambiar contraseña');
        }

        showNotification('✅ Contraseña cambiada correctamente', 'success');
        document.getElementById('securityForm').reset();

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        showNotification(error.message || 'Error al cambiar la contraseña', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// Guardar cambios del perfil
async function saveChanges() {
    const userData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
    };

    // Validaciones
    if (!userData.username || !userData.email) {
        showNotification('Por favor rellena todos los campos', 'error');
        return;
    }

    if (!userData.email.includes('@')) {
        showNotification('Email inválido', 'error');
        return;
    }

    // Deshabilitar botón mientras se procesa
    const btn = event.target;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
        const token = localStorage.getItem('token');
        const payload = JSON.parse(atob(token.split('.')[1]));
        const username = payload.sub;

        // Obtener ID del usuario
        const userResponse = await fetch(`${API_URL}/usuarios/buscar?nombre=${username}`, {
            headers: getAuthHeaders()
        });

        if (!userResponse.ok) {
            throw new Error('No se pudo obtener información del usuario');
        }

        const usuario = await userResponse.json();

        // Actualizar usuario
        const response = await fetch(`${API_URL}/usuarios/${usuario.idUsuario}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Error al guardar cambios');
        }

        showNotification('✅ Cambios guardados correctamente', 'success');

        // Actualizar localStorage si cambiaste el username
        localStorage.setItem('username', userData.username);

        // Scroll to top para mostrar mensaje
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error('Error al guardar cambios:', error);
        showNotification(error.message || 'Error al guardar los cambios', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

function cancelChanges() {
    if (confirm('¿Estás seguro de que quieres cancelar los cambios?')) {
        window.location.href = '/index.html';
    }
}


//------------------------------------------------------
// FUNCION PARA ELIMINAR CUENTA
//------------------------------------------------------
async function deleteAccount() {
    const confirmation = prompt('Esta acción no se puede deshacer. Escribe "ELIMINAR" para confirmar:');

    if (confirmation === 'ELIMINAR') {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showNotification('No hay sesión activa', 'error');
                window.location.href = '/registro.html';
                return;
            }

            // Obtener el username del token
            const payload = JSON.parse(atob(token.split('.')[1]));
            const username = payload.sub;

            const response = await fetch(`${API_URL}/usuarios/username/${username}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            showNotification('Cuenta eliminada. Toda tu información ha sido borrada.', 'success');

            setTimeout(() => {
                localStorage.clear();
                window.location.href = '/registro.html';
            }, 2000);

        } catch (error) {
            console.error('Error al eliminar cuenta:', error);
            showNotification('Error al eliminar la cuenta: ' + error.message, 'error');
        }
    } else if (confirmation !== null) {
        showNotification('Eliminación de cuenta cancelada. Por favor escribe "ELIMINAR" exactamente para confirmar.', 'error');
    }
}

// Cerrar sesión
function handleLogout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        localStorage.clear();
        showNotification('👋 Sesión cerrada correctamente', 'success');

        setTimeout(() => {
            window.location.href = '/registro.html';
        }, 1000);
    }
}

// Sistema de notificaciones
function showNotification(message, type = 'success') {
    // Eliminar notificación anterior si existe
    const existingNotification = document.querySelector('.notification-toast');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#00d9ff' : '#ff4444'};
        color: ${type === 'success' ? '#0a0a0a' : '#ffffff'};
        border-radius: 12px;
        font-size: 15px;
        font-weight: 600;
        z-index: 10001;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        animation: slideInRight 0.3s ease;
    `;

    // Agregar animaciones si no existen
    if (!document.querySelector('style[data-notifications]')) {
        const style = document.createElement('style');
        style.setAttribute('data-notifications', 'true');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Inicializar cuando se carga la pagina
window.addEventListener('DOMContentLoaded', () => {
    loadUserData();

    // Si existe el boton de logout en esta pagina, agregarlo
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});