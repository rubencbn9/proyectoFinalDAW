const API_URL = 'http://localhost:9000/api';

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
        
        // Actualizar foto de perfil con inicial
        const primeraLetra = (usuario.username || 'U').charAt(0).toUpperCase();
        document.getElementById('profilePicture').textContent = primeraLetra;
        
        // Actualizar botón del header
        const headerProfileBtn = document.getElementById('headerProfileBtn');
        if (headerProfileBtn) {
            headerProfileBtn.textContent = primeraLetra;
        }

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

// Funcion de cargar foto
function uploadPhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const profilePic = document.getElementById('profilePicture');
                profilePic.style.backgroundImage = `url(${event.target.result})`;
                profilePic.style.backgroundSize = 'cover';
                profilePic.style.backgroundPosition = 'center';
                profilePic.textContent = '';
                
                // Aquí podría enviar la imagen 
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function removePhoto() {
    const profilePic = document.getElementById('profilePicture');
    const username = document.getElementById('username').value;
    profilePic.style.backgroundImage = '';
    profilePic.textContent = username ? username.charAt(0).toUpperCase() : 'U';
}

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

// Desactivar cuenta (la eliminaré mas adelante posiblemente)
// function deactivateAccount() {
//     if (confirm('¿Estás seguro de que quieres desactivar la cuenta? Podrás reactivarla de nuevo iniciando sesión.')) {
//         // Aquí irá la lógica de desactivación
//         let eliminacion = delete
//         showNotification('Cuenta desactivada. Serás redirigido al login.', 'success');
        
//         setTimeout(() => {
//             localStorage.clear();
//             window.location.href = '/registro.html';
//         }, 2000);
//     }
// }

// Eliminar cuenta
async function deleteAccount() {
    const confirmation = prompt('Esta acción no se puede deshacer. Escribe "ELIMINAR" para confirmar:');
    
    if (confirmation === 'ELIMINAR') {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showNotification('No hay sesión activa', 'error');
                window.location.href = '/login.html';
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

// Cerrar sesió
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
    
    // Si existe el botón de logout en esta página, agregarlo
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});