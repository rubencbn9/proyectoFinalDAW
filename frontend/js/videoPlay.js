const API_URL = 'http://localhost:9000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// Marcar video como visto
async function marcarComoVisto(videoId) {
  try {
    const response = await fetch(`${API_URL}/videos/${videoId}/marcar-visto`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Error al marcar video como visto');
    }

    const video = await response.json();
    console.log('✅ Video marcado como visto:', video);

    return video;

  } catch (error) {
    console.error('Error al marcar como visto:', error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const videoId = params.get("id");

  if (!videoId) {
    alert("Video no encontrado");
    return;
  }

  // Marcar automáticamente como visto después de 5 segundos
  setTimeout(() => {
    console.log('Marcando video como visto...');
    marcarComoVisto(videoId);
  }, 5000);

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/videos/${videoId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error ${response.status} al cargar el video: ${errorText.substring(0, 100)}`
      );
    }

    const video = await response.json();

    console.log("Video data:", video);

    // Actualizar elementos existentes en el HTML
    document.querySelector(".video-title").textContent = video.titulo;
    document.querySelector(".video-description").textContent =
      video.descripcion || "Sin descripción";

    const videoPlayerContainer = document.getElementById("videoPlayer");
    if (!videoPlayerContainer) {
      throw new Error("Contenedor #videoPlayer no encontrado en el HTML.");
    }

    const embedResult = await generateEmbedCode(video.url, video.fuente);

    if (embedResult.html) {
      console.log("Insertando HTML del video...");
      videoPlayerContainer.innerHTML = embedResult.html;

      if (embedResult.needsScript) {
        loadEmbedScript(embedResult.scriptUrl);
      }
    } else {
      videoPlayerContainer.innerHTML = `
        <div style="background: #1a1a1a; padding: 40px; text-align: center; border-radius: 12px;">
          <p style="color: #ff4444; margin-bottom: 15px;">⚠️ No se puede reproducir este video directamente</p>
          <p style="color: #888; font-size: 14px; margin-bottom: 20px;">${embedResult.message}</p>
          <a href="${video.url}" target="_blank" style="display: inline-block; background: #00d9ff; color: #0a0a0a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ver video en ${embedResult.platform || "la plataforma original"}</a>
        </div>
      `;
    }

    // Mostrar categoría y fuente
    const videoInfo = document.querySelector(".video-info");
    if (videoInfo) {
      const categoryElement = document.createElement("p");
      const categoryName = video.categoria && video.categoria.nombre ? video.categoria.nombre : "N/A";
      categoryElement.innerHTML = `<strong>Categoría:</strong> ${categoryName} | <strong>Fuente:</strong> ${embedResult.detectedPlatform || video.fuente}`;
      videoInfo.appendChild(categoryElement);
    }

    // Obtener nombre del usuario
    const nombreUsuario = localStorage.getItem("nombre") || localStorage.getItem("username") || "Usuario";

    const userNameElement = document.getElementById("usuario");
    if (userNameElement) {
      userNameElement.textContent = nombreUsuario;
    }

    const profileBtn = document.querySelector(".profile-btn");
    if (profileBtn) {
      const inicial = nombreUsuario.charAt(0).toUpperCase();
      profileBtn.textContent = inicial;
      profileBtn.setAttribute("aria-label", `Perfil de ${nombreUsuario}`);
    }

    // ========================================
    // SISTEMA DE MOMENTOS DESTACADOS
    // ========================================

    const momentosList = document.getElementById("markersList");
    const notesArea = document.getElementById("notesArea");
    const markerLabel = document.getElementById("markerLabel");
    const addMarkerBtn = document.getElementById("addMarkerBtn");
    const saveNotesBtn = document.getElementById("saveNotesBtn");

    let momentos = [];
    let savedNotes = "";

    // Cargar momentos y notas
    await loadMomentos();
    await loadNotas();

    async function loadMomentos() {
      try {
        const data = await window.storage.get(`videoMomentos_${videoId}`);
        if (data && data.value) {
          momentos = JSON.parse(data.value);
        }
      } catch (error) {
        console.log('Intentando cargar desde localStorage...');
        const local = localStorage.getItem(`videoMomentos_${videoId}`);
        if (local) momentos = JSON.parse(local);
      }
      renderMomentos();
    }

    async function loadNotas() {
      try {
        const notesData = await window.storage.get(`videoNotes_${videoId}`);
        if (notesData && notesData.value) {
          savedNotes = notesData.value;
          if (notesArea) {
            notesArea.value = savedNotes;
          }
        }
      } catch (error) {
        const localNotes = localStorage.getItem(`videoNotes_${videoId}`);
        if (localNotes && notesArea) {
          notesArea.value = localNotes;
        }
      }
    }

    function renderMomentos() {
      if (!momentosList) return;

      momentosList.innerHTML = "";

      if (momentos.length === 0) {
        momentosList.innerHTML = `
          <div style="text-align: center; padding: 30px 20px; color: #666; background: #0a0a0a; border-radius: 8px; border: 2px dashed #2a2a2a;">
            <div style="font-size: 48px; margin-bottom: 10px; opacity: 0.5;">📝</div>
            <p style="font-size: 15px; font-weight: 600; margin-bottom: 5px; color: #888;">No hay momentos destacados</p>
            <p style="font-size: 13px; color: #666;">Agrega timestamps importantes del video para recordar momentos clave</p>
          </div>
        `;
        return;
      }

      momentos.forEach((momento, index) => {
        const li = document.createElement("li");
        li.style.cssText = `
          padding: 15px;
          background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
          margin-bottom: 12px;
          border-radius: 8px;
          border-left: 4px solid #00d9ff;
          transition: all 0.3s ease;
          cursor: pointer;
          list-style: none;
        `;

        li.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                <span style="background: #00d9ff; color: #0a0a0a; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 700;">
                  ⏱️ ${momento.time}
                </span>
                <span style="color: #666; font-size: 11px;">
                  ${momento.fecha ? new Date(momento.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : ''}
                </span>
              </div>
              <h4 style="color: #fff; margin: 0 0 5px 0; font-size: 15px; font-weight: 600;">
                ${momento.titulo}
              </h4>
              ${momento.descripcion ? `
                <p style="color: #888; font-size: 13px; margin: 0; line-height: 1.4;">
                  ${momento.descripcion}
                </p>
              ` : ''}
              ${momento.tags && momento.tags.length > 0 ? `
                <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px;">
                  ${momento.tags.map(tag => `
                    <span style="background: #333; color: #00d9ff; padding: 3px 8px; border-radius: 10px; font-size: 11px;">
                      #${tag}
                    </span>
                  `).join('')}
                </div>
              ` : ''}
            </div>
            <button 
              class="delete-momento" 
              data-index="${index}"
              style="background: rgba(255, 68, 68, 0.2); color: #ff4444; border: 1px solid #ff4444; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.3s ease; flex-shrink: 0; margin-left: 10px;"
              title="Eliminar momento">
              🗑️
            </button>
          </div>
        `;

        li.addEventListener('mouseenter', () => {
          li.style.background = 'linear-gradient(135deg, #333 0%, #222 100%)';
          li.style.transform = 'translateX(5px)';
        });
        li.addEventListener('mouseleave', () => {
          li.style.background = 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)';
          li.style.transform = 'translateX(0)';
        });

        momentosList.appendChild(li);
      });

      document.querySelectorAll(".delete-momento").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const index = parseInt(e.target.dataset.index);
          if (confirm("¿Eliminar este momento destacado?")) {
            momentos.splice(index, 1);
            await saveMomentos();
            renderMomentos();
            showNotification("🗑️ Momento eliminado", "success");
          }
        });

        btn.addEventListener('mouseenter', (e) => {
          e.target.style.background = '#ff4444';
          e.target.style.color = 'white';
        });
        btn.addEventListener('mouseleave', (e) => {
          e.target.style.background = 'rgba(255, 68, 68, 0.2)';
          e.target.style.color = '#ff4444';
        });
      });
    }

    async function addMomento() {
      const timeInput = document.getElementById("markerLabel");
      if (!timeInput) return;

      const titulo = timeInput.value.trim();
      if (!titulo) {
        showNotification("⚠️ Por favor, escribe un título para el momento", "error");
        return;
      }

      const time = prompt("⏱️ Timestamp del momento (MM:SS):", "00:00");
      if (!time) return;

      if (!/^\d{1,2}:\d{2}$/.test(time)) {
        showNotification("⚠️ Formato de tiempo inválido. Usa MM:SS", "error");
        return;
      }

      const descripcion = prompt("📝 Descripción (opcional):", "");
      const tagsInput = prompt("🏷️ Tags separados por comas (opcional):", "");
      const tags = tagsInput ? tagsInput.split(",").map(t => t.trim()).filter(t => t) : [];

      const momento = {
        time: time,
        titulo: titulo,
        descripcion: descripcion || "",
        tags: tags,
        fecha: new Date().toISOString()
      };

      momentos.push(momento);
      momentos.sort((a, b) => {
        const [minsA, secsA] = a.time.split(':').map(Number);
        const [minsB, secsB] = b.time.split(':').map(Number);
        return (minsA * 60 + secsA) - (minsB * 60 + secsB);
      });

      await saveMomentos();
      timeInput.value = "";
      renderMomentos();
      showNotification("✅ Momento destacado agregado", "success");
    }

    async function saveMomentos() {
      try {
        await window.storage.set(`videoMomentos_${videoId}`, JSON.stringify(momentos));
        console.log('✅ Momentos guardados en storage');
      } catch (error) {
        console.log('Guardando en localStorage como fallback');
        localStorage.setItem(`videoMomentos_${videoId}`, JSON.stringify(momentos));
      }
    }

    if (addMarkerBtn) addMarkerBtn.addEventListener("click", addMomento);

    if (saveNotesBtn) {
      saveNotesBtn.addEventListener("click", async () => {
        if (notesArea) {
          const notesContent = notesArea.value;
          try {
            const result = await window.storage.set(`videoNotes_${videoId}`, notesContent);
            if (result) {
              console.log('✅ Notas guardadas correctamente');
              showNotification("✅ Notas guardadas correctamente", "success");
            } else {
              throw new Error('No se recibió confirmación del guardado');
            }
          } catch (error) {
            console.error('Error al guardar notas:', error);
            localStorage.setItem(`videoNotes_${videoId}`, notesContent);
            showNotification("⚠️ Notas guardadas localmente", "success");
          }
        }
      });
    }

    function showNotification(message, type) {
      const notif = document.createElement('div');
      notif.textContent = message;
      notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#00d9ff' : '#ff4444'};
        color: ${type === 'success' ? '#0a0a0a' : '#fff'};
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease;
      `;

      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      if (!document.getElementById('notification-style')) {
        style.id = 'notification-style';
        document.head.appendChild(style);
      }

      document.body.appendChild(notif);
      setTimeout(() => notif.remove(), 3000);
    }

    // === FUNCIONES DE EMBED ===

    function loadEmbedScript(scriptUrl) {
      if (!scriptUrl) return;
      if (document.querySelector(`script[src="${scriptUrl}"]`)) return;

      const script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      document.body.appendChild(script);
    }

    async function generateEmbedCode(url, fuente) {
      const platform = detectPlatform(url, fuente);

      switch (platform) {
        case "youtube":
          return generateYouTubeEmbed(url);
        case "vimeo":
          return generateVimeoEmbed(url);
        case "dailymotion":
          return generateDailymotionEmbed(url);
        case "twitch":
          return generateTwitchEmbed(url);
        // === NUEVO: CASO TIKTOK ===
        case "tiktok":
          return generateTikTokEmbed(url);
        case "direct":
          return generateDirectVideoEmbed(url);
        default:
          return {
            html: null,
            message: "Plataforma no soportada para reproducción directa",
            platform: platform,
            detectedPlatform: platform,
          };
      }
    }

    function detectPlatform(url, fuente) {
      const urlLower = url.toLowerCase();

      if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) return "youtube";
      if (urlLower.includes("vimeo.com")) return "vimeo";
      if (urlLower.includes("dailymotion.com")) return "dailymotion";
      if (urlLower.includes("twitch.tv")) return "twitch";
      // === NUEVO: DETECCIÓN TIKTOK ===
      if (urlLower.includes("tiktok.com")) return "tiktok";

      if (urlLower.match(/\.(mp4|webm|ogg)$/i)) return "direct";

      return fuente || "unknown";
    }

    // === TIKTOK EMBED (NUEVO) ===
    function generateTikTokEmbed(url) {
      const videoId = extractTikTokId(url);

      if (!videoId) {
        return {
          html: null,
          message: "No se pudo extraer el ID del video de TikTok",
          platform: "tiktok",
        };
      }

      // TikTok v2 embed (vertical, centrado, responsivo móvil)
      return {
        html: `
          <iframe 
            src="https://www.tiktok.com/embed/v2/${videoId}" 
            width="100%" 
            frameborder="0" 
            allowfullscreen
            style="border-radius: 12px; aspect-ratio: 9/16; display: block; max-width: 325px; margin: 0 auto;">
          </iframe>
        `,
        needsScript: false,
        detectedPlatform: "TikTok",
      };
    }

    function extractTikTokId(url) {
      const match = url.match(/video\/(\d+)/);
      return match ? match[1] : null;
    }

    // === OTRAS PLATAFORMAS===

    function generateYouTubeEmbed(url) {
      const videoId = extractYouTubeId(url);

      if (!videoId) {
        return {
          html: null,
          message: "No se pudo extraer el ID del video de YouTube",
          platform: "youtube",
        };
      }

      return {
        html: `
          <iframe 
            width="100%" 
            src="https://www.youtube.com/embed/${videoId}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
            style="border-radius: 12px; aspect-ratio: 16/9; display: block;">
          </iframe>
        `,
        needsScript: false,
        detectedPlatform: "YouTube",
      };
    }

    function extractYouTubeId(url) {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
        /youtube\.com\/embed\/([^&\s]+)/,
        /youtube\.com\/v\/([^&\s]+)/,
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    }

    function generateVimeoEmbed(url) {
      const videoId = extractVimeoId(url);
      if (!videoId) {
        return {
          html: null,
          message: "No se pudo extraer el ID del video de Vimeo",
          platform: "vimeo",
        };
      }
      return {
        html: `
          <iframe 
            src="https://player.vimeo.com/video/${videoId}" 
            width="100%" 
            frameborder="0" 
            allow="autoplay; fullscreen; picture-in-picture" 
            allowfullscreen
            style="border-radius: 12px; aspect-ratio: 16/9; display: block;">
          </iframe>
        `,
        needsScript: false,
        detectedPlatform: "Vimeo",
      };
    }

    function extractVimeoId(url) {
      const match = url.match(/vimeo\.com\/(\d+)/);
      return match ? match[1] : null;
    }

    function generateDailymotionEmbed(url) {
      const videoId = extractDailymotionId(url);
      if (!videoId) {
        return {
          html: null,
          message: "No se pudo extraer el ID del video de Dailymotion",
          platform: "dailymotion",
        };
      }
      return {
        html: `
          <iframe 
            frameborder="0" 
            width="100%" 
            src="https://www.dailymotion.com/embed/video/${videoId}" 
            allowfullscreen 
            allow="autoplay"
            style="border-radius: 12px; aspect-ratio: 16/9; display: block;">
          </iframe>
        `,
        needsScript: false,
        detectedPlatform: "Dailymotion",
      };
    }

    function extractDailymotionId(url) {
      const match = url.match(/dailymotion\.com\/video\/([^_\s]+)/);
      return match ? match[1] : null;
    }

    function generateTwitchEmbed(url) {
      const channel = extractTwitchChannel(url);
      if (!channel) {
        return {
          html: null,
          message: "No se pudo extraer el canal de Twitch",
          platform: "twitch",
        };
      }
      return {
        html: `
          <iframe 
            src="https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}" 
            width="100%" 
            allowfullscreen
            style="border-radius: 12px; aspect-ratio: 16/9; display: block;">
          </iframe>
        `,
        needsScript: false,
        detectedPlatform: "Twitch",
      };
    }

    function extractTwitchChannel(url) {
      const match = url.match(/twitch\.tv\/([^\/\s]+)/);
      return match ? match[1] : null;
    }

    function generateDirectVideoEmbed(url) {
      let videoUrl = url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        videoUrl = `http://localhost:9000${url.startsWith("/") ? url : "/" + url}`;
      }

      return {
        html: `
          <video 
            width="100%" 
            controls 
            style="border-radius: 12px; background: #000; aspect-ratio: 16/9; display: block;">
            <source src="${videoUrl}" type="video/mp4">
            <source src="${videoUrl}" type="video/webm">
            <source src="${videoUrl}" type="video/ogg">
            Tu navegador no soporta el tag de video HTML5.
          </video>
        `,
        needsScript: false,
        detectedPlatform: "Video Directo",
      };
    }
  } catch (err) {
    console.error("Fallo general en la carga:", err);
    alert("Error al cargar el video: " + err.message);
  }
});