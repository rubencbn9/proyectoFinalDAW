const API_URL = 'http://localhost:9000/api';

let videos = [];
let filteredVideos = [];

// Estado de los filtros
const filters = {
  platforms: [],
  categories: [],
  uploadDate: [],
  visto: null // null = todos, true = solo vistos, false = solo no vistos
};

// Verificar autenticación
function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/registro.html";
    return false;
  }
  return true;
}

// Obtener headers con autenticación
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ========================================
// SISTEMA DE VIDEOS VISTOS
// ========================================

// Toggle estado visto
async function toggleVideoVisto(videoId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  try {
    const response = await fetch(`${API_URL}/videos/${videoId}/toggle-visto`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Error al cambiar estado del video');
    }

    const updatedVideo = await response.json();

    // Actualizar video en el array local
    const index = videos.findIndex(v => v.idVideo === videoId);
    if (index !== -1) {
      videos[index].visto = updatedVideo.visto;
    }

    // Actualizar UI
    actualizarEstadoVistoUI(videoId, updatedVideo.visto);

    // Reaplicar filtros si hay filtro de visto activo
    if (filters.visto !== null) {
      applyFilters();
    }

    return updatedVideo;

  } catch (error) {
    console.error('Error:', error);
    showNotification('Error al cambiar estado del video', 'error');
  }
}

// Actualizar UI del botón
function actualizarEstadoVistoUI(videoId, visto) {
  const btn = document.querySelector(`[data-video-id="${videoId}"]`);
  if (!btn) return;

  const card = btn.closest('.video-card');

  if (visto) {
    btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Visto
        `;
    btn.classList.add('visto');
    btn.classList.remove('no-visto');
    btn.style.background = '#00d9ff';
    btn.style.color = '#0a0a0a';

    // Agregar badge si no existe
    if (card && !card.querySelector('.visto-badge')) {
      const badge = document.createElement('div');
      badge.className = 'visto-badge';
      badge.innerHTML = '✓ Visto';
      badge.style.cssText = `
                position: absolute;
                top: 10px;
                left: 10px;
                z-index: 10;
                background: #00d9ff;
                color: #0a0a0a;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                box-shadow: 0 2px 8px rgba(0, 217, 255, 0.3);
                display: inline-flex;
                align-items: center;
                gap: 4px;
                width: auto;
            `;
      card.appendChild(badge);
    }

    if (card) card.classList.add('video-visto');
  } else {
    btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Marcar visto
        `;
    btn.classList.add('no-visto');
    btn.classList.remove('visto');
    btn.style.background = '#2a2a2a';
    btn.style.color = '#fff';

    // Quitar badge si existe
    const badge = card?.querySelector('.visto-badge');
    if (badge) badge.remove();

    if (card) card.classList.remove('video-visto');
  }
}

// Filtrar por estado visto
function filtrarPorVisto(estado) {
  filters.visto = estado;
  applyFilters();

  // Actualizar botones de filtro
  document.querySelectorAll('.filter-visto-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  const activeBtn = document.querySelector(`[data-visto="${estado}"]`);
  if (activeBtn) activeBtn.classList.add('active');
}

// ========================================
// CARGAR Y RENDERIZAR VIDEOS
// ========================================

// Cargar los videos desde el backend
async function generateVideoCards() {
  if (!checkAuth()) return;

  try {
    const response = await fetch(`${API_URL}/videos/list`, {
      headers: getAuthHeaders(),
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.clear();
      window.location.href = "/registro.html";
      return;
    }

    if (!response.ok) throw new Error("Error al obtener los videos");

    videos = await response.json();
    filteredVideos = [...videos];
    renderVideos(filteredVideos);
  } catch (error) {
    console.error("Error cargando videos:", error);
    showNotification("Error al cargar los videos", "error");
  }
}

// Renderizar videos
function renderVideos(videosToRender) {
  const videoGrid = document.getElementById("videoGrid");
  videoGrid.innerHTML = "";

  if (videosToRender.length === 0) {
    videoGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <p style="color: #666; font-size: 18px; margin-bottom: 10px;">📭 No se encontraron videos</p>
        <p style="color: #888; font-size: 14px;">Intenta cambiar los filtros o la búsqueda</p>
      </div>
    `;
    return;
  }

  videosToRender.forEach((video) => {
    const card = renderVideoCard(video);
    videoGrid.appendChild(card);
  });

  updateResultsCount(videosToRender.length);
}

// Renderizar tarjeta individual de video
function renderVideoCard(video) {
  const fecha = video.fechaGuardado
    ? new Date(video.fechaGuardado).toLocaleString()
    : "Sin fecha";

  const card = document.createElement("div");
  card.className = `video-card ${video.visto ? 'video-visto' : ''}`;
  card.style.position = "relative";

  card.innerHTML = `
        <!-- Badge visto: ARRIBA IZQUIERDA -->
        ${video.visto ? `
            <div class="visto-badge" style="position: absolute; top: 10px; left: 10px; z-index: 10; background: #00d9ff; color: #0a0a0a; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; box-shadow: 0 2px 8px rgba(0, 217, 255, 0.3); display: inline-flex; align-items: center; gap: 4px; width: auto;">
                ✓ Visto
            </div>
        ` : ''}

        <a href="/videoPlay.html?id=${video.idVideo}" class="video-link" style="text-decoration: none; color: inherit; display: block;">
            <div class="video-thumbnail" style="position: relative; width: 100%; aspect-ratio: 16/9;">
                <img src="${video.miniaturaUrl || '/placeholder.svg?height=180&width=320'}" 
                     alt="${video.titulo}"
                     style="width: 100%; height: 100%; object-fit: cover;">
                
                <!-- Plataforma: ARRIBA DERECHA -->
                <span class="video-platform" style="position: absolute; top: 10px; right: 10px; background: rgba(0, 0, 0, 0.8); color: white; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; backdrop-filter: blur(10px); z-index: 9;">
                    ${video.fuente || 'Desconocida'}
                </span>

                
            </div>
        </a>

        <div class="video-info" style="padding: 15px;">
            <h3 class="video-title" style="font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">${video.titulo}</h3>
            <p style="color: #888; font-size: 14px; margin: 0 0 12px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${video.descripcion || 'Sin descripción'}</p>
            <div class="video-meta" style="display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">
                <span style="font-size: 12px; color: #888; background: #2a2a2a; padding: 4px 8px; border-radius: 4px;">🗓 ${fecha}</span>
                ${video.categoria?.nombre ? `<span style="font-size: 12px; color: #888; background: #2a2a2a; padding: 4px 8px; border-radius: 4px;">📁 ${video.categoria.nombre}</span>` : ''}
            <!-- Papelera: ABAJO DERECHA (dentro de la miniatura) -->
                <button class="delete-video-btn" 
                    onclick="event.preventDefault(); event.stopPropagation(); deleteVideo(${video.idVideo})" 
                    title="Eliminar video"
                    style="position: absolute; bottom: 65px; right: 10px; z-index: 15; background: rgba(255, 68, 68, 0.9); color: white; border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: all 0.3s ease; backdrop-filter: blur(10px);"
                    onmouseenter="this.style.background='rgba(255, 68, 68, 1)'; this.style.transform='scale(1.1) rotate(10deg)';"
                    onmouseleave="this.style.background='rgba(255, 68, 68, 0.9)'; this.style.transform='scale(1) rotate(0deg)';">
                    🗑️
                </button>
                </div>
            
            <button 
                class="btn-visto ${video.visto ? 'visto' : 'no-visto'}" 
                data-video-id="${video.idVideo}"
                onclick="toggleVideoVisto(${video.idVideo}, event)"
                style="width: 100%; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s ease; background: ${video.visto ? '#00d9ff' : '#2a2a2a'}; color: ${video.visto ? '#0a0a0a' : '#fff'};">
                ${video.visto ?
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> Visto' :
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> Marcar visto'
    }
            </button>
        </div>
    `;

  return card;
}

// ========================================
// SISTEMA DE FILTROS
// ========================================

// Aplicar filtros
function applyFilters() {
  filteredVideos = videos.filter((video) => {
    // Filtro de estado visto
    if (filters.visto !== null) {
      if (video.visto !== filters.visto) return false;
    }

    // Filtro de plataformas
    if (filters.platforms.length > 0) {
      const videoPlatform = (video.fuente || "").toLowerCase();
      const matchesPlatform = filters.platforms.some(
        (platform) =>
          videoPlatform === platform.toLowerCase() ||
          videoPlatform.includes(platform.toLowerCase())
      );
      if (!matchesPlatform) return false;
    }

    // Filtro de categorías
    if (filters.categories.length > 0) {
      const videoCategory = (video.categoria?.nombre || "").toLowerCase();
      const matchesCategory = filters.categories.some(
        (category) =>
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

      const matchesDate = filters.uploadDate.some((dateFilter) => {
        if (dateFilter === "today") return diffDays === 0;
        if (dateFilter === "week") return diffDays <= 7;
        if (dateFilter === "month") return diffDays <= 30;
        return false;
      });

      if (!matchesDate) return false;
    }

    return true;
  });

  // Aplicar búsqueda
  const searchTerm = searchBar.value.toLowerCase().trim();
  if (searchTerm) {
    filteredVideos = filteredVideos.filter(
      (video) =>
        video.titulo.toLowerCase().includes(searchTerm) ||
        (video.descripcion &&
          video.descripcion.toLowerCase().includes(searchTerm))
    );
  }

  renderVideos(filteredVideos);
}

// Actualizar contador de resultados
function updateResultsCount(count) {
  const contentHeader = document.querySelector(".content-header p");
  const activeFiltersCount =
    filters.platforms.length +
    filters.categories.length +
    filters.uploadDate.length +
    (filters.visto !== null ? 1 : 0);

  if (activeFiltersCount > 0 || searchBar.value.trim() !== "") {
    contentHeader.textContent = `Mostrando ${count} de ${videos.length} videos`;
  } else {
    contentHeader.textContent = "Explora contenido de moda de multiples plataformas";
  }
}

// Configurar listeners de filtros
const platformFilters = {
  youtube: "YouTube",
  tiktok: "TikTok",
  vimeo: "Vimeo",
  dailymotion: "Dailymotion",
};

Object.keys(platformFilters).forEach((id) => {
  const checkbox = document.getElementById(id);
  if (checkbox) {
    checkbox.addEventListener("change", (e) => {
      const platform = platformFilters[id];
      if (e.target.checked) {
        filters.platforms.push(platform);
      } else {
        filters.platforms = filters.platforms.filter((p) => p !== platform);
      }
      applyFilters();
      updateFilterBadge();
    });
  }
});

const categoryFilters = {
  music: "Musica",
  gaming: "Gaming",
  education: "Educacion",
  entertainment: "Entretenimiento",
  sports: "Deportes",
};

Object.keys(categoryFilters).forEach((id) => {
  const checkbox = document.getElementById(id);
  if (checkbox) {
    checkbox.addEventListener("change", (e) => {
      const category = categoryFilters[id];
      if (e.target.checked) {
        filters.categories.push(category);
      } else {
        filters.categories = filters.categories.filter((c) => c !== category);
      }
      applyFilters();
      updateFilterBadge();
    });
  }
});

const dateFilters = {
  today: "today",
  week: "week",
  month: "month",
};

Object.keys(dateFilters).forEach((id) => {
  const checkbox = document.getElementById(id);
  if (checkbox) {
    checkbox.addEventListener("change", (e) => {
      const dateFilter = dateFilters[id];
      if (e.target.checked) {
        filters.uploadDate.push(dateFilter);
      } else {
        filters.uploadDate = filters.uploadDate.filter((d) => d !== dateFilter);
      }
      applyFilters();
      updateFilterBadge();
    });
  }
});

// Search functionality
const searchBar = document.querySelector(".search-bar");
searchBar.addEventListener("input", () => {
  applyFilters();
});

// ========================================
// UI Y UTILIDADES
// ========================================

// Actualizar badge de filtros activos
function updateFilterBadge() {
  const totalFilters =
    filters.platforms.length +
    filters.categories.length +
    filters.uploadDate.length +
    (filters.visto !== null ? 1 : 0);

  const contentHeader = document.querySelector(".content-header h1");
  const existingBadge = contentHeader.querySelector(".filter-badge");

  if (existingBadge) {
    existingBadge.remove();
  }

  if (totalFilters > 0) {
    const badge = document.createElement("span");
    badge.className = "filter-badge";
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

    const separate = contentHeader.querySelector(".separate");
    if (separate) {
      contentHeader.insertBefore(badge, separate);
    } else {
      contentHeader.appendChild(badge);
    }
  }
}

// Botón para limpiar filtros
function addClearFiltersButton() {
  const sidebar = document.querySelector(".sidebar");
  const clearButton = document.createElement("button");
  clearButton.textContent = "🗑️ Limpiar Filtros";
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

  clearButton.addEventListener("click", () => {
    filters.platforms = [];
    filters.categories = [];
    filters.uploadDate = [];
    filters.visto = null;

    document.querySelectorAll('.filter-option input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = false;
    });

    document.querySelectorAll('.filter-visto-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector('[data-visto="null"]')?.classList.add('active');

    applyFilters();
    updateFilterBadge();
  });

  sidebar.appendChild(clearButton);
}

// Agregar filtros de visto
function addVistoFilters() {
  const contentHeader = document.querySelector('.content-header');
  const filterDiv = document.createElement('div');
  filterDiv.className = 'video-filters';
  filterDiv.style.cssText = 'margin: 20px 0; display: flex; gap: 10px;';

  filterDiv.innerHTML = `
        <button class="filter-visto-btn active" data-visto="null" onclick="filtrarPorVisto(null)" style="padding: 8px 16px; background: #00d9ff; color: #0a0a0a; border: 1px solid #00d9ff; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;">
            Todos
        </button>
        <button class="filter-visto-btn" data-visto="true" onclick="filtrarPorVisto(true)" style="padding: 8px 16px; background: #2a2a2a; color: #fff; border: 1px solid #444; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;">
            ✓ Vistos
        </button>
        <button class="filter-visto-btn" data-visto="false" onclick="filtrarPorVisto(false)" style="padding: 8px 16px; background: #2a2a2a; color: #fff; border: 1px solid #444; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;">
            Por ver
        </button>
    `;

  contentHeader.appendChild(filterDiv);

  // Estilos hover
  document.querySelectorAll('.filter-visto-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      if (!btn.classList.contains('active')) {
        btn.style.background = '#3a3a3a';
        btn.style.borderColor = '#00d9ff';
      }
    });
    btn.addEventListener('mouseleave', () => {
      if (!btn.classList.contains('active')) {
        btn.style.background = '#2a2a2a';
        btn.style.borderColor = '#444';
      }
    });
  });
}

// Sistema de notificaciones
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === "success" ? "#00d9ff" : "#ff4444"};
    color: ${type === "success" ? "#0a0a0a" : "#ffffff"};
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    z-index: 10001;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s;
  `;

  const style = document.createElement("style");
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

// Función para eliminar video
async function deleteVideo(videoId) {
  const confirmed = await showConfirmModal(
    "¿Eliminar video?",
    "¿Estás seguro de que quieres eliminar este video? Esta acción no se puede deshacer."
  );

  if (!confirmed) return;

  try {
    const response = await fetch(`${API_URL}/videos/${videoId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.clear();
      window.location.href = "/registro.html";
      return;
    }

    if (!response.ok) {
      throw new Error("Error al eliminar el video");
    }

    videos = videos.filter((v) => v.idVideo !== videoId);
    applyFilters();
    showNotification("✅ Video eliminado correctamente", "success");
  } catch (error) {
    console.error("Error al eliminar video:", error);
    showNotification("❌ Error al eliminar el video", "error");
  }
}

// Modal de confirmación
function showConfirmModal(title, message) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.7); display: flex;
      align-items: center; justify-content: center; z-index: 10000;
    `;

    const modal = document.createElement("div");
    modal.style.cssText = `
      background: #1a1a1a; border: 2px solid #333; border-radius: 16px;
      padding: 30px; max-width: 400px; width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    `;

    modal.innerHTML = `
      <h3 style="color: #00d9ff; margin: 0 0 15px 0; font-size: 22px;">${title}</h3>
      <p style="color: #ccc; margin: 0 0 25px 0;">${message}</p>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="cancelBtn" style="padding: 10px 20px; background: transparent; color: #aaa; border: 2px solid #444; border-radius: 8px; cursor: pointer; font-weight: 600;">Cancelar</button>
        <button id="confirmBtn" style="padding: 10px 20px; background: #ff4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Eliminar</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modal.querySelector("#confirmBtn").addEventListener("click", () => {
      document.body.removeChild(overlay);
      resolve(true);
    });

    modal.querySelector("#cancelBtn").addEventListener("click", () => {
      document.body.removeChild(overlay);
      resolve(false);
    });
  });
}

function handleLogout() {
  if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
    localStorage.clear();
    showNotification("👋 Sesión cerrada correctamente", "success");
    setTimeout(() => {
      window.location.href = "/registro.html";
    }, 1000);
  }
}

// ========================================
// INICIALIZACIÓN
// ========================================

// Obtener nombre de usuario
const nombreUsuario = localStorage.getItem("username") || "Usuario";
document.getElementById("usuario").textContent = nombreUsuario;

const profileBtn = document.querySelector(".profile-btn");
if (profileBtn) {
  const primeraLetra = nombreUsuario.charAt(0).toUpperCase();
  profileBtn.textContent = primeraLetra;
  profileBtn.setAttribute("aria-label", `Perfil de ${nombreUsuario}`);
}

// Inicializar
generateVideoCards();
addClearFiltersButton();
addVistoFilters();

// Exponer funciones globalmente
window.toggleVideoVisto = toggleVideoVisto;
window.filtrarPorVisto = filtrarPorVisto;
window.deleteVideo = deleteVideo;
window.handleLogout = handleLogout;