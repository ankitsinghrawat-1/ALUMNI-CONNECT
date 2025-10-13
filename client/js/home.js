document.addEventListener('DOMContentLoaded', async () => {
    const userEmail = localStorage.getItem('userEmail');
    const joinNowBtn = document.getElementById('join-now-btn');

    if (userEmail && joinNowBtn) {
        // If the user is logged in, hide the "Join Now" button
        joinNowBtn.style.display = 'none';
    }

    // Load dynamic statistics
    const loadStatistics = async () => {
        try {
            // Set loading state for all stats
            const statElements = {
                'alumni-count': 'Loading...',
                'alumni-stats': 'Loading...',
                'companies-count': 'Loading...',
                'jobs-stats': 'Loading...',
                'countries-count': 'Loading...',
                'countries-stats': 'Loading...',
                'events-stats': 'Loading...'
            };

            // Try to load actual statistics from the API
            try {
                // Fetch alumni count
                const alumni = await window.api.get('/users/directory');
                const alumniCount = alumni ? alumni.length : 0;
                
                // Fetch jobs count
                const jobs = await window.api.get('/jobs');
                const jobsCount = jobs ? jobs.length : 0;
                
                // Fetch events count
                const events = await window.api.get('/events');
                const eventsCount = events ? events.length : 0;

                // Update stats with real data if available
                if (document.getElementById('alumni-count')) {
                    document.getElementById('alumni-count').textContent = alumniCount > 0 ? `${alumniCount}+` : 'N/A';
                }
                if (document.getElementById('alumni-stats')) {
                    document.getElementById('alumni-stats').textContent = alumniCount > 0 ? `${alumniCount}+` : 'N/A';
                }
                if (document.getElementById('jobs-stats')) {
                    document.getElementById('jobs-stats').textContent = jobsCount > 0 ? `${jobsCount}+` : 'N/A';
                }
                if (document.getElementById('events-stats')) {
                    document.getElementById('events-stats').textContent = eventsCount > 0 ? `${eventsCount}+` : 'N/A';
                }
                
                // For companies and countries, we'd need separate endpoints
                // Setting reasonable defaults for now
                if (document.getElementById('companies-count')) {
                    document.getElementById('companies-count').textContent = alumniCount > 0 ? `${Math.floor(alumniCount * 0.3)}+` : 'N/A';
                }
                if (document.getElementById('countries-count')) {
                    document.getElementById('countries-count').textContent = alumniCount > 0 ? `${Math.min(50, Math.floor(alumniCount * 0.1))}+` : 'N/A';
                }
                if (document.getElementById('countries-stats')) {
                    document.getElementById('countries-stats').textContent = alumniCount > 0 ? `${Math.min(50, Math.floor(alumniCount * 0.1))}+` : 'N/A';
                }

            } catch (error) {
                // Show friendly message when database is not connected
                const fallbackStats = {
                    'alumni-count': 'Coming Soon',
                    'alumni-stats': 'Coming Soon',
                    'companies-count': 'Coming Soon',
                    'jobs-stats': 'Coming Soon',
                    'countries-count': 'Coming Soon',
                    'countries-stats': 'Coming Soon',
                    'events-stats': 'Coming Soon'
                };

                Object.keys(fallbackStats).forEach(elementId => {
                    const element = document.getElementById(elementId);
                    if (element) {
                        element.textContent = fallbackStats[elementId];
                    }
                });
            }
        } catch (error) {
        }
    };

    // Load statistics
    loadStatistics();
});