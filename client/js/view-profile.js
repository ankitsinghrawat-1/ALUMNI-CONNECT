// client/js/view-profile.js
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email');

    if (!userEmail) {
        document.querySelector('.profile-main-view').innerHTML = '<div class="info-message card">User not found.</div>';
        return;
    }

    // Initialize Scroll Animations
    const initScrollAnimations = () => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-animate');
                }
            });
        }, observerOptions);

        document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));
    };

    // Fetch User Statistics
    const fetchUserStatistics = async (email) => {
        try {
            // Fetch blog posts count
            const blogs = await window.api.get(`/blogs/by-author/${email}`);
            const postsCount = blogs.length;
            
            // Animate counter
            animateCounter('posts-count', postsCount);
            
            // Calculate engagement (likes, comments, etc.)
            let totalEngagement = 0;
            let totalLikes = 0;
            let totalComments = 0;
            blogs.forEach(blog => {
                const likes = blog.likes || 0;
                const comments = blog.comments_count || 0;
                totalLikes += likes;
                totalComments += comments;
                totalEngagement += likes + comments;
            });
            animateCounter('engagement-count', totalEngagement);
            animateCounter('total-likes', totalLikes);
            animateCounter('total-comments', totalComments);

            // For now, use placeholder values for connections and events
            // These can be updated when the API endpoints are available
            const connectionsCount = Math.floor(Math.random() * 100) + 50;
            const eventsCount = Math.floor(Math.random() * 20) + 5;
            const profileViews = Math.floor(Math.random() * 500) + 100;
            const networkScore = Math.floor(connectionsCount * 1.5 + postsCount * 2);
            const activityStreak = Math.floor(Math.random() * 30) + 1;
            
            animateCounter('connections-count', connectionsCount);
            animateCounter('events-count', eventsCount);
            animateCounter('profile-views', profileViews);
            animateCounter('network-score', networkScore);
            animateCounter('activity-streak', activityStreak);

            return {
                posts: postsCount,
                engagement: totalEngagement,
                connections: connectionsCount,
                events: eventsCount,
                likes: totalLikes,
                comments: totalComments,
                views: profileViews,
                networkScore: networkScore,
                streak: activityStreak
            };
        } catch (error) {
            console.error('Error fetching user statistics:', error);
            return { posts: 0, engagement: 0, connections: 0, events: 0, likes: 0, comments: 0, views: 0, networkScore: 0, streak: 0 };
        }
    };

    // Animate Counter
    const animateCounter = (elementId, target) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        const duration = 1500;
        const start = 0;
        const startTime = performance.now();

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + (target - start) * easeOutQuart);
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        };

        requestAnimationFrame(updateCounter);
    };

    // Render Activity Chart
    const renderActivityChart = (blogs) => {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;

        // Prepare data for last 6 months
        const labels = [];
        const data = [];
        
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            labels.push(d.toLocaleString('default', { month: 'short' }));
            
            // Count blogs from this month
            const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            
            const count = blogs.filter(blog => {
                const blogDate = new Date(blog.created_at);
                return blogDate >= monthStart && blogDate <= monthEnd;
            }).length;
            
            data.push(count);
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Blog Posts',
                    data: data,
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 12,
                                weight: '600'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        borderRadius: 8,
                        titleFont: {
                            size: 14,
                            weight: '600'
                        },
                        bodyFont: {
                            size: 13
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    };

    // Render Skills
    const renderSkills = (user) => {
        const skillsContainer = document.getElementById('skills-view');
        if (!skillsContainer) return;

        let skills = [];
        
        // Parse skills from user data
        if (user.skills && user.skills.length > 0) {
            skills = Array.isArray(user.skills) ? user.skills : user.skills.split(',').map(s => s.trim());
        }

        if (skills.length > 0) {
            skillsContainer.innerHTML = skills.map(skill => `
                <div class="skill-tag">
                    <i class="fas fa-check-circle"></i>
                    <span>${sanitizeHTML(skill)}</span>
                </div>
            `).join('');
        } else {
            skillsContainer.innerHTML = '<p style="color: var(--text-secondary);">No skills listed yet.</p>';
        }
    };

    const fetchUserBlogs = async (email) => {
        const postsContainer = document.getElementById('user-blog-posts');
        try {
            // UPDATED API ENDPOINT
            const blogs = await window.api.get(`/blogs/by-author/${email}`);

            if (blogs.length > 0) {
                postsContainer.innerHTML = blogs.map(post => `
                    <div class="user-post-item">
                        <h4><a href="blog-post.html?id=${post.blog_id}">${sanitizeHTML(post.title)}</a></h4>
                        <p>${sanitizeHTML(post.content.substring(0, 150))}...</p>
                        <small>Posted on ${new Date(post.created_at).toLocaleDateString()}</small>
                    </div>
                `).join('');
                
                // Render activity chart
                renderActivityChart(blogs);
            } else {
                postsContainer.innerHTML = '<p>This user has not posted any blogs yet.</p>';
                renderActivityChart([]);
            }
            
            return blogs;
        } catch (error) {
            console.error('Error fetching user blogs:', error);
            postsContainer.innerHTML = '<p class="info-message error">Could not load blog posts.</p>';
            renderActivityChart([]);
            return [];
        }
    };

    const fetchUserProfile = async (email) => {
        try {
            const user = await window.api.get(`/users/profile/${email}`);
            
            // Always update social profile link with user_id if available
            const socialProfileLink = document.getElementById('social-profile-link');
            if (socialProfileLink && user.user_id) {
                socialProfileLink.href = `social-profile.html?userId=${user.user_id}`;
            }
            
            if (user.message && user.message.includes('private')) {
                const badgeHTML = user.verification_status === 'verified' ? '<span class="verified-badge" title="Verified"><i class="fas fa-check-circle"></i> Verified</span>' : '';
                document.querySelector('.profile-container-view').innerHTML = `
                    <div class="profile-header-view">
                        <img class="profile-pic-view" src="${user.profile_pic_url ? `http://localhost:3000/${user.profile_pic_url}` : createInitialsAvatar(user.full_name)}" alt="Profile Picture" onerror="this.onerror=null; this.src=createInitialsAvatar('${user.full_name.replace(/'/g, "\\'")}');">
                        <h2>${user.full_name} ${badgeHTML}</h2>
                        <p class="info-message"><i class="fas fa-lock"></i> This profile is private.</p>
                    </div>
                `;
                return;
            }
            
            document.getElementById('profile-name-view').textContent = user.full_name || 'N/A';
            
            const badgeContainer = document.getElementById('verified-badge-container');
            if (user.verification_status === 'verified') {
                badgeContainer.innerHTML = '<span class="verified-badge" title="Verified"><i class="fas fa-check-circle"></i> Verified</span>';
            } else {
                badgeContainer.innerHTML = '';
            }

            document.getElementById('profile-subheader').textContent = `${user.job_title || 'N/A'} at ${user.current_company || 'N/A'}`;
            document.getElementById('bio-view').textContent = user.bio || 'No bio available.';
            document.getElementById('university-view').textContent = user.university || 'N/A';
            document.getElementById('graduation-year-view').textContent = user.graduation_year || 'N/A';
            document.getElementById('degree-view').textContent = user.degree || 'N/A';
            document.getElementById('major-view').textContent = user.major || 'N/A';
            document.getElementById('current-company-view').textContent = user.current_company || 'N/A';
            document.getElementById('job-title-view').textContent = user.job_title || 'N/A';
            document.getElementById('city-view').textContent = user.city || 'N/A';
            
            // Additional professional details
            const currentYear = new Date().getFullYear();
            const gradYear = parseInt(user.graduation_year) || currentYear;
            const experience = gradYear > 0 ? Math.max(0, currentYear - gradYear) : 'N/A';
            document.getElementById('experience-view').textContent = experience !== 'N/A' ? `${experience} years` : 'N/A';
            
            // Industry (can be derived from company or set as placeholder)
            document.getElementById('industry-view').textContent = user.industry || 'Technology';
            
            // Member since (placeholder - would need created_at from API)
            const memberSinceEl = document.getElementById('member-since');
            if (user.created_at) {
                const memberDate = new Date(user.created_at);
                memberSinceEl.textContent = memberDate.getFullYear();
            } else {
                memberSinceEl.textContent = '2024';
            }
            
            const linkedinLink = document.getElementById('linkedin-view');
            if (user.linkedin) {
                linkedinLink.href = user.linkedin;
                linkedinLink.textContent = user.linkedin;
            } else {
                linkedinLink.textContent = 'N/A';
            }
            
            document.getElementById('email-view').textContent = user.email || 'Not public';

            const profilePic = document.getElementById('profile-pic-view');
            profilePic.src = user.profile_pic_url 
                ? `http://localhost:3000/${user.profile_pic_url}` 
                : createInitialsAvatar(user.full_name);

            profilePic.onerror = () => {
                profilePic.onerror = null;
                profilePic.src = createInitialsAvatar(user.full_name);
            };

            // Render skills
            renderSkills(user);

            // Fetch blogs and stats
            const blogs = await fetchUserBlogs(email);
            await fetchUserStatistics(email);

            // Initialize scroll animations after content is loaded
            setTimeout(() => {
                initScrollAnimations();
            }, 100);

        } catch (error) {
            console.error('Error fetching user profile:', error);
            document.querySelector('.profile-main-view').innerHTML = `<div class="info-message card error">Could not load profile. ${error.message}</div>`;
        }
    };

    const sendMessageBtn = document.getElementById('send-message-btn');
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', async () => {
            const loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
            if (!loggedInUserEmail) {
                showToast('Please log in to send a message.', 'info');
                return;
            }

            try {
                // This will create or find the conversation
                await window.api.post('/messages', {
                    receiver_email: userEmail,
                    content: `Hello!` 
                });
                window.location.href = 'messages.html';
            } catch (error) {
                console.error('Error starting conversation:', error);
                showToast('Could not start a conversation.', 'error');
            }
        });
    }
    
    await fetchUserProfile(userEmail);
});