let videos = [];
let filteredVideos = [];

// Estado de los filtros
const filters = {
    platforms: [],
    categories: [],
    uploadDate: []
};

// Verificar autenticación
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
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

// Cargar los videos desde el backend
async function generateVideoCards() {
    if (!checkAuth()) return;
    
    try {
        const response = await fetch('http://localhost:9000/api/videos/list', {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401 || response.status === 403) {
            localStorage.clear();
            window.location.href = '/registro.html';
            return;
        }
        
        if (!response.ok) throw new Error('Error al obtener los videos');
        
        videos = await response.json();
        filteredVideos = [...videos];
        renderVideos(filteredVideos);
    } catch (error) {
        console.error('Error cargando videos:', error);
        showNotification('Error al cargar los videos', 'error');
    }
}

// Obtener nombre de usuario del localStorage
const nombreUsuario = localStorage.getItem('nombre') || localStorage.getItem('username') || 'Usuario';
document.getElementById("usuario").textContent = nombreUsuario;

// Actualizar botón de perfil con inicial del usuario
const profileBtn = document.querySelector('.profile-btn');
if (profileBtn) {
    // Mostrar la primera letra del nombre de usuario
    const primeraLetra = nombreUsuario.charAt(0).toUpperCase();
    profileBtn.textContent = primeraLetra;
    profileBtn.setAttribute('aria-label', `Perfil de ${nombreUsuario}`);
}

// Renderizar videos
function renderVideos(videosToRender) {
    const videoGrid = document.getElementById('videoGrid');
    videoGrid.innerHTML = '';

    if (videosToRender.length === 0) {
        videoGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <p style="color: #666; font-size: 18px; margin-bottom: 10px;">📭 No se encontraron videos</p>
                <p style="color: #888; font-size: 14px;">Intenta cambiar los filtros o la búsqueda</p>
            </div>
        `;
        return;
    }

    videosToRender.forEach(video => {
        const fecha = video.fechaGuardado
            ? new Date(video.fechaGuardado).toLocaleString()
            : 'Sin fecha';

        const card = document.createElement('div');
        card.className = 'video-card';
        card.style.position = 'relative';
        card.innerHTML = `
            <button class="delete-video-btn" onclick="event.preventDefault(); deleteVideo(${video.id})" 
    title="Eliminar video"
    style="position: absolute; bottom: 10px; right: 10px; z-index: 10; 
           background: rgba(255, 68, 68, 0.9); color: white; border: none; 
           border-radius: 50%; width: 36px; height: 36px; cursor: pointer; 
           display: flex; align-items: center; justify-content: center;
           font-size: 18px; transition: all 0.3s ease; backdrop-filter: blur(10px);"
    onmouseenter="this.style.background='rgba(255, 68, 68, 1)'; this.style.transform='scale(1.1) rotate(10deg)';"
    onmouseleave="this.style.background='rgba(255, 68, 68, 0.9)'; this.style.transform='scale(1) rotate(0deg)';">
    🗑️
</button>

            <a style="text-decoration: none; color: inherit;" href="/videoPlay.html?id=${video.id}" class="video-link">
                <div class="video-thumbnail">
                    <img src="${video.miniaturaUrl || '/placeholder.svg?height=180&width=320'}" 
                         alt="${video.titulo}">
                    <span class="video-platform">${video.fuente || 'Desconocida'}</span>
                </div>
                <div class="video-info">
                    <h3 class="video-title">${video.titulo}</h3>
                    <p>${video.descripcion || 'Sin descripción'}</p>
                    <div class="video-meta">
                        <span>🗓 ${fecha}</span>
                        ${video.categoria ? `<span>📁 ${video.categoria}</span>` : ''}
                    </div>
                </div>
            </a>
        `;
        videoGrid.appendChild(card);
    });

    // Actualizar contador de resultados
    updateResultsCount(videosToRender.length);
}

// Actualizar contador de resultados
function updateResultsCount(count) {
    const contentHeader = document.querySelector('.content-header p');
    const activeFiltersCount = filters.platforms.length + filters.categories.length + filters.uploadDate.length;
    
    if (activeFiltersCount > 0 || searchBar.value.trim() !== '') {
        contentHeader.textContent = `Mostrando ${count} de ${videos.length} videos`;
    } else {
        contentHeader.textContent = 'Explora contenido de moda de multiples plataformas';
    }
}

// Aplicar filtros
function applyFilters() {
    filteredVideos = videos.filter(video => {
        // Filtro de plataformas
        if (filters.platforms.length > 0) {
            const videoPlatform = (video.fuente || '').toLowerCase();
            const matchesPlatform = filters.platforms.some(platform => 
                videoPlatform === platform.toLowerCase() || 
                videoPlatform.includes(platform.toLowerCase())
            );
            if (!matchesPlatform) return false;
        }

        // Filtro de categorías
        if (filters.categories.length > 0) {
            const videoCategory = (video.categoria || '').toLowerCase();
            const matchesCategory = filters.categories.some(category => 
                videoCategory === category.toLowerCase() ||
                videoCategory.includes(category.toLowerCase())
            );
            if (!matchesCategory) return false;
        }

        // Filtro de fecha de subida
        if (filters.uploadDate.length > 0) {
            if (!video.fechaGuardado) return false;
            
            const videoDate = new Date(video.fechaGuardado);
            const now = new Date();
            const diffTime = Math.abs(now - videoDate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            const matchesDate = filters.uploadDate.some(dateFilter => {
                if (dateFilter === 'today') return diffDays === 0;
                if (dateFilter === 'week') return diffDays <= 7;
                if (dateFilter === 'month') return diffDays <= 30;
                return false;
            });
            
            if (!matchesDate) return false;
        }

        return true;
    });

    // Aplicar búsqueda si hay texto en el buscador
    const searchTerm = searchBar.value.toLowerCase().trim();
    if (searchTerm) {
        filteredVideos = filteredVideos.filter(video =>
            video.titulo.toLowerCase().includes(searchTerm) ||
            (video.descripcion && video.descripcion.toLowerCase().includes(searchTerm))
        );
    }

    renderVideos(filteredVideos);
}

// Configurar listeners de filtros de plataforma
const platformFilters = {
    'youtube': 'YouTube',
    'tiktok': 'TikTok',
    'vimeo': 'Vimeo',
    'instagram': 'Instagram'
};

Object.keys(platformFilters).forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
        checkbox.addEventListener('change', (e) => {
            const platform = platformFilters[id];
            if (e.target.checked) {
                filters.platforms.push(platform);
            } else {
                filters.platforms = filters.platforms.filter(p => p !== platform);
            }
            applyFilters();
            updateFilterBadge();
        });
    }
});

// Configurar listeners de filtros de categoría
const categoryFilters = {
    'music': 'Musica',
    'gaming': 'Gaming',
    'education': 'Educacion',
    'entertainment': 'Entretenimiento',
    'sports': 'Deportes'
};

Object.keys(categoryFilters).forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
        checkbox.addEventListener('change', (e) => {
            const category = categoryFilters[id];
            if (e.target.checked) {
                filters.categories.push(category);
            } else {
                filters.categories = filters.categories.filter(c => c !== category);
            }
            applyFilters();
            updateFilterBadge();
        });
    }
});

// Configurar listeners de filtros de fecha
const dateFilters = {
    'today': 'today',
    'week': 'week',
    'month': 'month'
};

Object.keys(dateFilters).forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
        checkbox.addEventListener('change', (e) => {
            const dateFilter = dateFilters[id];
            if (e.target.checked) {
                filters.uploadDate.push(dateFilter);
            } else {
                filters.uploadDate = filters.uploadDate.filter(d => d !== dateFilter);
            }
            applyFilters();
            updateFilterBadge();
        });
    }
});

// Actualizar badge de filtros activos
function updateFilterBadge() {
    const totalFilters = filters.platforms.length + filters.categories.length + filters.uploadDate.length;
    const contentHeader = document.querySelector('.content-header h1');
    
    // Eliminar badge existente si lo hay
    const existingBadge = contentHeader.querySelector('.filter-badge');
    if (existingBadge) {
        existingBadge.remove();
    }
    
    // Agregar nuevo badge si hay filtros activos
    if (totalFilters > 0) {
        const badge = document.createElement('span');
        badge.className = 'filter-badge';
        badge.textContent = totalFilters;
        badge.style.cssText = `
            display: inline-block;
            background: #00d9ff;
            color: #0a0a0a;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            line-height: 24px;
            text-align: center;
            font-size: 12px;
            font-weight: 700;
            margin-left: 10px;
            vertical-align: middle;
        `;
        
        // Insertar antes del div.separate
        const separate = contentHeader.querySelector('.separate');
        if (separate) {
            contentHeader.insertBefore(badge, separate);
        } else {
            contentHeader.appendChild(badge);
        }
    }
}

// Botón para limpiar todos los filtros
function addClearFiltersButton() {
    const sidebar = document.querySelector('.sidebar');
    
    const clearButton = document.createElement('button');
    clearButton.textContent = '🗑️ Limpiar Filtros';
    clearButton.style.cssText = `
        width: 100%;
        padding: 12px;
        margin-top: 20px;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    `;
    
    clearButton.addEventListener('mouseenter', () => {
        clearButton.style.background = '#ff6666';
        clearButton.style.transform = 'scale(1.02)';
    });
    
    clearButton.addEventListener('mouseleave', () => {
        clearButton.style.background = '#ff4444';
        clearButton.style.transform = 'scale(1)';
    });
    
    clearButton.addEventListener('click', () => {
        // Limpiar arrays de filtros
        filters.platforms = [];
        filters.categories = [];
        filters.uploadDate = [];
        
        // Desmarcar todos los checkboxes
        document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Aplicar filtros (mostrará todos los videos)
        applyFilters();
        updateFilterBadge();
    });
    
    sidebar.appendChild(clearButton);
}

// Search functionality mejorada
const searchBar = document.querySelector('.search-bar');
searchBar.addEventListener('input', (e) => {
    applyFilters(); // Esto ya incluye la búsqueda
});

// Animación del botón de añadir video
document.querySelectorAll('.add-video').forEach(button => {
    let div = document.createElement('div'),
        letters = button.textContent.trim().split('');

    function elements(letter, index, array) {
        let element = document.createElement('span'),
            part = (index >= array.length / 2) ? -1 : 1,
            position = (index >= array.length / 2) ? array.length / 2 - index + (array.length / 2 - 1) : index,
            move = position / (array.length / 2),
            rotate = 1 - move;

        element.innerHTML = !letter.trim() ? '&nbsp;' : letter;
        element.style.setProperty('--move', move);
        element.style.setProperty('--rotate', rotate);
        element.style.setProperty('--part', part);

        div.appendChild(element);
    }

    letters.forEach(elements);
    button.innerHTML = div.outerHTML;

    button.addEventListener('mouseenter', e => {
        if (!button.classList.contains('out')) {
            button.classList.add('in');
        }
    });

    button.addEventListener('mouseleave', e => {
        if (button.classList.contains('in')) {
            button.classList.add('out');
            setTimeout(() => button.classList.remove('in', 'out'), 950);
        }
    });
});

// Inicializar
generateVideoCards();
addClearFiltersButton();

// Función para eliminar video
async function deleteVideo(videoId) {
    // Mostrar modal de confirmación personalizado
    const confirmed = await showConfirmModal(
        '¿Eliminar video?',
        '¿Estás seguro de que quieres eliminar este video? Esta acción no se puede deshacer.'
    );
    
    if (!confirmed) return;

    try {
        const response = await fetch(`http://localhost:9000/api/videos/${videoId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.clear();
            window.location.href = '/registro.html';
            return;
        }

        if (!response.ok) {
            throw new Error('Error al eliminar el video');
        }

        // Eliminar del array local
        videos = videos.filter(v => v.id !== videoId);
        
        // Aplicar filtros de nuevo para actualizar la vista
        applyFilters();
        
        // Mostrar notificación de éxito
        showNotification('✅ Video eliminado correctamente', 'success');
        
    } catch (error) {
        console.error('Error al eliminar video:', error);
        showNotification('❌ Error al eliminar el video', 'error');
    }
}

// Modal de confirmación personalizado
function showConfirmModal(title, message) {
    return new Promise((resolve) => {
        // Crear overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease;
        `;

        // Crear modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: #1a1a1a;
            border: 2px solid #333;
            border-radius: 16px;
            padding: 30px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            animation: slideIn 0.3s ease;
        `;

        modal.innerHTML = `
            <h3 style="color: #00d9ff; margin: 0 0 15px 0; font-size: 22px;">${title}</h3>
            <p style="color: #ccc; margin: 0 0 25px 0; line-height: 1.5;">${message}</p>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancelBtn" style="
                    padding: 10px 20px;
                    background: transparent;
                    color: #aaa;
                    border: 2px solid #444;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s ease;
                ">Cancelar</button>
                <button id="confirmBtn" style="
                    padding: 10px 20px;
                    background: #ff4444;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s ease;
                ">Eliminar</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Agregar estilos de animación
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // Event listeners
        const confirmBtn = modal.querySelector('#confirmBtn');
        const cancelBtn = modal.querySelector('#cancelBtn');

        confirmBtn.addEventListener('mouseenter', () => {
            confirmBtn.style.background = '#ff6666';
            confirmBtn.style.transform = 'scale(1.05)';
        });
        confirmBtn.addEventListener('mouseleave', () => {
            confirmBtn.style.background = '#ff4444';
            confirmBtn.style.transform = 'scale(1)';
        });

        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.background = '#2a2a2a';
            cancelBtn.style.borderColor = '#666';
        });
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.background = 'transparent';
            cancelBtn.style.borderColor = '#444';
        });

        confirmBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(true);
        });

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(false);
        });

        // Cerrar con ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', escHandler);
                resolve(false);
            }
        };
        document.addEventListener('keydown', escHandler);
    });
}

// Sistema de notificaciones
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
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
        animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s;
    `;

    // Agregar animaciones
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Exponer función globalmente
window.deleteVideo = deleteVideo;