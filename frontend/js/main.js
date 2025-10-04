
        // Sample video data
        const videos = [
            { title: "Amazing Nature Documentary", platform: "youtube", views: "2.5M", duration: "15:30" },
            { title: "Quick Cooking Tutorial", platform: "tiktok", views: "850K", duration: "0:45" },
            { title: "Creative Design Process", platform: "vimeo", views: "125K", duration: "8:20" },
            { title: "Tech Review 2024", platform: "youtube", views: "1.2M", duration: "12:15" },
            { title: "Dance Challenge Compilation", platform: "tiktok", views: "3.8M", duration: "1:30" },
            { title: "Short Film: The Journey", platform: "vimeo", views: "450K", duration: "22:45" },
            { title: "Gaming Highlights", platform: "youtube", views: "980K", duration: "18:50" },
            { title: "DIY Home Improvement", platform: "youtube", views: "560K", duration: "10:25" },
            { title: "Fashion Trends 2024", platform: "tiktok", views: "1.5M", duration: "0:58" },
            { title: "Music Video: Neon Dreams", platform: "vimeo", views: "2.1M", duration: "4:12" },
            { title: "Fitness Workout Routine", platform: "youtube", views: "720K", duration: "25:00" },
            { title: "Comedy Sketch", platform: "tiktok", views: "4.2M", duration: "1:15" }
        ];

        // Generate video cards
        function generateVideoCards() {
            const videoGrid = document.getElementById('videoGrid');
            videoGrid.innerHTML = '';

            videos.forEach((video, index) => {
                const card = document.createElement('div');
                card.className = 'video-card';
                card.innerHTML = `
                    <div class="video-thumbnail">
                        <img src="/placeholder.svg?height=180&width=320" alt="${video.title}">
                        <span class="video-platform platform-${video.platform}">${video.platform}</span>
                    </div>
                    <div class="video-info">
                        <h3 class="video-title">${video.title}</h3>
                        <div class="video-meta">
                            <span>👁 ${video.views}</span>
                            <span>⏱ ${video.duration}</span>
                        </div>
                    </div>
                `;
                videoGrid.appendChild(card);
            });
        }

        // Search functionality
        const searchBar = document.querySelector('.search-bar');
        searchBar.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredVideos = videos.filter(video => 
                video.title.toLowerCase().includes(searchTerm)
            );
            
            const videoGrid = document.getElementById('videoGrid');
            videoGrid.innerHTML = '';
            
            filteredVideos.forEach(video => {
                const card = document.createElement('div');
                card.className = 'video-card';
                card.innerHTML = `
                    <div class="video-thumbnail">
                        <img src="/placeholder.svg?height=180&width=320" alt="${video.title}">
                        <span class="video-platform platform-${video.platform}">${video.platform}</span>
                    </div>
                    <div class="video-info">
                        <h3 class="video-title">${video.title}</h3>
                        <div class="video-meta">
                            <span>👁 ${video.views}</span>
                            <span>⏱ ${video.duration}</span>
                        </div>
                    </div>
                `;
                videoGrid.appendChild(card);
            });
        });

        // Filter functionality
        const filterCheckboxes = document.querySelectorAll('.filter-option input[type="checkbox"]');
        filterCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                console.log(`Filter ${checkbox.id} is now ${checkbox.checked ? 'checked' : 'unchecked'}`);
                // Add your filter logic here
            });
        });

        // Initialize
        generateVideoCards();
