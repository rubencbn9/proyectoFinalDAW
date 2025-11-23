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
    console.log("URL del video:", video.url);
    console.log("Fuente:", video.fuente);

    // Actualizar elementos existentes en el HTML
    document.querySelector(".video-title").textContent = video.titulo;
    document.querySelector(".video-description").textContent =
      video.descripcion || "Sin descripción";

    const videoPlayerContainer = document.getElementById("videoPlayer");
    if (!videoPlayerContainer) {
      throw new Error("Contenedor #videoPlayer no encontrado en el HTML.");
    }

    const embedResult = await generateEmbedCode(video.url, video.fuente);

    console.log("Embed result:", embedResult);
    console.log("Platform detectada:", embedResult.detectedPlatform);

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

    // === SISTEMA DE MARCADORES Y NOTAS ===
    const markersList = document.getElementById("markersList");
    const notesArea = document.getElementById("notesArea");
    const markerLabel = document.getElementById("markerLabel");
    const addMarkerBtn = document.getElementById("addMarkerBtn");
    const saveNotesBtn = document.getElementById("saveNotesBtn");

    let markers = [];
    let savedNotes = "";

    // Cargar datos desde storage persistente
    await loadStoredData();

    async function loadStoredData() {
      try {
        // Cargar marcadores
        const markersData = await window.storage.get(`videoMarkers_${videoId}`);
        if (markersData && markersData.value) {
          markers = JSON.parse(markersData.value);
        }

        // Cargar notas
        const notesData = await window.storage.get(`videoNotes_${videoId}`);
        if (notesData && notesData.value) {
          savedNotes = notesData.value;
          if (notesArea) {
            notesArea.value = savedNotes;
          }
        }
      } catch (error) {
        console.log('No hay datos guardados previamente:', error);
        // Intentar con localStorage como fallback
        try {
          const localMarkers = localStorage.getItem(`videoMarkers_${videoId}`);
          const localNotes = localStorage.getItem(`videoNotes_${videoId}`);

          if (localMarkers) markers = JSON.parse(localMarkers);
          if (localNotes) {
            savedNotes = localNotes;
            if (notesArea) notesArea.value = savedNotes;
          }
        } catch (e) {
          console.log('No hay datos en localStorage');
        }
      }
    }

    renderMarkers();

    function renderMarkers() {
      if (!markersList) return;

      markersList.innerHTML = "";

      markers.forEach((marker, index) => {
        const li = document.createElement("li");
        li.style.cssText = "padding: 10px; background: #2a2a2a; margin-bottom: 8px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;";

        li.innerHTML = `
          <span style="color: #00d9ff; cursor: pointer;" class="marker-time">${marker.time}</span>
          <span style="flex: 1; margin: 0 15px; color: #fff;">${marker.label}</span>
          <button class="delete-marker" data-index="${index}" style="background: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Eliminar</button>
        `;

        markersList.appendChild(li);
      });

      document.querySelectorAll(".marker-time").forEach((el, index) => {
        el.addEventListener("click", () => {
          jumpToTime(markers[index].time);
        });
      });

      document.querySelectorAll(".delete-marker").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const index = parseInt(e.target.dataset.index);
          deleteMarker(index);
        });
      });
    }

    if (addMarkerBtn) {
      addMarkerBtn.addEventListener("click", async () => {
        const currentTime = getCurrentTime();
        const label = markerLabel ? markerLabel.value.trim() : "";

        if (!label) {
          alert("Por favor, escribe una etiqueta para el marcador");
          return;
        }

        markers.push({
          time: currentTime,
          label: label,
        });

        try {
          await window.storage.set(`videoMarkers_${videoId}`, JSON.stringify(markers));
          console.log('Marcadores guardados correctamente');
        } catch (error) {
          console.error('Error al guardar marcadores:', error);
          localStorage.setItem(`videoMarkers_${videoId}`, JSON.stringify(markers));
        }

        if (markerLabel) {
          markerLabel.value = "";
        }

        renderMarkers();
        alert("Marcador agregado y guardado");
      });
    }

    function deleteMarker(index) {
      if (confirm("¿Eliminar este marcador?")) {
        markers.splice(index, 1);

        window.storage.set(`videoMarkers_${videoId}`, JSON.stringify(markers))
          .catch(error => {
            console.error('Error al guardar:', error);
            localStorage.setItem(`videoMarkers_${videoId}`, JSON.stringify(markers));
          });

        renderMarkers();
      }
    }

    if (saveNotesBtn) {
      saveNotesBtn.addEventListener("click", async () => {
        if (notesArea) {
          const notesContent = notesArea.value;

          try {
            const result = await window.storage.set(`videoNotes_${videoId}`, notesContent);

            if (result) {
              console.log('Notas guardadas correctamente:', result);
              alert('✅ Notas guardadas correctamente');
            } else {
              throw new Error('No se recibió confirmación del guardado');
            }
          } catch (error) {
            console.error('Error al guardar notas:', error);
            localStorage.setItem(`videoNotes_${videoId}`, notesContent);
            alert('⚠️ Notas guardadas localmente (solo en este navegador)');
          }
        }
      });
    }

    function getCurrentTime() {
      const youtubeIframe = document.querySelector('iframe[src*="youtube.com"]');
      if (youtubeIframe) {
        const manualTime = prompt("Introduce el tiempo actual (MM:SS):", "00:00");
        return manualTime || "00:00";
      }

      const videoEl = document.querySelector("video");
      if (videoEl) {
        const seconds = Math.floor(videoEl.currentTime);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      }

      const manualTime = prompt("Introduce el tiempo actual (MM:SS):", "00:00");
      return manualTime || "00:00";
    }

    function jumpToTime(timeString) {
      const [mins, secs] = timeString.split(":").map(Number);
      const totalSeconds = mins * 60 + secs;

      const videoEl = document.querySelector("video");
      if (videoEl) {
        videoEl.currentTime = totalSeconds;
        return;
      }

      alert(`Salta manualmente a: ${timeString}`);
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

      console.log("Generando embed para plataforma:", platform);
      console.log("URL recibida:", url);

      switch (platform) {
        case "youtube":
          return generateYouTubeEmbed(url);
        case "vimeo":
          return generateVimeoEmbed(url);
        case "dailymotion":
          return generateDailymotionEmbed(url);
        case "twitch":
          return generateTwitchEmbed(url);
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
      if (urlLower.match(/\.(mp4|webm|ogg)$/i)) return "direct";

      return fuente || "unknown";
    }

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
            height="500" 
            src="https://www.youtube.com/embed/${videoId}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
            style="border-radius: 12px;">
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
            height="500" 
            frameborder="0" 
            allow="autoplay; fullscreen; picture-in-picture" 
            allowfullscreen
            style="border-radius: 12px;">
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
            height="500" 
            src="https://www.dailymotion.com/embed/video/${videoId}" 
            allowfullscreen 
            allow="autoplay"
            style="border-radius: 12px;">
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
            height="500" 
            width="100%" 
            allowfullscreen
            style="border-radius: 12px;">
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
            height="500" 
            controls 
            style="border-radius: 12px; background: #000;">
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