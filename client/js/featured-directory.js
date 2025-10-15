// client/js/featured-directory.js - Featured Alumni Carousel
document.addEventListener('DOMContentLoaded', async () => {
    const carousel = document.getElementById('alumni-carousel');
    const searchInput = document.getElementById('search-input');
    let allAlumni = [];
    let swiper = null;

    // Toast notification
    const showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // Load alumni data
    const loadFeaturedAlumni = async (searchQuery = '') => {
        try {
            // Fetch alumni data (get more for featured)
            const response = await window.api.get('/users/directory?limit=50');
            let alumni = response.data || response; // Handle both formats
            
            // Filter for featured or select top alumni (you can modify criteria)
            // For now, we'll show all alumni but you can add a 'featured' field in database
            allAlumni = alumni;
            
            // Apply search filter
            if (searchQuery) {
                alumni = alumni.filter(alumnus => 
                    alumnus.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (alumnus.current_company && alumnus.current_company.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (alumnus.major && alumnus.major.toLowerCase().includes(searchQuery.toLowerCase()))
                );
            }

            // Limit to first 20 for carousel performance
            alumni = alumni.slice(0, 20);

            renderCarousel(alumni);
        } catch (error) {
            console.error('Error loading alumni:', error);
            showToast('Failed to load featured alumni', 'error');
        }
    };

    // Render carousel
    const renderCarousel = (alumni) => {
        carousel.innerHTML = '';

        if (alumni.length === 0) {
            carousel.innerHTML = `
                <div class="swiper-slide">
                    <div style="text-align: center; padding: 3rem;">
                        <i class="fas fa-search" style="font-size: 4rem; color: #ccc; margin-bottom: 1rem;"></i>
                        <h2 style="color: #666;">No alumni found</h2>
                        <p style="color: #999;">Try a different search term</p>
                    </div>
                </div>
            `;
            return;
        }

        alumni.forEach(alumnus => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            slide.innerHTML = createAlumniCard(alumnus);
            carousel.appendChild(slide);
        });

        initSwiper();
    };

    // Create alumni card
    const createAlumniCard = (alumnus) => {
        const roleConfig = {
            alumni: { label: 'Alumni', icon: 'fa-user-graduate', color: '#667eea' },
            student: { label: 'Student', icon: 'fa-graduation-cap', color: '#10b981' },
            faculty: { label: 'Faculty', icon: 'fa-chalkboard-teacher', color: '#f59e0b' },
            employer: { label: 'Employer', icon: 'fa-building', color: '#ef4444' },
            institute: { label: 'Institute', icon: 'fa-university', color: '#8b5cf6' }
        };

        const role = alumnus.role || 'alumni';
        const userRole = roleConfig[role] || roleConfig.alumni;

        const bookmarkedAlumni = JSON.parse(localStorage.getItem('bookmarkedAlumni') || '[]');
        const isBookmarked = bookmarkedAlumni.includes(alumnus.email);

        // Determine if alumni is "featured" (you can customize this logic)
        const isFeatured = alumnus.verification_status === 'verified' || Math.random() > 0.7;

        // Get default avatar based on user's name initial
        const getDefaultAvatar = (name) => {
            const initial = name.charAt(0).toUpperCase();
            const colors = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899'];
            const colorIndex = name.charCodeAt(0) % colors.length;
            const bgColor = colors[colorIndex];
            
            return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='120' height='120' fill='${encodeURIComponent(bgColor)}'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='60' fill='white' font-weight='bold'%3E${initial}%3C/text%3E%3C/svg%3E`;
        };

        const avatarUrl = alumnus.profile_pic_url || getDefaultAvatar(alumnus.full_name);

        return `
            <div class="alumni-card">
                <div class="card-header">
                    ${isFeatured ? '<div class="featured-badge"><i class="fas fa-star"></i> Featured</div>' : ''}
                </div>
                <div class="avatar-container" style="text-align: center;">
                    <img src="${avatarUrl}" 
                         alt="${alumnus.full_name}" 
                         class="avatar"
                         onerror="this.src='${getDefaultAvatar(alumnus.full_name)}'">
                </div>
                <div class="card-body">
                    <h2>
                        ${alumnus.full_name}
                        ${alumnus.verification_status === 'verified' ? '<i class="fas fa-check-circle verified-icon"></i>' : ''}
                    </h2>
                    <p class="position">${alumnus.job_title || 'Alumni Member'}</p>
                    <p class="company">${alumnus.current_company || ''}</p>
                    
                    <div class="role-badge" style="background: ${userRole.color}; color: white;">
                        <i class="fas ${userRole.icon}"></i>
                        <span>${userRole.label}</span>
                    </div>

                    <div class="details">
                        ${alumnus.major ? `
                        <div class="detail-item">
                            <i class="fas fa-graduation-cap"></i>
                            <span>${alumnus.major}</span>
                        </div>
                        ` : ''}
                        ${alumnus.graduation_year ? `
                        <div class="detail-item">
                            <i class="fas fa-calendar"></i>
                            <span>${alumnus.graduation_year}</span>
                        </div>
                        ` : ''}
                    </div>

                    <div class="action-buttons">
                        <button class="btn-view" onclick="window.location.href='view-profile.html?id=${alumnus.user_id}'">
                            <i class="fas fa-user"></i>
                            View Profile
                        </button>
                        <button class="btn-bookmark ${isBookmarked ? 'bookmarked' : ''}" 
                                data-email="${alumnus.email}"
                                data-name="${alumnus.full_name}">
                            <i class="fas fa-bookmark"></i>
                            ${isBookmarked ? 'Saved' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    // Initialize Swiper
    const initSwiper = () => {
        if (swiper) {
            swiper.destroy();
        }

        swiper = new Swiper('.swiper', {
            slidesPerView: 1,
            spaceBetween: 30,
            loop: false,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                640: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                },
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 30,
                },
            },
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
        });

        // Add bookmark event listeners after swiper is initialized
        setTimeout(() => {
            document.querySelectorAll('.btn-bookmark').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const email = btn.dataset.email;
                    const name = btn.dataset.name;
                    toggleBookmark(email, name, btn);
                });
            });
        }, 100);
    };

    // Toggle bookmark
    const toggleBookmark = (email, name, btn) => {
        const bookmarkedAlumni = JSON.parse(localStorage.getItem('bookmarkedAlumni') || '[]');
        const index = bookmarkedAlumni.indexOf(email);

        if (index > -1) {
            bookmarkedAlumni.splice(index, 1);
            btn.classList.remove('bookmarked');
            btn.innerHTML = '<i class="fas fa-bookmark"></i> Save';
            showToast(`Removed ${name} from bookmarks`, 'info');
        } else {
            bookmarkedAlumni.push(email);
            btn.classList.add('bookmarked');
            btn.innerHTML = '<i class="fas fa-bookmark"></i> Saved';
            showToast(`Added ${name} to bookmarks`, 'success');
        }

        localStorage.setItem('bookmarkedAlumni', JSON.stringify(bookmarkedAlumni));
    };

    // Search functionality
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadFeaturedAlumni(e.target.value.trim());
        }, 300);
    });

    // Initial load
    loadFeaturedAlumni();
});
