/**
 * Auth Utility Functions
 * Provides role-based access control helpers
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
 * Check if user is authenticated
 * @returns {boolean}
 */
function isAuthenticated() {
    return !!localStorage.getItem(AUTH_KEYS.TOKEN);
}

/**
 * Get the current user's role
 * @returns {string|null}
 */
function getRole() {
    return localStorage.getItem(AUTH_KEYS.ROLE);
}

/**
 * Check if current user is an admin
 * @returns {boolean}
 */
function isAdmin() {
    return getRole() === ROLES.ADMIN;
}

/**
 * Get the current user's username
 * @returns {string|null}
 */
function getUsername() {
    return localStorage.getItem(AUTH_KEYS.USERNAME);
}

/**
 * Get the auth token
 * @returns {string|null}
 */
function getToken() {
    return localStorage.getItem(AUTH_KEYS.TOKEN);
}

/**
 * Store auth data from login/register response
 * @param {Object} data - Response data with token, username, role
 */
function storeAuthData(data) {
    if (data.token) localStorage.setItem(AUTH_KEYS.TOKEN, data.token);
    if (data.username) localStorage.setItem(AUTH_KEYS.USERNAME, data.username);
    if (data.role) localStorage.setItem(AUTH_KEYS.ROLE, data.role);
}

/**
 * Clear all auth data (logout)
 */
function clearAuthData() {
    localStorage.removeItem(AUTH_KEYS.TOKEN);
    localStorage.removeItem(AUTH_KEYS.USERNAME);
    localStorage.removeItem(AUTH_KEYS.ROLE);
}

/**
 * Handle logout
 */
function handleLogout() {
    clearAuthData();
    window.location.href = '/registro.html';
}

/**
 * Check auth and redirect if not authenticated
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
 * Check admin access and redirect if not admin
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
 * Get auth headers for API requests
 * @returns {Object}
 */
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

/**
 * Handle API response errors including 403
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
 * Update UI elements based on role
 */
function updateUIForRole() {
    const adminLinks = document.querySelectorAll('.admin-only');
    const userRoleElements = document.querySelectorAll('.user-role');

    // Show/hide admin-only elements
    adminLinks.forEach(el => {
        el.style.display = isAdmin() ? '' : 'none';
    });

    // Update role display elements
    userRoleElements.forEach(el => {
        el.textContent = getRole() || 'USUARIO';
    });
}

// Auto-update UI on page load
document.addEventListener('DOMContentLoaded', () => {
    if (isAuthenticated()) {
        updateUIForRole();
    }
});
