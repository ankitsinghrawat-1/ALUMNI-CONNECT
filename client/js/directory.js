// client/js/directory.js
document.addEventListener('DOMContentLoaded', async () => {
    const alumniListContainer = document.getElementById('directory-list');
    const searchInput = document.getElementById('directory-search-input');
    const universityFilter = document.getElementById('university-filter');
    const majorFilter = document.getElementById('major-filter');
    const yearFilter = document.getElementById('year-filter');
    const cityFilter = document.getElementById('city-filter');
    const industryFilter = document.getElementById('industry-filter'); // New
    const skillsFilter = document.getElementById('skills-filter');     // New
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

        // Read values from all filters, including the new ones
        const params = new URLSearchParams({
            query: searchInput.value,
            university: universityFilter.value,
            major: majorFilter.value,
            graduation_year: yearFilter.value,
            city: cityFilter.value,
            industry: industryFilter.value,
            skills: skillsFilter.value
        });

        try {
            // The api.js helper will automatically handle the request
            const alumni = await window.api.get(`/users/directory?${params.toString()}`);
            alumniListContainer.innerHTML = '';

            if (alumni.length > 0) {
                alumni.forEach(alumnus => {
                    const alumnusItem = document.createElement('div');
                    alumnusItem.classList.add('alumnus-list-item');
                    
                    const profilePicUrl = alumnus.profile_pic_url 
                        ? `http://localhost:3000/${alumnus.profile_pic_url}` 
                        : createInitialsAvatar(alumnus.full_name);

                    alumnusItem.innerHTML = `
                        <img src="${profilePicUrl}" alt="${sanitizeHTML(alumnus.full_name)}" class="alumnus-pfp-round">
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

    const filterInputs = [searchInput, universityFilter, majorFilter, yearFilter, cityFilter, industryFilter, skillsFilter];
    filterInputs.forEach(input => {
        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                fetchAndRenderAlumni();
            }
        });
    });

    await fetchAndRenderAlumni();
});