// profilePictureLoader.js
// Utility function to load and display user profile picture in header

async function loadHeaderProfilePicture() {
    const token = localStorage.getItem('token') || localStorage.getItem('jwtToken');
    if (!token) return;

    try {
        const response = await fetch('http://localhost:9000/api/auth/me', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) return;

        const usuario = await response.json();
        const profileBtn = document.querySelector('.profile-btn');

        if (profileBtn && usuario.profilePicture) {
            const UPLOAD_URL = 'http://localhost:9000/uploads';
            profileBtn.innerHTML = `<img src="${UPLOAD_URL}/${usuario.profilePicture}" alt="Perfil">`;
            profileBtn.classList.add('has-image');
        }
    } catch (error) {
        console.log('No se pudo cargar la foto de perfil');
    }
}

// Auto-load when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeaderProfilePicture);
} else {
    loadHeaderProfilePicture();
}
