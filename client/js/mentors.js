// client/js/mentors.js
document.addEventListener('DOMContentLoaded', async () => {
    const mentorsListContainer = document.getElementById('mentors-list-container');
    const mentorActionArea = document.getElementById('mentor-action-area');
    const loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
    
    // Modals
    const requestModal = document.getElementById('request-modal');
    const editRequestModal = document.getElementById('edit-request-modal');

    // Helper function to generate star rating
    function generateStarRating(rating, reviewCount) {
        if (!rating || rating === 0) {
            return `
                <div class="stars">
                    <span class="no-rating">No rating yet</span>
                </div>
            `;
        }
        
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let starsHtml = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="fas fa-star star-filled"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            starsHtml += '<i class="fas fa-star-half-alt star-filled"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="far fa-star star-empty"></i>';
        }
        
        return `
            <div class="stars">
                ${starsHtml}
                <span class="rating-info">
                    <span class="rating-value">${rating.toFixed(1)}</span>
                    <span class="review-count">(${reviewCount} reviews)</span>
                </span>
            </div>
        `;
    }

    // Update container class for enhanced layout
    const updateMentorsLayout = () => {
        if (mentorsListContainer.classList.contains('mentors-grid')) {
            mentorsListContainer.classList.remove('mentors-grid');
            mentorsListContainer.classList.add('enhanced-mentors-grid');
        }
    };

    const checkMentorStatus = async () => {
        if (!loggedInUserEmail || !mentorActionArea) return;
        try {
            const data = await window.api.get('/mentors/status');
            if (data.isMentor) {
                mentorActionArea.innerHTML = `
                    <a href="mentor-requests.html" class="btn btn-primary"><i class="fas fa-inbox"></i> View Requests</a>
                    <a href="edit-mentor.html" class="btn btn-secondary"><i class="fas fa-edit"></i> Edit Profile</a>
                `;
            } else {
                mentorActionArea.innerHTML = `<a href="become-mentor.html" class="btn btn-primary"><i class="fas fa-user-plus"></i> Become a Mentor</a>`;
            }
        } catch (error) {
            console.error('Error checking mentor status:', error);
            mentorActionArea.innerHTML = `<a href="become-mentor.html" class="btn btn-primary"><i class="fas fa-user-plus"></i> Become a Mentor</a>`;
        }
    };

    const fetchAndRenderMentors = async () => {
        updateMentorsLayout();
        
        mentorsListContainer.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                <p>Finding amazing mentors for you...</p>
            </div>
        `;
        try {
            const [mentors, sentRequests] = await Promise.all([
                window.api.get('/mentors'),
                loggedInUserEmail ? window.api.get('/mentors/requests/sent') : Promise.resolve([])
            ]);
            
            const sentRequestsMap = new Map(sentRequests.map(req => [req.mentor_user_id, {status: req.status, message: req.request_message}]));

            mentorsListContainer.innerHTML = '';

            if (mentors.length > 0) {
                mentors.forEach(mentor => {
                    if (mentor.email === loggedInUserEmail) return;

                    const requestStatus = sentRequestsMap.get(mentor.user_id);
                    let buttonsHtml = '';

                    if (requestStatus) {
                        switch (requestStatus.status) {
                            case 'pending':
                                buttonsHtml += `
                                    <button class="btn btn-warning btn-sm edit-request-btn" data-id="${mentor.user_id}" data-name="${sanitizeHTML(mentor.full_name)}" data-message="${sanitizeHTML(requestStatus.message)}">
                                        <i class="fas fa-edit"></i> Edit Request
                                    </button>
                                    <button class="btn btn-danger btn-sm cancel-request-btn" data-id="${mentor.user_id}">
                                        <i class="fas fa-times"></i> Cancel
                                    </button>
                                `;
                                break;
                            case 'accepted':
                                buttonsHtml += `<a href="messages.html" class="btn btn-success btn-sm">
                                    <i class="fas fa-comments"></i> Message
                                </a>`;
                                break;
                            case 'declined':
                                buttonsHtml += `<button class="btn btn-primary btn-sm request-mentor-btn" data-id="${mentor.user_id}" data-name="${sanitizeHTML(mentor.full_name)}">
                                    <i class="fas fa-redo"></i> Request Again
                                </button>`;
                                break;
                        }
                    } else {
                        buttonsHtml += `<button class="btn btn-primary btn-sm request-mentor-btn" data-id="${mentor.user_id}" data-name="${sanitizeHTML(mentor.full_name)}">
                            <i class="fas fa-paper-plane"></i> Request Mentorship
                        </button>`;
                    }

                    const mentorItem = document.createElement('div');
                    mentorItem.classList.add('enhanced-mentor-card');
                    const profilePicUrl = mentor.profile_pic_url ? `http://localhost:3000/${mentor.profile_pic_url}` : createInitialsAvatar(mentor.full_name);

                    // Format skills array
                    const skillsArray = mentor.skills ? mentor.skills.split(',').map(s => s.trim()).slice(0, 4) : [];
                    const skillsHtml = skillsArray.length > 0 ? skillsArray.map(skill => 
                        `<span class="skill-badge">${sanitizeHTML(skill)}</span>`
                    ).join('') : '<span class="no-skills">No skills listed</span>';

                    // More skills indicator
                    const moreSkillsCount = mentor.skills ? mentor.skills.split(',').length - 4 : 0;
                    const moreSkillsHtml = moreSkillsCount > 0 ? `<span class="more-skills">+${moreSkillsCount} more</span>` : '';

                    // Industry badge
                    const industryBadge = mentor.industry ? `<span class="industry-badge">${sanitizeHTML(mentor.industry)}</span>` : '';

                    // Experience badge  
                    const experienceBadge = mentor.experience_years ? `<span class="experience-badge">${mentor.experience_years}+ years</span>` : '';

                    // Rating display
                    const rating = mentor.average_rating || 0;
                    const reviewCount = mentor.total_reviews || 0;
                    const starsHtml = generateStarRating(rating, reviewCount);

                    // Premium badge
                    const premiumBadge = mentor.is_premium ? '<span class="premium-badge"><i class="fas fa-crown"></i> Premium</span>' : '';

                    // Response time
                    const responseTime = mentor.response_time_hours ? `${mentor.response_time_hours}h response` : '24h response';

                    // Online status (mock for now)
                    const isOnline = Math.random() > 0.6; // Mock online status
                    const onlineStatus = isOnline ? '<span class="online-indicator"></span>' : '';

                    mentorItem.innerHTML = `
                        <div class="mentor-card-header">
                            <div class="mentor-avatar">
                                ${onlineStatus}
                                <img src="${profilePicUrl}" alt="${sanitizeHTML(mentor.full_name)}" 
                                     onerror="this.onerror=null; this.src=createInitialsAvatar('${mentor.full_name.replace(/'/g, "\\'")}');">
                            </div>
                            <div class="mentor-badges">
                                ${premiumBadge}
                                ${mentor.verification_status === 'verified' ? '<span class="verified-badge"><i class="fas fa-check-circle"></i></span>' : ''}
                            </div>
                        </div>
                        
                        <div class="mentor-card-body">
                            <div class="mentor-info">
                                <h3 class="mentor-name">${sanitizeHTML(mentor.full_name)}</h3>
                                <p class="mentor-title">${sanitizeHTML(mentor.job_title || 'Professional')}</p>
                                <p class="mentor-company">${sanitizeHTML(mentor.company || 'Independent')}</p>
                            </div>
                            
                            <div class="mentor-meta">
                                ${industryBadge}
                                ${experienceBadge}
                                <span class="response-time"><i class="fas fa-clock"></i> ${responseTime}</span>
                            </div>
                            
                            <div class="mentor-rating">
                                ${starsHtml}
                            </div>
                            
                            <div class="mentor-expertise">
                                <div class="expertise-label">
                                    <i class="fas fa-lightbulb"></i>
                                    <span>Expertise</span>
                                </div>
                                <p class="expertise-text">${sanitizeHTML(mentor.expertise_areas || 'General mentoring')}</p>
                            </div>
                            
                            <div class="mentor-skills">
                                <div class="skills-container">
                                    ${skillsHtml}
                                    ${moreSkillsHtml}
                                </div>
                            </div>
                            
                            ${mentor.bio ? `<div class="mentor-bio">
                                <p>${sanitizeHTML(mentor.bio).substring(0, 120)}${mentor.bio.length > 120 ? '...' : ''}</p>
                            </div>` : ''}
                        </div>
                        
                        <div class="mentor-card-footer">
                            <div class="mentor-stats">
                                <div class="stat-item">
                                    <i class="fas fa-users"></i>
                                    <span>${mentor.total_mentees || 0} mentees</span>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-calendar-check"></i>
                                    <span>${mentor.total_sessions || 0} sessions</span>
                                </div>
                                ${mentor.is_premium ? `<div class="stat-item">
                                    <i class="fas fa-dollar-sign"></i>
                                    <span>$${mentor.hourly_rate || 50}/hr</span>
                                </div>` : '<div class="stat-item free-badge"><i class="fas fa-heart"></i><span>Free</span></div>'}
                            </div>
                            
                            <div class="mentor-actions">
                                <a href="view-profile.html?email=${mentor.email}" class="btn btn-secondary btn-sm">
                                    <i class="fas fa-user"></i> Profile
                                </a>
                                ${buttonsHtml}
                            </div>
                        </div>
                    `;
                    mentorsListContainer.appendChild(mentorItem);
                });
            } else {
                mentorsListContainer.innerHTML = `<div class="empty-state card"><i class="fas fa-users"></i><h3>No Mentors Available</h3><p>Be the first to help guide fellow alumni. Register to become a mentor!</p></div>`;
            }
        } catch (error) {
            console.error('Error fetching mentors:', error);
            mentorsListContainer.innerHTML = '<p class="info-message error">Failed to load mentors.</p>';
        }
    };

    // --- Modal Handling ---
    const setupModals = () => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            const closeBtn = modal.querySelector('.close-btn');
            closeBtn.onclick = () => modal.style.display = 'none';
        });
        window.onclick = (event) => {
            modals.forEach(modal => {
                if (event.target == modal) {
                    modal.style.display = 'none';
                }
            });
        };
    };

    // --- Event Listeners ---
    mentorsListContainer.addEventListener('click', async (e) => {
        const target = e.target;

        if (target.matches('.request-mentor-btn')) {
            if (!loggedInUserEmail) {
                showToast('Please log in to request mentorship.', 'info');
                return;
            }
            document.getElementById('modal-title').textContent = `Send Mentorship Request to ${target.dataset.name}`;
            document.getElementById('mentor-id-input').value = target.dataset.id;
            requestModal.style.display = 'block';
        }

        if (target.matches('.edit-request-btn')) {
            document.getElementById('edit-modal-title').textContent = `Edit Mentorship Request to ${target.dataset.name}`;
            document.getElementById('edit-mentor-id-input').value = target.dataset.id;
            document.getElementById('edit-request-message').value = target.dataset.message;
            editRequestModal.style.display = 'block';
        }

        if (target.matches('.cancel-request-btn')) {
            if (confirm('Are you sure you want to cancel this mentorship request?')) {
                try {
                    await window.api.del(`/mentors/requests/sent/${target.dataset.id}`);
                    showToast('Request canceled.', 'success');
                    await fetchAndRenderMentors();
                } catch (error) {
                    showToast(`Error: ${error.message}`, 'error');
                }
            }
        }
    });

    // Handle NEW request submission
    document.getElementById('request-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const mentorId = document.getElementById('mentor-id-input').value;
        const message = document.getElementById('request-message').value;
        try {
            await window.api.post('/mentors/request', { mentor_id: mentorId, message });
            showToast('Request sent!', 'success');
            requestModal.style.display = 'none';
            await fetchAndRenderMentors();
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    });

    // Handle EDIT request submission
    document.getElementById('edit-request-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const mentorId = document.getElementById('edit-mentor-id-input').value;
        const message = document.getElementById('edit-request-message').value;
        try {
            await window.api.put(`/mentors/requests/sent/${mentorId}`, { message });
            showToast('Request updated!', 'success');
            editRequestModal.style.display = 'none';
            await fetchAndRenderMentors();
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    });

    // --- Initial Load ---
    setupModals();
    await checkMentorStatus();
    await fetchAndRenderMentors();
});