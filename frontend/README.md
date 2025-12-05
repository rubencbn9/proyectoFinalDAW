# VideoVault

VideoVault es una aplicación web para gestionar y explorar videos de múltiples plataformas (YouTube, TikTok, Vimeo, Dailymotion) en un solo lugar. Permite a los usuarios organizar su colección de videos, filtrar por categorías y realizar un seguimiento de lo que han visto.

## Características Principales

- **Exploración de Videos**: Visualiza videos de diversas fuentes en una interfaz unificada.
- **Filtrado Avanzado**:
  - **Plataforma**: Filtra por YouTube, TikTok, Vimeo, Dailymotion.
  - **Categoría**: Música, Gaming, Educación, Entretenimiento, Deportes.
  - **Fecha de Subida**: Hoy, Esta semana, Este mes.
  - **Estado**: Filtra por videos vistos o pendientes.
- **Gestión de Estado**: Marca videos como "Visto" o "Por ver" con un solo clic.
- **Gestión de Contenido**: Elimina videos de tu colección.
- **Búsqueda**: Busca videos por título o descripción en tiempo real.
- **Autenticación**: Sistema de registro e inicio de sesión para guardar tus preferencias y colección.
- **Perfil de Usuario**: Acceso a información de perfil.

## Tecnologías Utilizadas

- **Frontend**:
  - HTML5
  - CSS3 (Diseño responsivo y moderno)
  - JavaScript (Vanilla ES6+)
- **Backend** (Requerido):
  - API RESTful corriendo en `http://localhost:9000/api`

## Instalación y Uso

1. **Clonar el repositorio** (si aplica) o descargar los archivos.
2. **Backend**: Asegúrate de que el servidor backend esté ejecutándose en el puerto 9000.
3. **Frontend**:
   - Puedes abrir el archivo `index.html` directamente en tu navegador, aunque se recomienda usar un servidor local (como Live Server en VS Code) para evitar problemas de CORS y rutas.
   - Si usas VS Code, instala la extensión "Live Server", haz clic derecho en `index.html` y selecciona "Open with Live Server".

## Estructura del Proyecto

- `index.html`: Página principal con el grid de videos y filtros.
- `registro.html`: Página de inicio de sesión y registro.
- `nuevoVideo.html`: Formulario para añadir nuevos videos.
- `profile.html`: Página de perfil de usuario.
- `videoPlay.html`: Reproductor de video individual.
- `css/`: Estilos de la aplicación.
- `js/`: Lógica de la aplicación (`main.js` contiene la lógica principal).

## Notas

- La aplicación requiere autenticación. Si no hay un token válido, redirigirá automáticamente a la página de registro.
- Los videos se cargan dinámicamente desde la API.
