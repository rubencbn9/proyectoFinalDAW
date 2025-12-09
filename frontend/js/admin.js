const API_URL = 'http://localhost:9000/api';

// comprobar acceso de admin inmediatamente
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAdminAccess()) return;

    // iniciar dashboard
    loadDashboardStats();
    setupTabs();
    setupForms();

    // carga de datos inicial
    loadUsers();
    loadVideos();

    const profileBtn = document.getElementById('profile-inicial');
    if (profileBtn) {
        const username = getUsername();
        profileBtn.textContent = username ? username.charAt(0).toUpperCase() : 'A';
    }
});

function setupTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));

            item.classList.add('active');
            const tabId = item.dataset.tab;
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

function setupForms() {
    const createUserForm = document.getElementById('create-user-form');
    if (createUserForm) {
        createUserForm.addEventListener('submit', handleCreateUser);
    }
}

// --- APIs ---

async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Error loading stats');

        const stats = await response.json();
        console.log('Admin Stats Response:', stats); // Debugging

        
        const userCount = stats.totalUsuarios || 0;
        const videoCount = stats.totalVideos || 0;

        document.getElementById('total-users').textContent = userCount;
        document.getElementById('total-videos').textContent = videoCount;
    } catch (error) {
        console.error('Stats error:', error);
        document.getElementById('total-users').textContent = 'Error';
        document.getElementById('total-videos').textContent = 'Error';
    }
}

async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Error loading users');

        const users = await response.json();
        renderUsersTable(users);
    } catch (error) {
        console.error('Users error:', error);
    }
}

async function loadVideos() {
    try {
        const response = await fetch(`${API_URL}/admin/videos`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Error loading videos');

        const videos = await response.json();
        renderVideosTable(videos);
    } catch (error) {
        console.error('Videos error:', error);
    }
}

// --- Renderizado ---

function renderUsersTable(users) {
    const tbody = document.querySelector('#users-table tbody');
    tbody.innerHTML = '';

    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td><span class="role-badge ${user.rol === 'ADMINISTRADOR' ? 'admin' : 'user'}">${user.rol}</span></td>
            <td>${user.totalVideos || 0}</td>
            <td>
                ${user.rol !== 'ADMINISTRADOR' ? `
                <button class="action-btn btn-promote" onclick="promoteUser(${user.id})" title="Hacer Administrador">⬆️</button>
                <button class="action-btn btn-delete" onclick="deleteUser(${user.id})" title="Eliminar Usuario">🗑️</button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderVideosTable(videos) {
    const tbody = document.querySelector('#videos-table tbody');
    tbody.innerHTML = '';

    videos.forEach(video => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${video.idVideo}</td>
            <td><a class="linkAdmin" href="${video.url}">${video.titulo}</a></td>
            <td>${video.fuente || 'Desconocida'}</td>
            <td>${new Date(video.fechaGuardado).toLocaleDateString()}</td>
            <td>
                <button class="action-btn btn-delete" onclick="deleteVideo(${video.idVideo})" title="Eliminar Video">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- Acciones ---

async function handleCreateUser(e) {
    e.preventDefault();

    const username = document.getElementById('new-username').value;
    const email = document.getElementById('new-email').value;
    const password = document.getElementById('new-password').value;
    const rol = document.getElementById('new-role').value;

    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ username, email, password, rol })
        });

        if (!response.ok) throw new Error('Error creando usuario');

        closeCreateUserModal();
        document.getElementById('create-user-form').reset();
        loadUsers();
        loadDashboardStats();
        alert('Usuario creado exitosamente');
    } catch (error) {
        alert('Error al crear usuario: ' + error.message);
    }
}

async function deleteUser(userId) {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;

    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Error deleting user');

        loadUsers();
        loadDashboardStats();
    } catch (error) {
        alert('Error al eliminar usuario: ' + error.message);
    }
}

async function promoteUser(userId) {
    if (!confirm('¿Estás seguro de hacer a este usuario a Administrador?')) return;

    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/change-role`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ rol: 'ADMINISTRADOR' })
        });

        if (!response.ok) throw new Error('Error ascendiendo usuario');

        loadUsers();
    } catch (error) {
        alert('Error al ascender usuario: ' + error.message);
    }
}

async function deleteVideo(videoId) {
    if (!confirm('¿Estás seguro de eliminar este video?')) return;

    try {
        const response = await fetch(`${API_URL}/admin/videos/${videoId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Error eliminando video');

        loadVideos();
        loadDashboardStats();
    } catch (error) {
        alert('Error al eliminar video: ' + error.message);
    }
}

// --- Modales ---

function showCreateUserModal() {
    document.getElementById('create-user-modal').classList.add('active');
}

function closeCreateUserModal() {
    document.getElementById('create-user-modal').classList.remove('active');
}

// Cerrar modal al hacer clic fuera
window.onclick = function (event) {
    const modal = document.getElementById('create-user-modal');
    if (event.target == modal) {
        closeCreateUserModal();
    }
}
