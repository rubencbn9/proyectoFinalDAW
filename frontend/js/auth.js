/**
 * funcion de autenticacion
 * Proporciona ayuda para el control de acceso basado en roles
 */

const AUTH_KEYS = {
    TOKEN: 'token',
    USERNAME: 'username',
    ROLE: 'role'
};

const ROLES = {
    ADMIN: 'ADMINISTRADOR',
    USER: 'USUARIO'
};

/**
 * Comprueba si el usuario esta autenticado
 * anotaciones jsdoc: 
 * @returns {boolean}
 */
function isAuthenticated() {
    return !!localStorage.getItem(AUTH_KEYS.TOKEN);
}

/**
 * Obtiene el rol del usuario actual
 * @returns {string|null}
 */
function getRole() {
    return localStorage.getItem(AUTH_KEYS.ROLE);
}

/**
 * Comprueba si el usuario actual es un administrador
 * @returns {boolean}
 */
function isAdmin() {
    return getRole() === ROLES.ADMIN;
}

/**
 * Obtiene el nombre de usuario actual
 * @returns {string|null}
 */
function getUsername() {
    return localStorage.getItem(AUTH_KEYS.USERNAME);
}

/**
 * Obtiene el token de autenticación
 * @returns {string|null}
 */
function getToken() {
    return localStorage.getItem(AUTH_KEYS.TOKEN);
}

/**
 * Almacena los datos de autenticación desde la respuesta de login/registro
 * @param {Object} data - Datos de respuesta con token, nombre de usuario, rol
 */
function storeAuthData(data) {
    if (data.token) localStorage.setItem(AUTH_KEYS.TOKEN, data.token);
    if (data.username) localStorage.setItem(AUTH_KEYS.USERNAME, data.username);
    if (data.role) localStorage.setItem(AUTH_KEYS.ROLE, data.role);
}

//------------------------------------------------------
// Elimina todos los datos de autenticacion (logout)
//------------------------------------------------------
function clearAuthData() {
    localStorage.removeItem(AUTH_KEYS.TOKEN);
    localStorage.removeItem(AUTH_KEYS.USERNAME);
    localStorage.removeItem(AUTH_KEYS.ROLE);
}

/**
 * Maneja el cierre de sesion
 */
function handleLogout() {
    clearAuthData();
    window.location.href = '/registro.html';
}

/**
 * Comprueba si el usuario esta autenticado y redirige si no lo está
 * @returns {boolean}
 */
function checkAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/registro.html';
        return false;
    }
    return true;
}

/**
 * comprueba el acceso admin y redirige si no es admin
 * @returns {boolean}
 */
function checkAdminAccess() {
    if (!checkAuth()) return false;

    if (!isAdmin()) {
        // Show access denied and redirect
        alert('Acceso denegado. Solo administradores pueden acceder a esta página.');
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

/**
 * obtiene headers para las peticiones api
 * @returns {Object}
 */
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

/**
 * maneja las respuestas de errores de api 
 * @param {Response} response
 * @throws {Error}
 */
async function handleApiError(response) {
    if (response.status === 401) {
        clearAuthData();
        window.location.href = '/registro.html';
        throw new Error('Sesión expirada. Por favor inicia sesión de nuevo.');
    }

    if (response.status === 403) {
        throw new Error('Acceso denegado. No tienes permisos para realizar esta acción.');
    }

    const errorText = await response.text();
    throw new Error(errorText || 'Error en la solicitud');
}

/**
 * actualiza UI basado en el rol
 */
function updateUIForRole() {
    const adminLinks = document.querySelectorAll('.admin-only');
    const userRoleElements = document.querySelectorAll('.user-role');

    // muestra esconde elementos solo para admin
    adminLinks.forEach(el => {
        el.style.display = isAdmin() ? '' : 'none';
    });

    // actualiza elementos de muestra por rol
    userRoleElements.forEach(el => {
        el.textContent = getRole() || 'USUARIO';
    });
}


document.addEventListener('DOMContentLoaded', () => {
    if (isAuthenticated()) {
        updateUIForRole();
    }
});
