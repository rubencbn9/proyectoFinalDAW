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
    document.getElementById('videoPlayer').src = video.url;

    // Mostrar categoría (crea un elemento si no existe)
    const categoryElement = document.createElement('p');
    categoryElement.innerHTML = `<strong>Categoría:</strong> ${video.categoria}`;
    document.querySelector('.video-info').appendChild(categoryElement);

    const videoPlayer = document.getElementById("videoPlayer");
    const markersList = document.getElementById("markersList");
    const notesArea = document.getElementById("notesArea");
    const markerLabel = document.getElementById("markerLabel");

    let markers = JSON.parse(localStorage.getItem(`videoMarkers_${videoId}`)) || [];
    let savedNotes = localStorage.getItem(`videoNotes_${videoId}`) || "";

    notesArea.value = savedNotes;
    renderMarkers();

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
      const currentTime = videoPlayer.currentTime;
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
      videoPlayer.currentTime = time;
      videoPlayer.play();
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

  } catch (err) {
    console.error(err);
    alert('Error al cargar el video: ' + err.message);
  }
});