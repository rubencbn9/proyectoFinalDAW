
const API_URL = 'http://localhost:9000/api';

function switchTab(tab) {
    // Cambiar tabs activos
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    // Cambiar formularios
    document.querySelectorAll('.form-container').forEach(f => f.classList.remove('active'));
    document.getElementById(`${tab}-form`).classList.add('active');

    // Limpiar error
    hideError();
}

function showError(message) {
    const errorEl = document.getElementById('error-message');
    errorEl.textContent = message;
    errorEl.classList.add('show');
}

function hideError() {
    document.getElementById('error-message').classList.remove('show');
}

async function handleLogin(e) {
    e.preventDefault();
    hideError();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    const loading = document.getElementById('login-loading');

    btn.disabled = true;
    loading.classList.add('show');

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Error al iniciar sesión');
        }

        const data = await response.json();

        // Guardar token y datos del usuario
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        if (data.role) localStorage.setItem('role', data.role);

        // Redirigir según el rol
        if (data.role === 'ADMINISTRADOR') {
            window.location.href = '/admin.html';
        } else {
            window.location.href = '/index.html';
        }

    } catch (error) {
        showError(error.message);
    } finally {
        btn.disabled = false;
        loading.classList.remove('show');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    hideError();

    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const btn = document.getElementById('register-btn');
    const loading = document.getElementById('register-loading');

    btn.disabled = true;
    loading.classList.add('show');

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Error al registrarse');
        }

        const data = await response.json();

        // Guardar token y datos del usuario
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        if (data.role) localStorage.setItem('role', data.role);

        // Redirigir al index
        window.location.href = '/index.html';

    } catch (error) {
        showError(error.message);
    } finally {
        btn.disabled = false;
        loading.classList.remove('show');
    }
}

// Verificar si ya esta logueado
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (token) {
        if (role === 'ADMINISTRADOR') {
            window.location.href = '/admin.html';
        } else {
            window.location.href = '/index.html';
        }
    }
});
