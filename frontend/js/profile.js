 // Upload photo functionality
        function uploadPhoto() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const profilePic = document.getElementById('profilePicture');
                        profilePic.style.backgroundImage = `url(${event.target.result})`;
                        profilePic.style.backgroundSize = 'cover';
                        profilePic.style.backgroundPosition = 'center';
                        profilePic.textContent = '';
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        }

        // Remove photo functionality
        function removePhoto() {
            const profilePic = document.getElementById('profilePicture');
            profilePic.style.backgroundImage = '';
            profilePic.textContent = 'U';
        }

        // Change password functionality
        function changePassword() {
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!currentPassword || !newPassword || !confirmPassword) {
                alert('Please fill in all password fields');
                return;
            }

            if (newPassword !== confirmPassword) {
                alert('New passwords do not match');
                return;
            }

            if (newPassword.length < 8) {
                alert('Password must be at least 8 characters long');
                return;
            }

            // Simulate password change
            alert('Password changed successfully!');
            document.getElementById('securityForm').reset();
        }

        // Save changes functionality
        function saveChanges() {
            const successMessage = document.getElementById('successMessage');
            successMessage.classList.add('show');
            
            // Scroll to top to show message
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Hide message after 3 seconds
            setTimeout(() => {
                successMessage.classList.remove('show');
            }, 3000);
        }

        // Cancel changes functionality
        function cancelChanges() {
            if (confirm('Are you sure you want to discard all changes?')) {
                window.location.href = 'index.html';
            }
        }

        // Deactivate account functionality
        function deactivateAccount() {
            if (confirm('Are you sure you want to deactivate your account? You can reactivate it later by logging in.')) {
                alert('Account deactivated. You will be redirected to the login page.');
                // Redirect logic would go here
            }
        }

        // Delete account functionality
        function deleteAccount() {
            const confirmation = prompt('This action cannot be undone. Type "DELETE" to confirm:');
            if (confirmation === 'DELETE') {
                alert('Account deleted. All your data has been permanently removed.');
                // Delete logic would go here
            } else if (confirmation !== null) {
                alert('Account deletion cancelled. Please type "DELETE" exactly to confirm.');
            }
        }

        // Update profile picture initial based on username
        window.addEventListener('DOMContentLoaded', () => {
            const username = document.getElementById('username').value;
            if (username) {
                document.getElementById('profilePicture').textContent = username.charAt(0).toUpperCase();
            }
        });