// Enhanced Mentor Features - Badges, Recommendations, Comparison, etc.

// Mentor Badges System
async function loadMentorBadges(mentorId) {
    try {
        const response = await window.api.get(`/mentors/${mentorId}/badges`);
        return response.badges || [];
    } catch (error) {
        console.error('Error loading mentor badges:', error);
        return [];
    }
}

function renderMentorBadges(badges, containerElement) {
    if (!badges || badges.length === 0) return;

    containerElement.innerHTML = '';
    
    badges.forEach(badge => {
        const badgeElement = document.createElement('span');
        badgeElement.className = 'mentor-badge';
        badgeElement.style.backgroundColor = badge.color;
        badgeElement.innerHTML = `<i class="fas ${badge.icon}"></i> ${badge.name}`;
        badgeElement.title = badge.name;
        containerElement.appendChild(badgeElement);
    });
}

// Mentor Recommendations System
let recommendationsCache = null;

async function loadRecommendedMentors() {
    if (recommendationsCache) {
        return recommendationsCache;
    }

    try {
        const response = await window.api.get('/mentors/recommendations');
        recommendationsCache = response;
        return response;
    } catch (error) {
        console.error('Error loading recommendations:', error);
        return { recommendations: [], user_industry: null };
    }
}

function renderRecommendationsWidget(recommendations, containerElement) {
    if (!recommendations || recommendations.length === 0) {
        containerElement.style.display = 'none';
        return;
    }

    containerElement.style.display = 'block';
    
    const recommendationsHTML = `
        <div class="recommendations-widget">
            <div class="widget-header">
                <h3><i class="fas fa-magic"></i> Recommended for You</h3>
                <p>Mentors matched to your profile and interests</p>
            </div>
            <div class="recommendations-grid">
                ${recommendations.map(mentor => `
                    <div class="recommendation-card" data-mentor-id="${mentor.mentor_id}" onclick="window.location.href='browse-mentors.html#mentor-${mentor.mentor_id}'">
                        <div class="rec-avatar">
                            <img src="${mentor.profile_pic_url || createInitialsAvatar(mentor.full_name)}" 
                                 alt="${sanitizeHTML(mentor.full_name)}" />
                        </div>
                        <div class="rec-info">
                            <h4>${sanitizeHTML(mentor.full_name)}</h4>
                            <p class="rec-title">${sanitizeHTML(mentor.job_title || '')}</p>
                            <div class="rec-rating">
                                <i class="fas fa-star"></i>
                                <span>${parseFloat(mentor.average_rating || 0).toFixed(1)}</span>
                                <span class="rec-reviews">(${mentor.total_reviews || 0})</span>
                            </div>
                            <span class="rec-reason">${getRecommendationReasonText(mentor.recommendation_reason)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    containerElement.innerHTML = recommendationsHTML;
}

function getRecommendationReasonText(reason) {
    const reasons = {
        'same_industry': 'Same industry as you',
        'top_rated': 'Highly rated mentor',
        'popular': 'Popular choice',
        'similar_interests': 'Similar interests'
    };
    return reasons[reason] || 'Recommended';
}

// Mentor Comparison System
let comparisonList = [];
const MAX_COMPARISON = 3;

function addToComparison(mentor) {
    if (comparisonList.length >= MAX_COMPARISON) {
        showToast(`You can only compare up to ${MAX_COMPARISON} mentors at a time`, 'warning');
        return false;
    }

    if (comparisonList.find(m => m.mentor_id === mentor.mentor_id)) {
        showToast('This mentor is already in your comparison list', 'info');
        return false;
    }

    comparisonList.push(mentor);
    updateComparisonWidget();
    showToast(`${mentor.full_name} added to comparison`, 'success');
    return true;
}

function removeFromComparison(mentorId) {
    comparisonList = comparisonList.filter(m => m.mentor_id !== mentorId);
    updateComparisonWidget();
    showToast('Mentor removed from comparison', 'success');
}

function clearComparison() {
    comparisonList = [];
    updateComparisonWidget();
}

function updateComparisonWidget() {
    const widget = document.getElementById('comparison-widget');
    if (!widget) return;

    if (comparisonList.length === 0) {
        widget.style.display = 'none';
        return;
    }

    widget.style.display = 'block';
    
    const widgetHTML = `
        <div class="comparison-header">
            <h4>Compare Mentors (${comparisonList.length}/${MAX_COMPARISON})</h4>
            <button class="btn-clear" onclick="clearComparison()">
                <i class="fas fa-times"></i> Clear All
            </button>
        </div>
        <div class="comparison-items">
            ${comparisonList.map(mentor => `
                <div class="comparison-item">
                    <img src="${mentor.profile_pic_url || createInitialsAvatar(mentor.full_name)}" 
                         alt="${sanitizeHTML(mentor.full_name)}" />
                    <span>${sanitizeHTML(mentor.full_name)}</span>
                    <button onclick="removeFromComparison(${mentor.mentor_id})" class="btn-remove">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('')}
        </div>
        <button class="btn btn-primary btn-compare" onclick="showComparisonModal()">
            <i class="fas fa-balance-scale"></i> Compare Now
        </button>
    `;
    
    widget.innerHTML = widgetHTML;
}

function showComparisonModal() {
    if (comparisonList.length < 2) {
        showToast('Please select at least 2 mentors to compare', 'warning');
        return;
    }

    const modal = document.getElementById('comparison-modal');
    if (!modal) {
        createComparisonModal();
    }

    const modalContent = document.getElementById('comparison-modal-content');
    
    const comparisonHTML = `
        <div class="comparison-table-wrapper">
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th class="criteria-column">Criteria</th>
                        ${comparisonList.map(mentor => `
                            <th>
                                <div class="mentor-header-cell">
                                    <img src="${mentor.profile_pic_url || createInitialsAvatar(mentor.full_name)}" 
                                         alt="${sanitizeHTML(mentor.full_name)}" />
                                    <div>
                                        <h4>${sanitizeHTML(mentor.full_name)}</h4>
                                        <p>${sanitizeHTML(mentor.job_title || '')}</p>
                                    </div>
                                </div>
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="criteria-label">Rating</td>
                        ${comparisonList.map(mentor => `
                            <td>
                                <div class="rating-cell">
                                    <i class="fas fa-star"></i>
                                    <span>${parseFloat(mentor.average_rating || 0).toFixed(1)}</span>
                                    <span class="reviews-count">(${mentor.total_reviews || 0} reviews)</span>
                                </div>
                            </td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="criteria-label">Experience</td>
                        ${comparisonList.map(mentor => `
                            <td>${mentor.experience_years || 0} years</td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="criteria-label">Industry</td>
                        ${comparisonList.map(mentor => `
                            <td>${sanitizeHTML(mentor.industry || 'N/A')}</td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="criteria-label">Sessions</td>
                        ${comparisonList.map(mentor => `
                            <td>${mentor.total_sessions || 0} sessions</td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="criteria-label">Mentees</td>
                        ${comparisonList.map(mentor => `
                            <td>${mentor.total_mentees || 0} mentees</td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="criteria-label">Response Time</td>
                        ${comparisonList.map(mentor => `
                            <td>${mentor.response_time_hours || 24}h avg</td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="criteria-label">Hourly Rate</td>
                        ${comparisonList.map(mentor => `
                            <td>${mentor.hourly_rate > 0 ? '$' + mentor.hourly_rate : 'Free'}</td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="criteria-label">Specializations</td>
                        ${comparisonList.map(mentor => `
                            <td class="specializations-cell">
                                ${mentor.specializations ? 
                                    mentor.specializations.split(',').slice(0, 3).map(spec => 
                                        `<span class="spec-tag">${sanitizeHTML(spec.trim())}</span>`
                                    ).join('') 
                                    : 'N/A'}
                            </td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="criteria-label">Actions</td>
                        ${comparisonList.map(mentor => `
                            <td>
                                <button class="btn btn-primary btn-sm" onclick="window.location.href='browse-mentors.html#mentor-${mentor.mentor_id}'">
                                    View Profile
                                </button>
                            </td>
                        `).join('')}
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    modalContent.innerHTML = comparisonHTML;
    document.getElementById('comparison-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function createComparisonModal() {
    const modal = document.createElement('div');
    modal.id = 'comparison-modal';
    modal.className = 'modal comparison-modal';
    modal.innerHTML = `
        <div class="modal-content comparison-modal-content">
            <div class="modal-header">
                <h2>Compare Mentors</h2>
                <span class="close-btn" onclick="closeComparisonModal()">&times;</span>
            </div>
            <div id="comparison-modal-content"></div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeComparisonModal() {
    const modal = document.getElementById('comparison-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Track mentor profile views
async function trackMentorView(mentorId) {
    try {
        await window.api.post(`/mentors/${mentorId}/track-view`, {});
    } catch (error) {
        console.error('Error tracking mentor view:', error);
    }
}

// Load trending mentors
async function loadTrendingMentors(limit = 6) {
    try {
        const response = await window.api.get('/mentors/featured/trending', { params: { limit } });
        return response.trending || [];
    } catch (error) {
        console.error('Error loading trending mentors:', error);
        return [];
    }
}

function renderTrendingMentors(mentors, containerElement) {
    if (!mentors || mentors.length === 0) {
        containerElement.style.display = 'none';
        return;
    }

    containerElement.style.display = 'block';
    
    const trendingHTML = `
        <div class="trending-section">
            <div class="section-header">
                <h3><i class="fas fa-fire"></i> Trending Mentors</h3>
                <p>Most viewed and highly engaged mentors this week</p>
            </div>
            <div class="trending-grid">
                ${mentors.map((mentor, index) => `
                    <div class="trending-card" data-mentor-id="${mentor.mentor_id}" onclick="window.location.href='browse-mentors.html#mentor-${mentor.mentor_id}'">
                        <div class="trending-rank">#${index + 1}</div>
                        ${mentor.is_premium ? '<span class="premium-badge"><i class="fas fa-crown"></i></span>' : ''}
                        <div class="trending-avatar">
                            <img src="${mentor.profile_pic_url || createInitialsAvatar(mentor.full_name)}" 
                                 alt="${sanitizeHTML(mentor.full_name)}" />
                        </div>
                        <div class="trending-info">
                            <h4>${sanitizeHTML(mentor.full_name)}</h4>
                            <p class="trending-title">${sanitizeHTML(mentor.job_title || '')}</p>
                            <p class="trending-company">${sanitizeHTML(mentor.company || '')}</p>
                            <div class="trending-stats">
                                <span><i class="fas fa-star"></i> ${parseFloat(mentor.average_rating || 0).toFixed(1)}</span>
                                <span><i class="fas fa-users"></i> ${mentor.total_sessions || 0} sessions</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    containerElement.innerHTML = trendingHTML;
}

// Skeleton loaders
function showSkeletonLoader(containerElement, count = 6) {
    const skeletonHTML = Array(count).fill(0).map(() => `
        <div class="mentor-card skeleton">
            <div class="skeleton-header">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
            </div>
            <div class="skeleton-body">
                <div class="skeleton-text"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
            </div>
            <div class="skeleton-footer">
                <div class="skeleton-button"></div>
                <div class="skeleton-button"></div>
            </div>
        </div>
    `).join('');
    
    containerElement.innerHTML = skeletonHTML;
}

// Utility functions  
if (typeof window.sanitizeHTML === 'undefined') {
    window.sanitizeHTML = function(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };
}

// Alias for convenience
const sanitizeHTML = window.sanitizeHTML;

function createInitialsAvatar(name) {
    if (!name) return '';
    const initials = name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const color = colors[name.length % colors.length];
    
    return `data:image/svg+xml,${encodeURIComponent(`
        <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="40" fill="${color}"/>
            <text x="40" y="48" font-family="Arial, sans-serif" font-size="18" font-weight="bold" 
                  fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
        </svg>
    `)}`;
}

function showToast(message, type = 'info') {
    if (window.Toastify) {
        const backgrounds = {
            success: 'linear-gradient(to right, #00b09b, #96c93d)',
            error: 'linear-gradient(to right, #ff5f6d, #ffc371)',
            info: 'linear-gradient(to right, #667eea, #764ba2)',
            warning: 'linear-gradient(to right, #f093fb, #f5576c)'
        };

        window.Toastify({
            text: message,
            duration: 3000,
            gravity: 'top',
            position: 'right',
            background: backgrounds[type] || backgrounds.info,
            stopOnFocus: true
        }).showToast();
    }
}

// Export functions for global use
if (typeof window !== 'undefined') {
    window.mentorFeatures = {
        loadMentorBadges,
        renderMentorBadges,
        loadRecommendedMentors,
        renderRecommendationsWidget,
        addToComparison,
        removeFromComparison,
        clearComparison,
        showComparisonModal,
        closeComparisonModal,
        trackMentorView,
        loadTrendingMentors,
        renderTrendingMentors,
        showSkeletonLoader
    };
}
