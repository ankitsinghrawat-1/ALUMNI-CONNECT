// client/js/directory.js
document.addEventListener('DOMContentLoaded', async () => {
    const alumniListContainer = document.getElementById('directory-list');
    const searchInput = document.getElementById('directory-search-input');
    const majorFilter = document.getElementById('major-filter');
    const yearFilter = document.getElementById('year-filter');
    const cityFilter = document.getElementById('city-filter');
    const industryFilter = document.getElementById('industry-filter');
    const skillsFilter = document.getElementById('skills-filter');
    const searchButton = document.getElementById('directory-search-button');

    const showLoading = () => {
        alumniListContainer.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
    };

    const showEmptyState = () => {
        alumniListContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No Alumni Found</h3>
                <p>No alumni matched your search criteria. Try broadening your search.</p>
            </div>`;
    };

    const fetchAndRenderAlumni = async () => {
        showLoading();

        const params = new URLSearchParams();
        if (searchInput.value) params.append('query', searchInput.value);
        if (majorFilter.value) params.append('major', majorFilter.value);
        if (yearFilter.value) params.append('graduation_year', yearFilter.value);
        if (cityFilter.value) params.append('city', cityFilter.value);
        if (industryFilter.value) params.append('industry', industryFilter.value);
        if (skillsFilter.value) params.append('skills', skillsFilter.value);
        
        try {
            const alumni = await window.api.get(`/users/directory?${params.toString()}`);
            alumniListContainer.innerHTML = '';

            if (alumni.length > 0) {
                alumni.forEach(alumnus => {
                    const alumnusItem = document.createElement('div');
                    alumnusItem.classList.add('alumnus-list-item', 'card');
                    
                    const profilePicUrl = alumnus.profile_pic_url 
                        ? `http://localhost:3000/${alumnus.profile_pic_url}` 
                        : createInitialsAvatar(alumnus.full_name);
                    
                    alumnusItem.innerHTML = `
                        <img src="${profilePicUrl}" alt="${sanitizeHTML(alumnus.full_name)}" class="alumnus-pfp-round" onerror="this.onerror=null; this.src=createInitialsAvatar('${alumnus.full_name.replace(/'/g, "\\'")}');">
                        <div class="alumnus-details">
                            <h3>
                                ${sanitizeHTML(alumnus.full_name)}
                                ${alumnus.verification_status === 'verified' ? '<span class="verified-badge-sm" title="Verified"><i class="fas fa-check-circle"></i></span>' : ''}
                            </h3>
                            <p><i class="fas fa-briefcase"></i> ${sanitizeHTML(alumnus.job_title ? alumnus.job_title + ' at ' : '')}${sanitizeHTML(alumnus.current_company || 'N/A')}</p>
                            <p><i class="fas fa-graduation-cap"></i> ${sanitizeHTML(alumnus.major || 'N/A')} | Class of ${sanitizeHTML(alumnus.graduation_year || 'N/A')}</p>
                            <a href="view-profile.html?email=${alumnus.email}" class="btn btn-secondary">View Profile</a>
                        </div>
                    `;
                    alumniListContainer.appendChild(alumnusItem);
                });
            } else {
                showEmptyState();
            }
        } catch (error) {
            console.error('Error fetching alumni:', error);
            alumniListContainer.innerHTML = '<p class="info-message error">Failed to load alumni. Please try again later.</p>';
        }
    };

    searchButton?.addEventListener('click', fetchAndRenderAlumni);

    const filterInputs = [searchInput, majorFilter, yearFilter, cityFilter, industryFilter, skillsFilter];
    filterInputs.forEach(input => {
        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                fetchAndRenderAlumni();
            }
        });
    });

    // Initial load
    fetchAndRenderAlumni();
});