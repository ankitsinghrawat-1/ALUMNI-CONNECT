// client/js/social-profile.js
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId') || params.get('id');
    let currentUser = null;
    let profileUser = null;
    let isOwnProfile = false;

    if (!userId) {
        showToast('User ID not provided', 'error');
        setTimeout(() => {
            window.location.href = 'threads.html';
        }, 2000);
        return;
    }

    // Get current user
    try {
        currentUser = await window.api.get('/users/profile');
        isOwnProfile = currentUser.user_id === parseInt(userId);
        
        // Immediately hide follow button and message button if viewing own profile
        if (isOwnProfile) {
            const followBtn = document.getElementById('follow-btn');
            if (followBtn) {
                followBtn.style.display = 'none';
            }
            
            // Hide message button for own profile (can't message yourself)
            const messageBtn = document.getElementById('message-btn');
            if (messageBtn) {
                messageBtn.style.display = 'none';
            }
        }
    } catch (error) {
    }

    // Load profile data
    const loadProfile = async () => {
        try {
            const data = await window.api.get(`/social/profile/${userId}`);
            profileUser = data.user;
            
            // Update profile header
            const avatar = document.getElementById('profile-avatar');
            if (profileUser.profile_pic_url) {
                avatar.src = `http://localhost:3000/${profileUser.profile_pic_url}`;
            } else {
                avatar.src = createInitialsAvatar(profileUser.full_name);
            }

            document.getElementById('profile-name').textContent = profileUser.full_name;
            
            if (profileUser.verification_status === 'verified') {
                document.getElementById('verification-badge').style.display = 'inline';
            }

            const titleParts = [];
            if (profileUser.job_title) titleParts.push(profileUser.job_title);
            if (profileUser.company) titleParts.push(`at ${profileUser.company}`);
            if (titleParts.length > 0) {
                document.getElementById('profile-title').textContent = titleParts.join(' ');
            }

            if (profileUser.bio) {
                document.getElementById('profile-bio').textContent = profileUser.bio;
            }

            // Update stats
            document.getElementById('threads-count').textContent = data.stats.threads;
            document.getElementById('followers-count').textContent = data.stats.followers;
            document.getElementById('following-count').textContent = data.stats.following;
            document.getElementById('likes-count').textContent = data.stats.likes_received;
            document.getElementById('activity-likes').textContent = data.stats.likes_received;
            document.getElementById('activity-comments').textContent = data.stats.comments_received;

            // Update profile links
            const viewProfileBtn = document.getElementById('view-full-profile-btn');
            viewProfileBtn.href = `view-profile.html?email=${profileUser.email}`;
            
            // Update extended profile info
            if (profileUser.skills) {
                document.getElementById('profile-skills').textContent = profileUser.skills;
                document.getElementById('skills-detail').style.display = 'flex';
            }
            
            if (profileUser.interests) {
                document.getElementById('profile-interests').textContent = profileUser.interests;
                document.getElementById('interests-detail').style.display = 'flex';
            }
            
            if (profileUser.current_project) {
                document.getElementById('profile-project').textContent = profileUser.current_project;
                document.getElementById('project-detail').style.display = 'flex';
            }
            
            if (profileUser.available_mentor) {
                document.getElementById('mentor-badge').style.display = 'flex';
            }
            
            // Show the extended info grid if any items are visible
            const extendedInfoGrid = document.getElementById('profile-extended-info');
            if (profileUser.skills || profileUser.interests || profileUser.current_project || profileUser.available_mentor) {
                extendedInfoGrid.style.display = 'grid';
            }
            
            // Update social links
            let hasSocialLinks = false;
            
            if (profileUser.linkedin) {
                const linkedinLink = document.getElementById('linkedin-link');
                linkedinLink.href = profileUser.linkedin.startsWith('http') 
                    ? profileUser.linkedin 
                    : `https://linkedin.com/in/${profileUser.linkedin}`;
                linkedinLink.style.display = 'flex';
                hasSocialLinks = true;
            }
            
            if (profileUser.twitter) {
                const twitterLink = document.getElementById('twitter-link');
                const username = profileUser.twitter.replace('@', '');
                twitterLink.href = `https://twitter.com/${username}`;
                twitterLink.style.display = 'flex';
                hasSocialLinks = true;
            }
            
            if (profileUser.github) {
                const githubLink = document.getElementById('github-link');
                githubLink.href = `https://github.com/${profileUser.github}`;
                githubLink.style.display = 'flex';
                hasSocialLinks = true;
            }
            
            if (hasSocialLinks) {
                document.getElementById('profile-social-links').style.display = 'flex';
            }

            // Setup follow button - only show if viewing someone else's profile
            const followBtn = document.getElementById('follow-btn');
            // Always ensure follow button is hidden for own profile
            if (isOwnProfile) {
                followBtn.classList.add('hidden-own-profile');
                followBtn.style.display = 'none';
            } else if (currentUser && !isOwnProfile) {
                // Only show follow button when viewing another user's profile
                followBtn.classList.remove('hidden-own-profile');
                followBtn.style.display = 'inline-flex';
                await updateFollowButton();
            } else {
                // Not logged in or viewing own profile - hide follow button
                followBtn.style.display = 'none';
            }

            // Load highlights
            if (data.highlights && data.highlights.length > 0) {
                loadHighlights(data.highlights);
            }

        } catch (error) {
            showToast('Error loading profile', 'error');
        }
    };

    // Update follow button state
    const updateFollowButton = async () => {
        try {
            const status = await window.api.get(`/social/follow-status/${userId}`);
            const followBtn = document.getElementById('follow-btn');
            
            if (status.following) {
                followBtn.innerHTML = '<i class="fas fa-user-check"></i> Following';
                followBtn.classList.remove('btn-primary');
                followBtn.classList.add('btn-secondary');
            } else {
                followBtn.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
                followBtn.classList.remove('btn-secondary');
                followBtn.classList.add('btn-primary');
            }
        } catch (error) {
        }
    };

    // Handle follow/unfollow
    document.getElementById('follow-btn')?.addEventListener('click', async () => {
        // Prevent following own profile
        if (isOwnProfile) {
            showToast('You cannot follow yourself', 'error');
            return;
        }
        
        if (!currentUser) {
            showToast('Please log in to follow users', 'error');
            return;
        }

        try {
            const followBtn = document.getElementById('follow-btn');
            const isFollowing = followBtn.textContent.includes('Following');

            if (isFollowing) {
                await window.api.delete(`/social/follow/${userId}`);
                showToast('Unfollowed successfully', 'success');
            } else {
                await window.api.post(`/social/follow/${userId}`);
                showToast('Following successfully', 'success');
            }

            await updateFollowButton();
            await loadProfile(); // Refresh stats
        } catch (error) {
            showToast('Error updating follow status', 'error');
        }
    });

    // Handle message button
    document.getElementById('message-btn').addEventListener('click', () => {
        if (!currentUser) {
            showToast('Please log in to send messages', 'error');
            return;
        }
        window.location.href = `messages.html?user=${profileUser.email}`;
    });

    // Load highlights
    const loadHighlights = (highlights) => {
        const highlightsSection = document.getElementById('highlights-section');
        const container = document.getElementById('highlights-container');
        
        if (highlights.length === 0) {
            highlightsSection.style.display = 'none';
            return;
        }

        highlightsSection.style.display = 'block';
        
        container.innerHTML = highlights.map(highlight => {
            const coverUrl = highlight.cover_image_url 
                ? `http://localhost:3000/${highlight.cover_image_url}`
                : '';
            
            return `
                <div class="highlight-item" onclick="viewHighlight(${highlight.highlight_id})">
                    <div class="highlight-ring">
                        <div class="highlight-cover">
                            ${coverUrl ? `<img src="${coverUrl}" alt="${highlight.highlight_name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : '<i class="fas fa-bookmark"></i>'}
                        </div>
                    </div>
                    <span class="highlight-name">${highlight.highlight_name}</span>
                </div>
            `;
        }).join('');
    };

    // Load user threads
    const loadThreads = async () => {
        try {
            const data = await window.api.get(`/social/threads/${userId}`);
            const container = document.getElementById('threads-list');
            
            if (data.threads.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-comments"></i>
                        <h3>No Threads Yet</h3>
                        <p>This user hasn't posted any threads yet.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = data.threads.map(thread => createThreadCard(thread)).join('');
        } catch (error) {
            const container = document.getElementById('threads-list');
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Threads</h3>
                    <p>Unable to load threads at this time.</p>
                </div>
            `;
        }
    };

    // Create thread card HTML
    const createThreadCard = (thread) => {
        const profilePicUrl = thread.profile_pic_url 
            ? `http://localhost:3000/${thread.profile_pic_url}` 
            : createInitialsAvatar(thread.author);

        let mediaContent = '';
        if (thread.media_url) {
            const mediaUrl = `http://localhost:3000/${thread.media_url}`;
            if (thread.media_type === 'image') {
                mediaContent = `
                    <img src="${mediaUrl}" alt="Thread media" class="modern-thread-image">
                `;
            } else if (thread.media_type === 'video') {
                mediaContent = `
                    <video controls class="modern-thread-video">
                        <source src="${mediaUrl}" type="video/mp4">
                    </video>
                `;
            }
        }

        return `
            <article class="modern-thread-card" onclick="window.location.href='thread-detail.html?id=${thread.thread_id}'">
                <div class="modern-thread-header">
                    <div class="modern-thread-author">
                        <img src="${profilePicUrl}" alt="${thread.author}" class="modern-author-avatar">
                        <div class="modern-author-details">
                            <h4>${thread.author}</h4>
                            <span class="modern-thread-time">${timeAgo(thread.created_at)}</span>
                        </div>
                    </div>
                </div>

                <div class="modern-thread-content">
                    ${thread.content ? `<p class="modern-thread-text">${sanitizeHTML(thread.content).replace(/\n/g, '<br>')}</p>` : ''}
                    ${mediaContent ? `<div class="modern-thread-media">${mediaContent}</div>` : ''}
                </div>

                <div class="modern-thread-stats">
                    <span><i class="far fa-heart"></i> ${thread.like_count || 0}</span>
                    <span><i class="far fa-comment"></i> ${thread.comment_count || 0}</span>
                    <span><i class="far fa-share-square"></i> ${thread.share_count || 0}</span>
                </div>
            </article>
        `;
    };

    // Load posts grid
    const loadPostsGrid = async () => {
        try {
            const data = await window.api.get(`/social/threads/${userId}`);
            const container = document.getElementById('posts-grid');
            
            if (data.threads.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1/-1;">
                        <i class="fas fa-th"></i>
                        <h3>No Posts Yet</h3>
                        <p>This user hasn't created any posts yet.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = data.threads.map(thread => {
                let mediaUrl = '';
                let mediaType = 'text';
                
                if (thread.media_url) {
                    mediaUrl = `http://localhost:3000/${thread.media_url}`;
                    mediaType = thread.media_type;
                }

                return `
                    <div class="post-card" onclick="window.location.href='thread-detail.html?id=${thread.thread_id}'">
                        ${mediaType !== 'text' ? `
                            <img src="${mediaUrl}" alt="Post" class="post-card-media">
                        ` : `
                            <div class="post-card-media" style="display:flex;align-items:center;justify-content:center;color:white;padding:1rem;text-align:center;">
                                <p>${(thread.content || '').substring(0, 100)}...</p>
                            </div>
                        `}
                        <div class="post-card-content">
                            ${thread.content && mediaType !== 'text' ? `<p class="post-card-text">${sanitizeHTML(thread.content)}</p>` : ''}
                            <div class="post-card-stats">
                                <span><i class="far fa-heart"></i> ${thread.like_count || 0}</span>
                                <span><i class="far fa-comment"></i> ${thread.comment_count || 0}</span>
                                <span><i class="far fa-share-square"></i> ${thread.share_count || 0}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
        }
    };

    // Tab switching
    const tabs = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active pane
            tabPanes.forEach(pane => pane.classList.remove('active'));
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            // Load data if needed
            if (tabName === 'threads' && document.getElementById('threads-list').innerHTML.includes('Loading')) {
                loadThreads();
            } else if (tabName === 'posts' && document.getElementById('posts-grid').innerHTML.includes('Loading')) {
                loadPostsGrid();
            }
        });
    });

    // View followers/following
    document.getElementById('followers-stat').addEventListener('click', () => {
        showConnectionsModal('followers');
    });

    document.getElementById('following-stat').addEventListener('click', () => {
        showConnectionsModal('following');
    });

    // Show connections modal
    const showConnectionsModal = async (type) => {
        const modal = document.getElementById('connections-modal');
        const title = document.getElementById('connections-modal-title');
        const list = document.getElementById('connections-list');
        
        title.textContent = type === 'followers' ? 'Followers' : 'Following';
        list.innerHTML = '<div class="loading-container"><div class="modern-spinner"><div class="spinner-ring"></div></div><p>Loading...</p></div>';
        modal.style.display = 'block';

        try {
            const endpoint = type === 'followers' ? `/social/followers/${userId}` : `/social/following/${userId}`;
            const data = await window.api.get(endpoint);
            const users = data[type];

            if (users.length === 0) {
                list.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <p>No ${type} yet</p>
                    </div>
                `;
                return;
            }

            list.innerHTML = users.map(user => {
                const avatar = user.profile_pic_url 
                    ? `http://localhost:3000/${user.profile_pic_url}`
                    : createInitialsAvatar(user.full_name);
                
                const title = user.job_title && user.company 
                    ? `${user.job_title} at ${user.company}`
                    : user.job_title || user.company || '';

                return `
                    <div class="user-connection-item">
                        <img src="${avatar}" alt="${user.full_name}" class="connection-avatar">
                        <div class="connection-info">
                            <div class="connection-name">${user.full_name}</div>
                            ${title ? `<div class="connection-title">${title}</div>` : ''}
                        </div>
                        <div class="connection-action">
                            <a href="social-profile.html?userId=${user.user_id}" class="action-icon-btn action-icon-primary" data-tooltip="View Profile">
                                <i class="fas fa-eye"></i>
                            </a>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading ${type}</p>
                </div>
            `;
        }
    };

    // Close modals
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeBtn.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Utility: Time ago
    const timeAgo = (date) => {
        const now = new Date();
        const postDate = new Date(date);
        const diffInSeconds = Math.floor((now - postDate) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return postDate.toLocaleDateString();
    };

    // Edit Profile Modal Functions
    window.openEditProfileModal = () => {
        const modal = document.getElementById('edit-profile-modal');
        if (modal && profileUser) {
            // Populate form with current data
            document.getElementById('edit-bio').value = profileUser.bio || '';
            document.getElementById('edit-job-title').value = profileUser.job_title || '';
            document.getElementById('edit-company').value = profileUser.company || '';
            document.getElementById('edit-location').value = profileUser.location || '';
            document.getElementById('edit-website').value = profileUser.website || '';
            document.getElementById('edit-skills').value = profileUser.skills || '';
            document.getElementById('edit-interests').value = profileUser.interests || '';
            document.getElementById('edit-current-project').value = profileUser.current_project || '';
            document.getElementById('edit-linkedin').value = profileUser.linkedin || '';
            document.getElementById('edit-twitter').value = profileUser.twitter || '';
            document.getElementById('edit-github').value = profileUser.github || '';
            document.getElementById('edit-available-mentor').checked = profileUser.available_mentor || false;
            
            // Update char count
            updateCharCount();
            
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeEditProfileModal = () => {
        const modal = document.getElementById('edit-profile-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    };

    // Bio character count
    const updateCharCount = () => {
        const bioInput = document.getElementById('edit-bio');
        const charCount = document.getElementById('bio-char-count');
        if (bioInput && charCount) {
            charCount.textContent = `${bioInput.value.length}/160`;
        }
    };

    // Listen for bio input
    const bioInput = document.getElementById('edit-bio');
    if (bioInput) {
        bioInput.addEventListener('input', updateCharCount);
    }

    // Handle edit profile form submission
    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = editProfileForm.querySelector('button[type="submit"]');
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            
            try {
                const formData = {
                    bio: document.getElementById('edit-bio').value,
                    job_title: document.getElementById('edit-job-title').value,
                    company: document.getElementById('edit-company').value,
                    location: document.getElementById('edit-location').value,
                    website: document.getElementById('edit-website').value,
                    skills: document.getElementById('edit-skills').value,
                    interests: document.getElementById('edit-interests').value,
                    current_project: document.getElementById('edit-current-project').value,
                    linkedin: document.getElementById('edit-linkedin').value,
                    twitter: document.getElementById('edit-twitter').value,
                    github: document.getElementById('edit-github').value,
                    available_mentor: document.getElementById('edit-available-mentor').checked
                };
                
                await window.api.put('/users/profile', formData);
                
                // Update profileUser object with new data immediately
                Object.assign(profileUser, formData);
                
                submitBtn.classList.remove('loading');
                submitBtn.classList.add('success');
                
                showToast('Profile updated successfully!', 'success');
                
                setTimeout(() => {
                    closeEditProfileModal();
                    loadProfile(); // Reload profile data from server
                }, 1000);
                
            } catch (error) {
                showToast('Failed to update profile', 'error');
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        });
    }

    // Share profile function
    const shareProfileBtn = document.getElementById('share-profile-btn');
    if (shareProfileBtn) {
        shareProfileBtn.addEventListener('click', async () => {
            const profileUrl = window.location.href;
            
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `${profileUser.full_name}'s Profile`,
                        text: `Check out ${profileUser.full_name}'s profile on AlumniConnect`,
                        url: profileUrl
                    });
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        copyToClipboard(profileUrl);
                    }
                }
            } else {
                copyToClipboard(profileUrl);
            }
        });
    }

    // Copy to clipboard helper
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Profile link copied to clipboard!', 'success');
        }).catch(() => {
            showToast('Failed to copy link', 'error');
        });
    };

    // Animate stat numbers with count-up effect
    const animateStats = () => {
        const statValues = document.querySelectorAll('.stat-value');
        statValues.forEach(stat => {
            const target = parseInt(stat.textContent);
            if (isNaN(target)) return;
            
            let current = 0;
            const increment = target / 30; // 30 frames
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    stat.textContent = target;
                    clearInterval(timer);
                } else {
                    stat.textContent = Math.floor(current);
                }
            }, 20);
        });
    };

    // Enhanced profile details display
    const displayProfileDetails = () => {
        if (profileUser.location) {
            document.getElementById('location-detail').style.display = 'flex';
            document.getElementById('profile-location').textContent = profileUser.location;
        }
        
        if (profileUser.website) {
            document.getElementById('website-detail').style.display = 'flex';
            const websiteLink = document.getElementById('profile-website');
            websiteLink.href = profileUser.website;
            websiteLink.textContent = profileUser.website.replace(/^https?:\/\//, '');
        }
        
        if (profileUser.created_at) {
            const joinedDate = new Date(profileUser.created_at);
            const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            document.getElementById('profile-joined').textContent = 
                `${monthNames[joinedDate.getMonth()]} ${joinedDate.getFullYear()}`;
        }
    };

    // Show edit button for own profile
    const setupEditButton = () => {
        const editBtn = document.getElementById('edit-profile-btn');
        const followBtn = document.getElementById('follow-btn');
        const createActionsDiv = document.querySelector('.profile-actions-create');
        
        if (editBtn && isOwnProfile) {
            editBtn.style.display = 'inline-flex';
            editBtn.addEventListener('click', openEditProfileModal);
            
            // Show the entire create actions section only on own profile
            if (createActionsDiv) {
                createActionsDiv.style.display = 'flex';
            }
            
            // Extra safeguard: Ensure follow button is hidden for own profile
            if (followBtn) {
                followBtn.classList.add('hidden-own-profile');
                followBtn.style.display = 'none';
            }
        }
    };

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        const editModal = document.getElementById('edit-profile-modal');
        if (e.target === editModal) {
            closeEditProfileModal();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+E or Cmd+E to edit profile (if own profile)
        if ((e.ctrlKey || e.metaKey) && e.key === 'e' && isOwnProfile) {
            e.preventDefault();
            openEditProfileModal();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            closeEditProfileModal();
            closeConnectionsModal();
        }
    });

    // Initialize
    await loadProfile();
    await loadPostsGrid();
    displayProfileDetails();
    setupEditButton();
    
    // Animate stats after a small delay
    setTimeout(animateStats, 300);
});
