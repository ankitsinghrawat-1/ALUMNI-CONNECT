// client/js/jobs.js - Enhanced Career Opportunities with Advanced Features
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const jobsGrid = document.getElementById('jobs-grid');
    const jobSearchInput = document.getElementById('job-search-input');
    const jobSearchButton = document.getElementById('job-search-button');
    const locationFilter = document.getElementById('location-filter');
    const industryFilter = document.getElementById('industry-filter');
    const experienceFilter = document.getElementById('experience-filter');
    const jobTypeFilter = document.getElementById('job-type-filter');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const salaryInsightsCheckbox = document.getElementById('salary-insights');
    const resultsTitle = document.getElementById('results-title');
    const totalJobsCount = document.getElementById('total-jobs');
    const sortSelect = document.getElementById('sort-select');
    const viewButtons = document.querySelectorAll('.view-btn');

    // Mock job data with enhanced features
    const generateMockJobs = () => {
        return [
            {
                job_id: 1,
                title: "Senior Software Engineer",
                company: "Google",
                location: "San Francisco, CA",
                type: "Full-time",
                experience: "Senior Level (6-10 years)",
                industry: "Technology",
                salary_min: 150000,
                salary_max: 220000,
                description: "Join our team building next-generation cloud infrastructure. Work with cutting-edge technologies and collaborate with world-class engineers.",
                skills: ["Python", "Kubernetes", "Go", "Distributed Systems"],
                posted_date: "2025-01-10",
                urgency: "featured",
                alumni_referral: "Sarah Chen",
                remote_friendly: true
            },
            {
                job_id: 2,
                title: "Product Manager",
                company: "Microsoft",
                location: "Seattle, WA",
                type: "Full-time", 
                experience: "Mid Level (3-5 years)",
                industry: "Technology",
                salary_min: 130000,
                salary_max: 180000,
                description: "Drive product strategy for our cloud services platform. Lead cross-functional teams and shape the future of enterprise software.",
                skills: ["Product Strategy", "Data Analysis", "Agile", "Leadership"],
                posted_date: "2025-01-12",
                urgency: "new",
                alumni_referral: "Michael Rodriguez",
                remote_friendly: true
            },
            {
                job_id: 3,
                title: "Marketing Director",
                company: "Tesla",
                location: "Austin, TX",
                type: "Full-time",
                experience: "Senior Level (6-10 years)",
                industry: "Automotive",
                salary_min: 140000,
                salary_max: 190000,
                description: "Lead marketing initiatives for our innovative electric vehicle lineup. Drive brand awareness and customer engagement globally.",
                skills: ["Digital Marketing", "Brand Strategy", "Analytics", "Team Leadership"],
                posted_date: "2025-01-08",
                urgency: "urgent",
                alumni_referral: "Emily Johnson",
                remote_friendly: false
            },
            {
                job_id: 4,
                title: "Investment Analyst",
                company: "Goldman Sachs",
                location: "New York, NY",
                type: "Full-time",
                experience: "Mid Level (3-5 years)",
                industry: "Finance",
                salary_min: 120000,
                salary_max: 160000,
                description: "Analyze investment opportunities in technology and healthcare sectors. Work with high-profile clients on strategic financial decisions.",
                skills: ["Financial Modeling", "Risk Analysis", "Excel", "Bloomberg Terminal"],
                posted_date: "2025-01-11",
                urgency: "new",
                alumni_referral: "David Kim",
                remote_friendly: false
            },
            {
                job_id: 5,
                title: "UX Designer",
                company: "Airbnb",
                location: "San Francisco, CA",
                type: "Full-time",
                experience: "Mid Level (3-5 years)",
                industry: "Technology",
                salary_min: 110000,
                salary_max: 150000,
                description: "Create intuitive and delightful user experiences for millions of travelers worldwide. Shape the future of travel technology.",
                skills: ["User Experience", "Design Thinking", "Figma", "Prototyping"],
                posted_date: "2025-01-09",
                urgency: "featured",
                alumni_referral: "Jennifer Liu",
                remote_friendly: true
            },
            {
                job_id: 6,
                title: "Management Consultant",
                company: "McKinsey & Company",
                location: "Chicago, IL",
                type: "Full-time",
                experience: "Entry Level (0-2 years)",
                industry: "Consulting",
                salary_min: 95000,
                salary_max: 130000,
                description: "Help Fortune 500 companies transform their operations and strategy. Work on diverse projects across multiple industries.",
                skills: ["Strategy", "Operations", "Change Management", "Client Relations"],
                posted_date: "2025-01-13",
                urgency: "new",
                alumni_referral: "Robert Thompson",
                remote_friendly: false
            },
            {
                job_id: 7,
                title: "Data Scientist",
                company: "Netflix",
                location: "Remote",
                type: "Full-time",
                experience: "Senior Level (6-10 years)",
                industry: "Technology",
                salary_min: 160000,
                salary_max: 210000,
                description: "Drive data-driven decision making for content strategy and user experience optimization. Work with petabyte-scale datasets.",
                skills: ["Python", "Machine Learning", "SQL", "A/B Testing"],
                posted_date: "2025-01-07",
                urgency: "urgent",
                alumni_referral: null,
                remote_friendly: true
            },
            {
                job_id: 8,
                title: "Software Engineering Intern",
                company: "Apple",
                location: "Cupertino, CA",
                type: "Internship",
                experience: "Entry Level (0-2 years)",
                industry: "Technology",
                salary_min: 8000,
                salary_max: 10000,
                description: "Join our iOS development team for a summer internship. Work on features used by millions of iPhone users worldwide.",
                skills: ["Swift", "iOS Development", "Xcode", "Git"],
                posted_date: "2025-01-14",
                urgency: "new",
                alumni_referral: null,
                remote_friendly: false
            }
        ];
    };

    // Enhanced job card renderer
    const createEnhancedJobCard = (job) => {
        const jobCard = document.createElement('div');
        jobCard.classList.add('enhanced-job-card', 'card');
        
        const companyInitials = job.company.split(' ').map(word => word[0]).join('');
        const skillsHtml = job.skills.slice(0, 4).map(skill => 
            `<span class="job-skill-tag">${skill}</span>`
        ).join('');
        
        const salaryInsights = salaryInsightsCheckbox.checked ? `
            <div class="job-salary-insights">
                <div class="salary-range">$${(job.salary_min/1000).toFixed(0)}K - $${(job.salary_max/1000).toFixed(0)}K</div>
                <div class="salary-details">Based on ${Math.floor(Math.random() * 50) + 20} similar positions</div>
            </div>
        ` : '';

        const alumniReferralHtml = job.alumni_referral ? `
            <div class="alumni-referral">
                <i class="fas fa-user-graduate"></i>
                Referred by ${job.alumni_referral}
            </div>
        ` : '';

        jobCard.innerHTML = `
            <div class="job-card-header">
                <div class="job-company-logo">
                    ${companyInitials}
                </div>
                <h3 class="job-title">${job.title}</h3>
                <p class="job-company">${job.company}</p>
                <p class="job-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${job.location}
                    ${job.remote_friendly ? '<i class="fas fa-wifi" title="Remote Friendly"></i>' : ''}
                </p>
                <div class="job-badge ${job.urgency}">${job.urgency.charAt(0).toUpperCase() + job.urgency.slice(1)}</div>
            </div>
            
            <div class="job-card-body">
                <div class="job-details">
                    <div class="job-detail-item">
                        <i class="fas fa-briefcase"></i>
                        <span>${job.experience}</span>
                    </div>
                    <div class="job-detail-item">
                        <i class="fas fa-clock"></i>
                        <span>${job.type}</span>
                    </div>
                    <div class="job-detail-item">
                        <i class="fas fa-industry"></i>
                        <span>${job.industry}</span>
                    </div>
                </div>
                
                <div class="job-skills">
                    <div class="job-skills-label">Required Skills:</div>
                    <div class="job-skills-container">
                        ${skillsHtml}
                        ${job.skills.length > 4 ? '<span class="job-skill-tag">+more</span>' : ''}
                    </div>
                </div>
                
                <div class="job-description">
                    ${job.description}
                </div>
                
                ${salaryInsights}
            </div>
            
            <div class="job-card-footer">
                <div class="job-actions">
                    <button class="btn btn-primary apply-btn" data-job-id="${job.job_id}">
                        <i class="fas fa-paper-plane"></i>
                        Apply Now
                    </button>
                    <button class="btn btn-outline save-btn" data-job-id="${job.job_id}">
                        <i class="fas fa-bookmark"></i>
                        Save
                    </button>
                </div>
                <div class="job-footer-info">
                    <div class="job-posted-time">
                        <i class="fas fa-clock"></i>
                        Posted ${getRelativeTime(job.posted_date)}
                    </div>
                    ${alumniReferralHtml}
                </div>
            </div>
        `;

        // Add event listeners
        const applyBtn = jobCard.querySelector('.apply-btn');
        applyBtn.addEventListener('click', () => {
            window.location.href = `apply.html?job_id=${job.job_id}&title=${encodeURIComponent(job.title)}`;
        });

        const saveBtn = jobCard.querySelector('.save-btn');
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleJobSave(job.job_id, saveBtn);
        });

        return jobCard;
    };

    // Helper functions
    const getRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    const toggleJobSave = (jobId, button) => {
        const icon = button.querySelector('i');
        const isSaved = icon.classList.contains('fas');
        
        if (isSaved) {
            icon.classList.remove('fas');
            icon.classList.add('far');
            button.innerHTML = '<i class="far fa-bookmark"></i> Save';
        } else {
            icon.classList.remove('far');
            icon.classList.add('fas');
            button.innerHTML = '<i class="fas fa-bookmark"></i> Saved';
        }
    };

    const showLoading = () => {
        jobsGrid.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                <p>Finding the perfect opportunities for you...</p>
            </div>`;
    };

    const showEmptyState = () => {
        jobsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-briefcase"></i>
                </div>
                <h3>No Jobs Found</h3>
                <p>No job opportunities match your current filters. Try adjusting your search criteria.</p>
                <div class="empty-actions">
                    <button onclick="clearAllFilters()" class="btn btn-outline">Clear Filters</button>
                    <button class="btn btn-primary">Set Job Alerts</button>
                </div>
            </div>`;
    };

    const renderJobs = () => {
        showLoading();
        
        setTimeout(() => {
            const jobs = generateMockJobs();
            jobsGrid.innerHTML = '';
            
            if (jobs.length > 0) {
                totalJobsCount.textContent = jobs.length;
                resultsTitle.textContent = `${jobs.length} Opportunities Found`;
                
                jobs.forEach(job => {
                    const jobCard = createEnhancedJobCard(job);
                    jobsGrid.appendChild(jobCard);
                });
            } else {
                showEmptyState();
            }
        }, 500);
    };

    const performSearch = () => {
        const query = jobSearchInput.value.trim();
        if (query) {
            resultsTitle.textContent = `Search Results for "${query}"`;
        }
        renderJobs();
    };

    const clearAllFilters = () => {
        jobSearchInput.value = '';
        locationFilter.value = '';
        industryFilter.value = '';
        experienceFilter.value = '';
        jobTypeFilter.value = '';
        resultsTitle.textContent = 'Featured Opportunities';
        renderJobs();
    };

    const switchView = (viewType) => {
        viewButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${viewType}"]`).classList.add('active');
        jobsGrid.className = `jobs-grid ${viewType}-view`;
    };

    // Event listeners
    jobSearchButton.addEventListener('click', performSearch);
    jobSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    clearFiltersBtn.addEventListener('click', clearAllFilters);
    salaryInsightsCheckbox.addEventListener('change', renderJobs);
    sortSelect.addEventListener('change', renderJobs);

    [locationFilter, industryFilter, experienceFilter, jobTypeFilter].forEach(filter => {
        filter.addEventListener('change', renderJobs);
    });

    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewType = btn.dataset.view;
            switchView(viewType);
        });
    });

    // Make functions available globally
    window.clearAllFilters = clearAllFilters;

    // Initialize
    renderJobs();
});