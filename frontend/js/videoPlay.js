document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const videoId = params.get('id');

  if (!videoId) {
    alert('Video no encontrado');
    return;
  }

  try {
    const response = await fetch(`http://localhost:9000/api/videos/${videoId}`);
    if (!response.ok) throw new Error('Error al cargar el video');

    const video = await response.json();

    // Actualizar elementos existentes en el HTML
    document.querySelector('.video-title').textContent = video.titulo;
    document.querySelector('.video-description').textContent = video.descripcion || 'Sin descripción';
    
    // Detectar tipo de video y renderizar apropiadamente
    const videoContainer = document.getElementById('videoPlayer').parentElement;
    const embedResult = await generateEmbedCode(video.url, video.fuente);
    
    if (embedResult.html) {
      videoContainer.innerHTML = embedResult.html;
      
      // Cargar scripts necesarios después de insertar HTML
      if (embedResult.needsScript) {
        loadEmbedScript(embedResult.scriptUrl);
      }
    } else {
      videoContainer.innerHTML = `
        <div style="background: #1a1a1a; padding: 40px; text-align: center; border-radius: 12px;">
          <p style="color: #ff4444; margin-bottom: 15px;">⚠️ No se puede reproducir este video directamente</p>
          <p style="color: #888; font-size: 14px; margin-bottom: 20px;">${embedResult.message}</p>
          <a href="${video.url}" target="_blank" style="display: inline-block; background: #00d9ff; color: #0a0a0a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ver video en ${embedResult.platform || 'la plataforma original'}</a>
        </div>
      `;
    }

    // Mostrar categoría y fuente
    const videoInfo = document.querySelector('.video-info');
    if (videoInfo) {
      const categoryElement = document.createElement('p');
      categoryElement.innerHTML = `<strong>Categoría:</strong> ${video.categoria} | <strong>Fuente:</strong> ${embedResult.detectedPlatform || video.fuente}`;
      videoInfo.appendChild(categoryElement);
    }

    const markersList = document.getElementById("markersList");
    const notesArea = document.getElementById("notesArea");
    const markerLabel = document.getElementById("markerLabel");

    let markers = JSON.parse(localStorage.getItem(`videoMarkers_${videoId}`)) || [];
    let savedNotes = localStorage.getItem(`videoNotes_${videoId}`) || "";

    notesArea.value = savedNotes;
    renderMarkers();

    // Función para cargar scripts de embed dinámicamente
    function loadEmbedScript(url) {
      const existingScript = document.querySelector(`script[src="${url}"]`);
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        document.body.appendChild(script);
      }
    }

    // Función para generar el código embed según la plataforma
    async function generateEmbedCode(url, fuente) {
      const baseId = 'videoPlayer';
      const width = '100%';
      const height = '500';

      // Detectar plataforma si no viene en 'fuente'
      const detectedPlatform = detectPlatform(url);
      const platform = (fuente && fuente !== '') ? fuente.toLowerCase() : detectedPlatform.toLowerCase();

      switch (platform) {
        case 'youtube':
          const ytId = extractYouTubeID(url);
          if (!ytId) return { html: null, message: 'No se pudo extraer el ID de YouTube' };
          return {
            html: `<iframe id="${baseId}" src="https://www.youtube.com/embed/${ytId}" width="${width}" height="${height}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`,
            detectedPlatform: 'YouTube'
          };
        
        case 'vimeo':
          const vimeoId = extractVimeoID(url);
          if (!vimeoId) return { html: null, message: 'No se pudo extraer el ID de Vimeo' };
          return {
            html: `<iframe id="${baseId}" src="https://player.vimeo.com/video/${vimeoId}" width="${width}" height="${height}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`,
            detectedPlatform: 'Vimeo'
          };
        
        case 'tiktok':
          // TikTok requiere oEmbed API para obtener el código embed correcto
          try {
            const tiktokEmbed = await fetchTikTokEmbed(url);
            if (tiktokEmbed) {
              return {
                html: `<div style="display: flex; justify-content: center;">${tiktokEmbed}</div>`,
                needsScript: true,
                scriptUrl: 'https://www.tiktok.com/embed.js',
                detectedPlatform: 'TikTok'
              };
            }
          } catch (err) {
            console.error('Error al cargar TikTok embed:', err);
          }
          return {
            html: null,
            message: 'TikTok no permite embeds directos. Usa el botón para ver el video.',
            platform: 'TikTok',
            detectedPlatform: 'TikTok'
          };
        
        case 'instagram':
          // Instagram bloquea iframes por X-Frame-Options
          // Necesitas usar oEmbed API
          return {
            html: null,
            message: 'Instagram no permite reproducción en iframes por políticas de seguridad.',
            platform: 'Instagram',
            detectedPlatform: 'Instagram'
          };
        
        case 'dailymotion':
          const dmId = extractDailymotionID(url);
          if (!dmId) return { html: null, message: 'No se pudo extraer el ID de Dailymotion' };
          return {
            html: `<iframe id="${baseId}" src="https://www.dailymotion.com/embed/video/${dmId}" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>`,
            detectedPlatform: 'Dailymotion'
          };
        
        case 'twitch':
          const twitchId = extractTwitchID(url);
          if (!twitchId) return { html: null, message: 'No se pudo extraer el ID de Twitch' };
          const twitchParent = window.location.hostname || 'localhost';
          return {
            html: `<iframe id="${baseId}" src="https://player.twitch.tv/?video=${twitchId}&parent=${twitchParent}" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>`,
            detectedPlatform: 'Twitch'
          };
        
        case 'directo':
        case 'mp4':
        case 'video':
          // Para videos directos (MP4, WebM, etc)
          return {
            html: `<video id="${baseId}" controls width="${width}" height="${height}" style="max-width: 100%;"><source src="${url}" type="video/mp4">Tu navegador no soporta el tag de video.</video>`,
            detectedPlatform: 'Video directo'
          };
        
        default:
          // Intentar como video directo
          if (url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)) {
            return {
              html: `<video id="${baseId}" controls width="${width}" height="${height}" style="max-width: 100%;"><source src="${url}">Tu navegador no soporta el tag de video.</video>`,
              detectedPlatform: 'Video directo'
            };
          }
          return {
            html: null,
            message: 'Formato de video no soportado',
            detectedPlatform: 'Desconocido'
          };
      }
    }

    // Función para obtener embed de TikTok via oEmbed
    async function fetchTikTokEmbed(url) {
      try {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
        const response = await fetch(oembedUrl);
        if (response.ok) {
          const data = await response.json();
          return data.html;
        }
      } catch (err) {
        console.error('Error fetching TikTok oEmbed:', err);
      }
      return null;
    }

    // Detectar plataforma desde URL
    function detectPlatform(url) {
      if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
      if (url.includes('vimeo.com')) return 'Vimeo';
      if (url.includes('tiktok.com')) return 'TikTok';
      if (url.includes('instagram.com') || url.includes('instagr.am')) return 'Instagram';
      if (url.includes('dailymotion.com')) return 'Dailymotion';
      if (url.includes('twitch.tv')) return 'Twitch';
      if (url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)) return 'directo';
      return 'desconocido';
    }

    // Extractores de ID para cada plataforma
    function extractYouTubeID(url) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    }

    function extractVimeoID(url) {
      const regExp = /vimeo\.com\/(?:video\/)?(\d+)/;
      const match = url.match(regExp);
      return match ? match[1] : null;
    }

    function extractDailymotionID(url) {
      const regExp = /dailymotion\.com\/video\/([a-zA-Z0-9]+)/;
      const match = url.match(regExp);
      return match ? match[1] : null;
    }

    function extractTwitchID(url) {
      const regExp = /twitch\.tv\/videos\/(\d+)/;
      const match = url.match(regExp);
      return match ? match[1] : null;
    }

    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    function saveNotes() {
      const notes = notesArea.value;
      localStorage.setItem(`videoNotes_${videoId}`, notes);
      showNotification("Notas guardadas correctamente");
    }

    function addTimeMarker() {
      const player = document.getElementById('videoPlayer');
      
      // Solo funciona con videos HTML5 directos
      if (player && player.tagName === 'VIDEO') {
        const currentTime = player.currentTime;
        const label = markerLabel.value.trim();

        if (!label) {
          showNotification("Por favor, ingresa una etiqueta para el marcador", "error");
          return;
        }

        const marker = {
          id: Date.now(),
          time: currentTime,
          label: label,
        };

        markers.push(marker);
        markers.sort((a, b) => a.time - b.time);
        localStorage.setItem(`videoMarkers_${videoId}`, JSON.stringify(markers));
        markerLabel.value = "";
        renderMarkers();
        showNotification("Marcador añadido correctamente");
      } else {
        showNotification("Los marcadores solo funcionan con videos directos (MP4)", "error");
      }
    }

    function renderMarkers() {
      if (markers.length === 0) {
        markersList.innerHTML = '<p style="color: #666; font-size: 13px; text-align: center; padding: 20px;">No hay marcadores aún</p>';
        return;
      }

      markersList.innerHTML = markers
        .map(
          (marker) => `
            <div class="marker-item" onclick="seekToTime(${marker.time})">
                <div class="marker-info">
                    <div class="marker-time">${formatTime(marker.time)}</div>
                    <div class="marker-label">${marker.label}</div>
                </div>
                <button class="marker-delete" onclick="event.stopPropagation(); deleteMarker(${marker.id})">
                    ❌
                </button>
            </div>
        `).join("");
    }

    window.seekToTime = function(time) {
      const player = document.getElementById('videoPlayer');
      if (player && player.tagName === 'VIDEO') {
        player.currentTime = time;
        player.play();
      } else {
        showNotification("Esta funcionalidad solo está disponible para videos directos", "error");
      }
    };

    window.deleteMarker = function(id) {
      markers = markers.filter(marker => marker.id !== id);
      localStorage.setItem(`videoMarkers_${videoId}`, JSON.stringify(markers));
      renderMarkers();
      showNotification("Marcador eliminado");
    };

    function showNotification(message, type = "success") {
      const notification = document.createElement("div");
      notification.textContent = message;
      notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background-color: ${type === "success" ? "#00d9ff" : "#ff4444"};
            color: ${type === "success" ? "#0a0a0a" : "#ffffff"};
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    }

    // Auto-save notes cada 30 segundos
    setInterval(() => {
      if (notesArea.value !== savedNotes) {
        savedNotes = notesArea.value;
        localStorage.setItem(`videoNotes_${videoId}`, savedNotes);
      }
    }, 30000);

    // Exponer función para botón de guardar notas si existe
    window.saveNotes = saveNotes;
    window.addTimeMarker = addTimeMarker;

  } catch (err) {
    console.error(err);
    alert('Error al cargar el video: ' + err.message);
  }
});