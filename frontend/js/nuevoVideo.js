        // Tags functionality
        const tagInput = document.getElementById('tagInput');
        const tagsContainer = document.getElementById('tagsContainer');
        const tags = [];
        const MAX_TAGS = 10;

        tagInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const tagValue = this.value.trim();
                
                if (tagValue && tags.length < MAX_TAGS && !tags.includes(tagValue)) {
                    addTag(tagValue);
                    this.value = '';
                }
            }
        });

        function addTag(tagValue) {
            tags.push(tagValue);
            
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                ${tagValue}
                <span class="tag-remove" onclick="removeTag('${tagValue}', this)">×</span>
            `;
            
            tagsContainer.insertBefore(tagElement, tagInput);
        }

        function removeTag(tagValue, element) {
            const index = tags.indexOf(tagValue);
            if (index > -1) {
                tags.splice(index, 1);
            }
            element.parentElement.remove();
        }

        // Video URL detection
        const videoUrlInput = document.getElementById('videoUrl');
        const videoPreview = document.getElementById('videoPreview');
        const platformInfo = document.getElementById('platformInfo');

        videoUrlInput.addEventListener('input', function() {
            const url = this.value.trim();
            
            if (url) {
                const platform = detectPlatform(url);
                if (platform) {
                    platformInfo.textContent = `Platform: ${platform}`;
                    videoPreview.classList.add('active');
                } else {
                    videoPreview.classList.remove('active');
                }
            } else {
                videoPreview.classList.remove('active');
            }
        });

        function detectPlatform(url) {
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                return 'YouTube';
            } else if (url.includes('tiktok.com')) {
                return 'TikTok';
            } else if (url.includes('vimeo.com')) {
                return 'Vimeo';
            } else if (url.includes('dailymotion.com')) {
                return 'Dailymotion';
            } else if (url.includes('twitch.tv')) {
                return 'Twitch';
            }
            return null;
        }

        // Form submission
        const form = document.getElementById('addVideoForm');
        const submitBtn = document.getElementById('submitBtn');
        const successAlert = document.getElementById('successAlert');
        const errorAlert = document.getElementById('errorAlert');

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Hide previous alerts
            successAlert.classList.remove('active');
            errorAlert.classList.remove('active');
            
            // Disable submit button and show loading
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span>Añadiendo video...';
            

            const formData = {
             titulo: document.getElementById('videoTitle').value.trim(),
             url: document.getElementById('videoUrl').value.trim(),
             categoria: document.getElementById('videoCategory').value,
            descripcion: document.getElementById('videoDescription').value.trim(),
            fuente: detectPlatform(document.getElementById('videoUrl').value.trim()), // plataforma
            usuarioId: 1, // poner logica para obtener usuario que añade el video
            fechaGuardado: new Date().toISOString() 
            };

            try {
                // Send POST request to backend
                const response = await fetch('http://localhost:9000/api/videos/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(' Video added successfully:', data);
                    
                    // Show success message
                    successAlert.classList.add('active');
                    
                    // Reset form
                    form.reset();
                    tags.length = 0;
                    document.querySelectorAll('.tag').forEach(tag => tag.remove());
                    videoPreview.classList.remove('active');
                    
                    // Scroll to top to show success message 
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    
                    // Redirect to home after 2 seconds
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                } else {
                    throw new Error('Failed to add video');
                }
            } catch (error) {
                console.error(' Error adding video:', error);
                errorAlert.textContent = error.message || 'An error occurred. Please try again.';
                errorAlert.classList.add('active');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } finally {
                // Re-enable submit button
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Add Video';
            }
        });
