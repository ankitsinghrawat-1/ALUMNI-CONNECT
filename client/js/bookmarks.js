// client/js/bookmarks.js - Bookmarks Management
document.addEventListener('DOMContentLoaded', async () => {
    const bookmarksContainer = document.getElementById('bookmarks-container');
    const emptyState = document.getElementById('empty-state');
    const bookmarkCount = document.getElementById('bookmark-count');
    const exportBtn = document.getElementById('export-bookmarks-btn');
    const clearBtn = document.getElementById('clear-bookmarks-btn');

    // Toast notification function
    const showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // Load bookmarked alumni
    const loadBookmarks = async () => {
        try {
            const bookmarkedEmails = JSON.parse(localStorage.getItem('bookmarkedAlumni') || '[]');
            
            if (bookmarkedEmails.length === 0) {
                bookmarksContainer.style.display = 'none';
                emptyState.style.display = 'block';
                bookmarkCount.textContent = '0';
                return;
            }

            bookmarkCount.textContent = bookmarkedEmails.length;
            bookmarksContainer.style.display = 'grid';
            emptyState.style.display = 'none';

            // Fetch all alumni data (no pagination for bookmarks)
            const response = await window.api.get('/users/directory?limit=1000');
            const alumni = response.data || response; // Handle both old and new formats
            
            // Filter bookmarked alumni
            const bookmarkedAlumni = alumni.filter(alumnus => 
                bookmarkedEmails.includes(alumnus.email)
            );

            bookmarksContainer.innerHTML = '';

            bookmarkedAlumni.forEach(alumnus => {
                const card = createBookmarkCard(alumnus);
                bookmarksContainer.appendChild(card);
            });

        } catch (error) {
            console.error('Error loading bookmarks:', error);
            showToast('Failed to load bookmarks', 'error');
        }
    };

    // Create bookmark card
    const createBookmarkCard = (alumnus) => {
        const card = document.createElement('div');
        card.className = 'bookmark-card enhanced-alumnus-card card';
        
        const roleConfig = {
            alumni: { label: 'Alumni', icon: 'fa-user-graduate', color: '#667eea' },
            student: { label: 'Student', icon: 'fa-graduation-cap', color: '#10b981' },
            faculty: { label: 'Faculty', icon: 'fa-chalkboard-teacher', color: '#f59e0b' },
            employer: { label: 'Employer', icon: 'fa-building', color: '#ef4444' },
            institute: { label: 'Institute', icon: 'fa-university', color: '#8b5cf6' }
        };
        
        const role = alumnus.role || 'alumni';
        const userRole = roleConfig[role] || roleConfig.alumni;

        card.innerHTML = `
            <button class="remove-bookmark-btn" data-email="${alumnus.email}" title="Remove Bookmark">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="alumnus-card-header" style="position: relative;">
                <div class="card-profile-section">
                    <div class="alumnus-avatar">
                        <img src="${alumnus.profile_pic_url || 'https://via.placeholder.com/100'}" 
                             alt="${alumnus.full_name}" 
                             class="avatar-image"
                             onerror="this.src='https://via.placeholder.com/100'">
                    </div>
                    
                    <div class="alumnus-info">
                        <h3 class="alumnus-name">
                            ${alumnus.full_name}
                            ${alumnus.verification_status === 'verified' ? '<i class="fas fa-check-circle verification-badge" title="Verified Profile" style="color: #3b82f6; margin-left: 0.5rem;"></i>' : ''}
                        </h3>
                        <p class="alumnus-title">${alumnus.job_title || 'Alumni Member'}</p>
                        <p class="alumnus-company">${alumnus.current_company || ''}</p>
                        
                        <div class="profile-badges-row" style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                            <div class="role-badge" style="background: ${userRole.color}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
                                <i class="fas ${userRole.icon}"></i>
                                <span>${userRole.label}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="alumnus-card-body" style="padding: 1rem;">
                <div class="alumnus-details" style="margin-bottom: 1rem;">
                    ${alumnus.major ? `<div style="margin-bottom: 0.5rem;"><i class="fas fa-graduation-cap" style="color: #667eea; margin-right: 0.5rem;"></i>${alumnus.major}</div>` : ''}
                    ${alumnus.graduation_year ? `<div style="margin-bottom: 0.5rem;"><i class="fas fa-calendar" style="color: #667eea; margin-right: 0.5rem;"></i>Class of ${alumnus.graduation_year}</div>` : ''}
                    ${alumnus.email ? `<div><i class="fas fa-envelope" style="color: #667eea; margin-right: 0.5rem;"></i>${alumnus.email}</div>` : ''}
                </div>
                
                <button class="view-profile-btn" style="width: 100%; padding: 0.75rem; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s;" onclick="window.location.href='profile.html?id=${alumnus.user_id}'">
                    <i class="fas fa-user"></i> View Profile
                </button>
            </div>
        `;

        // Add remove bookmark handler
        const removeBtn = card.querySelector('.remove-bookmark-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeBookmark(alumnus.email);
        });

        return card;
    };

    // Remove bookmark
    const removeBookmark = (email) => {
        const bookmarkedAlumni = JSON.parse(localStorage.getItem('bookmarkedAlumni') || '[]');
        const index = bookmarkedAlumni.indexOf(email);
        
        if (index > -1) {
            bookmarkedAlumni.splice(index, 1);
            localStorage.setItem('bookmarkedAlumni', JSON.stringify(bookmarkedAlumni));
            showToast('Bookmark removed', 'info');
            loadBookmarks();
        }
    };

    // Export bookmarks to CSV
    const exportBookmarks = async () => {
        try {
            const bookmarkedEmails = JSON.parse(localStorage.getItem('bookmarkedAlumni') || '[]');
            
            if (bookmarkedEmails.length === 0) {
                showToast('No bookmarks to export', 'info');
                return;
            }

            // Fetch all alumni data (no pagination)
            const response = await window.api.get('/users/directory?limit=1000');
            const alumni = response.data || response; // Handle both formats
            const bookmarkedAlumni = alumni.filter(alumnus => 
                bookmarkedEmails.includes(alumnus.email)
            );

            // Prepare CSV content
            const headers = ['Name', 'Role', 'Email', 'Position', 'Company', 'Major', 'Graduation Year', 'Verified'];
            const csvRows = [headers.join(',')];

            bookmarkedAlumni.forEach(alumnus => {
                const row = [
                    `"${alumnus.full_name || ''}"`,
                    `"${alumnus.role || 'alumni'}"`,
                    `"${alumnus.email || 'N/A'}"`,
                    `"${alumnus.job_title || 'N/A'}"`,
                    `"${alumnus.current_company || 'N/A'}"`,
                    `"${alumnus.major || 'N/A'}"`,
                    `"${alumnus.graduation_year || 'N/A'}"`,
                    `"${alumnus.verification_status || 'unverified'}"`
                ];
                csvRows.push(row.join(','));
            });

            const csvContent = csvRows.join('\n');
            
            // Create and trigger download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `bookmarked-alumni-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast(`Exported ${bookmarkedAlumni.length} bookmarked alumni`, 'success');
        } catch (error) {
            console.error('Export error:', error);
            showToast('Failed to export bookmarks', 'error');
        }
    };

    // Clear all bookmarks
    const clearAllBookmarks = () => {
        if (confirm('Are you sure you want to remove all bookmarks? This action cannot be undone.')) {
            localStorage.setItem('bookmarkedAlumni', JSON.stringify([]));
            showToast('All bookmarks cleared', 'info');
            loadBookmarks();
        }
    };

    // Event listeners
    if (exportBtn) exportBtn.addEventListener('click', exportBookmarks);
    if (clearBtn) clearBtn.addEventListener('click', clearAllBookmarks);

    // Initial load
    loadBookmarks();
});
