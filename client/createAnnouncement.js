document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = CONFIG.API_URL;
    const announcementForm = document.getElementById('announcement-form');
    const announcementsTbody = document.getElementById('announcements-tbody');
    const clearButton = document.querySelector('.btn-clear');

    // Load existing announcements on page load
    loadAnnouncements();

    // Handle form submission to add new announcements
    announcementForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // 1. Get values from the form
        const titleInput = document.getElementById('announcement-name');
        const contentInput = document.getElementById('announcement-content');
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        // Basic validation
        if (!title || !content) {
            alert('Please enter both title and content for the announcement.');
            return;
        }

        try {
            // 2. Send POST request to backend
            const response = await fetch(`${API_BASE_URL}/api/announcements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, content })
            });

            if (!response.ok) {
                throw new Error('Failed to create announcement');
            }

            const data = await response.json();
            
            // 3. Show success message
            alert('Announcement created successfully!');
            
            // 4. Reload announcements list
            loadAnnouncements();
            
            // 5. Clear the form
            announcementForm.reset();
            
        } catch (error) {
            console.error('Error creating announcement:', error);
            alert('Failed to create announcement. Please try again.');
        }
    });

    // Load all announcements from database
    async function loadAnnouncements() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/announcements`);
            if (!response.ok) throw new Error('Failed to fetch announcements');
            
            const announcements = await response.json();
            
            // Clear existing rows
            announcementsTbody.innerHTML = '';
            
            // Add each announcement to the table
            announcements.forEach(announcement => {
                const dateCreated = new Date(announcement.date).toLocaleDateString('en-US', { 
                    month: '2-digit', 
                    day: '2-digit', 
                    year: '2-digit' 
                });

                const newRow = document.createElement('tr');
                newRow.dataset.id = announcement._id;
                newRow.innerHTML = `
                    <td>${announcement.title}</td>
                    <td>${announcement.content.substring(0, 50)}${announcement.content.length > 50 ? '...' : ''}</td>
                    <td>${dateCreated}</td>
                    <td class="actions">
                        <i class="fa-solid fa-trash" title="Delete"></i>
                    </td>
                `;

                announcementsTbody.appendChild(newRow);
            });
            
        } catch (error) {
            console.error('Error loading announcements:', error);
        }
    }

    // Handle 'Clear' button functionality
    clearButton.addEventListener('click', function() {
        announcementForm.reset();
    });

    // Handle 'Delete' action using event delegation
    announcementsTbody.addEventListener('click', async function(e) {
        const target = e.target;

        // Delete action
        if (target.classList.contains('fa-trash')) {
            const row = target.closest('tr');
            const announcementId = row.dataset.id;
            
            if (confirm('Are you sure you want to delete this announcement?')) {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/announcements/${announcementId}`, {
                        method: 'DELETE'
                    });
                    
                    if (!response.ok) throw new Error('Failed to delete announcement');
                    
                    alert('Announcement deleted successfully!');
                    loadAnnouncements();
                    
                } catch (error) {
                    console.error('Error deleting announcement:', error);
                    alert('Failed to delete announcement. Please try again.');
                }
            }
        }
    });
});