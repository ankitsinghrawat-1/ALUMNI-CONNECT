// client/js/mentors.js
document.addEventListener('DOMContentLoaded', async () => {
    const mentorsListContainer = document.getElementById('mentors-list-container');
    const mentorActionArea = document.getElementById('mentor-action-area');
    const loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
    
    // Modals
    const requestModal = document.getElementById('request-modal');
    const editRequestModal = document.getElementById('edit-request-modal');

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
            mentorActionArea.innerHTML = `<a href="become-mentor.html" class="btn btn-primary"><i class="fas fa-user-plus"></i> Become a Mentor</a>`;
        }
    };

    const fetchAndRenderMentors = async () => {
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

                    // Always show view profile button
                    buttonsHtml += `<a href="view-profile.html?email=${mentor.email}" class="btn btn-secondary">View Profile</a>`;

                    if (requestStatus) {
                        switch (requestStatus.status) {
                            case 'pending':
                                buttonsHtml += `
                                    <button class="btn btn-secondary edit-request-btn" data-id="${mentor.user_id}" data-name="${sanitizeHTML(mentor.full_name)}" data-message="${sanitizeHTML(requestStatus.message)}">Edit Request</button>
                                    <button class="btn btn-danger cancel-request-btn" data-id="${mentor.user_id}">Cancel Request</button>
                                `;
                                break;
                            case 'accepted':
                                buttonsHtml += `<a href="messages.html" class="btn btn-success">Message Mentor</a>`;
                                break;
                            case 'declined':
                                buttonsHtml += `<button class="btn btn-primary request-mentor-btn" data-id="${mentor.user_id}" data-name="${sanitizeHTML(mentor.full_name)}">Request Again</button>`;
                                break;
                        }
                    } else {
                        buttonsHtml += `<button class="btn btn-primary request-mentor-btn" data-id="${mentor.user_id}" data-name="${sanitizeHTML(mentor.full_name)}">Request Mentorship</button>`;
                    }

                    const mentorItem = document.createElement('div');
                    mentorItem.classList.add('alumnus-list-item');
                    const profilePicUrl = mentor.profile_pic_url ? `http://localhost:3000/${mentor.profile_pic_url}` : createInitialsAvatar(mentor.full_name);

                    mentorItem.innerHTML = `
                        <img src="${profilePicUrl}" alt="${sanitizeHTML(mentor.full_name)}" class="alumnus-pfp-round" onerror="this.onerror=null; this.src=createInitialsAvatar('${mentor.full_name.replace(/'/g, "\\'")}');">
                        <div class="alumnus-details">
                            <h3>${sanitizeHTML(mentor.full_name)} ${mentor.verification_status === 'verified' ? '<span class="verified-badge-sm" title="Verified"><i class="fas fa-check-circle"></i></span>' : ''}</h3>
                            <p><i class="fas fa-briefcase"></i> ${sanitizeHTML(mentor.job_title || 'N/A')} at ${sanitizeHTML(mentor.company || 'N/A')}</p>
                            <p><i class="fas fa-star"></i> <strong>Expertise:</strong> ${sanitizeHTML(mentor.expertise_areas || 'N/A')}</p>
                            <div class="alumnus-actions">${buttonsHtml}</div>
                        </div>
                    `;
                    mentorsListContainer.appendChild(mentorItem);
                });
            } else {
                mentorsListContainer.innerHTML = `<div class="empty-state card"><i class="fas fa-users"></i><h3>No Mentors Available</h3><p>Be the first to help guide fellow alumni. Register to become a mentor!</p></div>`;
            }
        } catch (error) {
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