document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const videoId = params.get('id');

  if (!videoId) {
    document.getElementById('video-container').innerText = 'Video no encontrado';
    return;
  }

  try {
    const response = await fetch(`/api/videos/${videoId}`);
    if (!response.ok) throw new Error('Error al cargar el video');

    const video = await response.json();

    document.getElementById('video-container').innerHTML = `
      <div class="video-detail">
        <h1>${video.titulo}</h1>
        <iframe width="560" height="315" 
                src="${video.url}" 
                frameborder="0" 
                allowfullscreen>
        </iframe>
        <p>${video.descripcion || 'Sin descripción'}</p>
        <span>Categoría: ${video.categoria.nombre}</span>
      </div>
    `;
  } catch (err) {
    console.error(err);
    document.getElementById('video-container').innerText = 'Error al cargar el video';
  }
});
