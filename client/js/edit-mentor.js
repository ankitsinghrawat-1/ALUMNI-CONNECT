document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('edit-mentor-form');
    const expertiseAreasInput = document.getElementById('expertise_areas');
    const unlistBtn = document.getElementById('unlist-mentor-btn');

    if (!localStorage.getItem('alumniConnectToken')) {
        window.location.href = 'login.html';
        return;
    }

    const fetchMentorProfile = async () => {
        try {
            const profile = await window.api.get('/mentors/profile');
            expertiseAreasInput.value = profile.expertise_areas;
        } catch (error) {
            console.error('Error fetching mentor profile:', error);
            showToast('An error occurred while loading your profile.', 'error');
        }
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const expertise_areas = expertiseAreasInput.value;

        try {
            const result = await window.api.put('/mentors/profile', { expertise_areas });
            showToast(result.message, 'success');
            setTimeout(() => window.location.href = 'mentors.html', 2000);
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
            console.error('Error updating mentor profile:', error);
        }
    });

    unlistBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to unlist yourself as a mentor? This action cannot be undone.')) {
            try {
                const result = await window.api.del('/mentors/profile');
                showToast(result.message, 'success');
                setTimeout(() => window.location.href = 'mentors.html', 2000);
            } catch (error) {
                showToast(`Error: ${error.message}`, 'error');
                console.error('Error unlisting mentor:', error);
            }
        }
    });

    await fetchMentorProfile();
});