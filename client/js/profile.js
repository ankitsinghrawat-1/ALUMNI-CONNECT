// client/js/profile.js
document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('profile-form');
    const userEmail = localStorage.getItem('loggedInUserEmail');
    const userRole = localStorage.getItem('userRole');
    const navLinks = document.querySelectorAll('.profile-nav a');
    const pages = document.querySelectorAll('.profile-page');
    const profilePic = document.getElementById('profile-pic');
    const uploadBtn = document.getElementById('upload-btn');
    const pfpUpload = document.getElementById('profile_picture');
    const privacyForm = document.getElementById('privacy-form');
    const passwordForm = document.getElementById('password-form');
    const verificationSection = document.getElementById('verification-status-section');

    // Comprehensive dropdown data with suggestions
    const dropdownData = {
        skills: [
            'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
            'React', 'Angular', 'Vue.js', 'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'Laravel',
            'MongoDB', 'MySQL', 'PostgreSQL', 'Redis', 'Elasticsearch', 'Oracle', 'SQL Server',
            'Docker', 'Kubernetes', 'Jenkins', 'Git', 'GitHub', 'GitLab', 'Terraform', 'Ansible',
            'AWS', 'Azure', 'Google Cloud', 'Firebase', 'Heroku', 'Netlify', 'Vercel',
            'Machine Learning', 'Deep Learning', 'Data Science', 'Artificial Intelligence', 'TensorFlow', 'PyTorch',
            'Data Analysis', 'Data Visualization', 'Tableau', 'Power BI', 'Excel', 'R', 'Pandas', 'NumPy',
            'UI/UX Design', 'Figma', 'Adobe XD', 'Sketch', 'Adobe Photoshop', 'Adobe Illustrator', 'InDesign',
            'Digital Marketing', 'SEO', 'SEM', 'Google Analytics', 'Social Media Marketing', 'Content Marketing', 'Email Marketing',
            'Content Writing', 'Copywriting', 'Technical Writing', 'Blog Writing', 'Grant Writing',
            'Project Management', 'Agile', 'Scrum', 'Kanban', 'Jira', 'Trello', 'Asana', 'Monday.com',
            'Leadership', 'Team Management', 'Strategic Planning', 'Business Analysis', 'Process Improvement',
            'Communication', 'Public Speaking', 'Presentation Skills', 'Negotiation', 'Sales', 'Customer Service',
            'Accounting', 'Financial Analysis', 'Investment Analysis', 'Risk Management', 'Auditing', 'Taxation',
            'HR Management', 'Recruitment', 'Training & Development', 'Performance Management', 'Employee Relations',
            'Supply Chain Management', 'Logistics', 'Procurement', 'Quality Assurance', 'Six Sigma', 'Lean Manufacturing',
            'Cybersecurity', 'Network Security', 'Information Security', 'Penetration Testing', 'CISSP', 'CEH',
            'Mobile Development', 'iOS Development', 'Android Development', 'Flutter', 'React Native', 'Xamarin',
            'Game Development', 'Unity', 'Unreal Engine', 'C++ Game Programming', '3D Modeling', 'Animation',
            'Blockchain', 'Cryptocurrency', 'Smart Contracts', 'Solidity', 'Web3', 'DeFi',
            'DevOps', 'CI/CD', 'Linux', 'Shell Scripting', 'System Administration', 'Network Administration',
            'Business Intelligence', 'ETL', 'Data Warehousing', 'OLAP', 'Reporting', 'Dashboard Development',
            'Video Editing', 'Audio Production', 'Graphic Design', '3D Design', 'Web Design', 'Brand Design',
            'Teaching', 'Training', 'Curriculum Development', 'Educational Technology', 'E-learning Development',
            'Research', 'Statistical Analysis', 'Survey Design', 'Academic Writing', 'Literature Review'
        ],
        specialization: [
            'Full Stack Development', 'Frontend Development', 'Backend Development', 'Mobile App Development',
            'Data Science', 'Machine Learning', 'Artificial Intelligence', 'Cybersecurity', 'DevOps',
            'Cloud Computing', 'Database Administration', 'UI/UX Design', 'Product Management',
            'Digital Marketing', 'Content Strategy', 'Brand Management', 'Financial Analysis',
            'Investment Banking', 'Management Consulting', 'Human Resources', 'Operations Management'
        ],
        industry: [
            'Technology', 'Software', 'Information Technology', 'Consulting', 'Finance', 'Banking',
            'Investment Banking', 'Healthcare', 'Pharmaceutical', 'Biotechnology', 'Education',
            'Manufacturing', 'Retail', 'E-commerce', 'Real Estate', 'Construction', 'Energy',
            'Telecommunications', 'Media', 'Entertainment', 'Non-profit', 'Government', 'Automotive',
            'Aerospace', 'Food & Beverage', 'Fashion', 'Travel & Hospitality'
        ],
        languages: [
            'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Russian',
            'Portuguese', 'Italian', 'Dutch', 'Arabic', 'Hindi', 'Bengali', 'Tamil', 'Telugu',
            'Marathi', 'Gujarati', 'Punjabi', 'Urdu', 'Persian', 'Turkish', 'Polish', 'Swedish'
        ],
        department: [
            'Computer Science', 'Engineering', 'Electrical Engineering', 'Mechanical Engineering',
            'Civil Engineering', 'Chemical Engineering', 'Business Administration', 'Marketing',
            'Finance', 'Accounting', 'Economics', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
            'Psychology', 'Sociology', 'Political Science', 'International Relations', 'Literature',
            'History', 'Philosophy', 'Art', 'Music', 'Theatre', 'Journalism', 'Communications'
        ],
        major: [
            'Computer Science', 'Software Engineering', 'Information Technology', 'Data Science',
            'Business Administration', 'Marketing', 'Finance', 'Economics', 'Mechanical Engineering',
            'Electrical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Biology',
            'Chemistry', 'Physics', 'Mathematics', 'Psychology', 'Sociology', 'Political Science',
            'International Relations', 'English Literature', 'History', 'Philosophy', 'Art',
            'Music', 'Theatre', 'Journalism', 'Communications', 'Medicine', 'Nursing', 'Law'
        ],
        city: [
            'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio',
            'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'San Francisco', 'Columbus',
            'Charlotte', 'Fort Worth', 'Indianapolis', 'Seattle', 'Denver', 'Boston', 'Washington DC',
            'Nashville', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune',
            'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Visakhapatnam',
            'London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol',
            'Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg'
        ],
        country: [
            'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Italy', 'Spain',
            'Netherlands', 'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'Belgium',
            'Austria', 'Portugal', 'Poland', 'Czech Republic', 'Hungary', 'Slovakia', 'Slovenia', 'Croatia',
            'India', 'China', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Thailand', 'Indonesia',
            'Philippines', 'Vietnam', 'Taiwan', 'Hong Kong', 'United Arab Emirates', 'Saudi Arabia', 'Israel',
            'Brazil', 'Mexico', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Venezuela', 'Ecuador',
            'South Africa', 'Nigeria', 'Kenya', 'Ghana', 'Morocco', 'Egypt', 'Tunisia', 'Ethiopia',
            'Russia', 'Ukraine', 'Turkey', 'Greece', 'Romania', 'Bulgaria', 'Serbia', 'Bosnia and Herzegovina',
            'New Zealand', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Myanmar', 'Cambodia', 'Laos'
        ],
        graduation_year: (() => {
            const years = [];
            const currentYear = new Date().getFullYear();
            for (let year = currentYear + 5; year >= currentYear - 50; year--) {
                years.push(year.toString());
            }
            return years;
        })()
    };

    // Role-specific field configurations that match user needs
    // NOTE: This configuration is duplicated in server/api/users.js (line ~342)
    // Any changes here MUST be synchronized with the server-side definition
    const roleFieldsConfig = {
        alumni: ['full_name', 'bio', 'city', 'phone_number', 'linkedin_profile', 'company', 'job_title', 'industry', 'skills', 'institute_name', 'major', 'graduation_year', 'department', 'experience_years', 'specialization', 'achievements', 'certifications', 'languages'],
        student: ['full_name', 'bio', 'city', 'phone_number', 'linkedin_profile', 'skills', 'institute_name', 'major', 'graduation_year', 'department', 'expected_graduation', 'current_year', 'gpa', 'research_interests', 'languages'],
        faculty: ['full_name', 'bio', 'city', 'phone_number', 'linkedin_profile', 'company', 'job_title', 'industry', 'skills', 'department', 'experience_years', 'specialization', 'current_position', 'research_interests', 'achievements', 'certifications', 'languages'],
        employer: ['full_name', 'bio', 'city', 'phone_number', 'industry', 'website', 'company_size', 'founded_year', 'languages'],
        institute: ['full_name', 'bio', 'city', 'phone_number', 'website', 'founded_year', 'student_count', 'languages']
    };

    // Profile section tab functionality
    const profileSectionTabs = document.querySelectorAll('.profile-section-tab');
    const profileSectionContents = document.querySelectorAll('.profile-section-content');

    // Profile section tab switching
    profileSectionTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = e.currentTarget.getAttribute('data-section');
            
            // Remove active class from all tabs and contents
            profileSectionTabs.forEach(t => t.classList.remove('active'));
            profileSectionContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to current tab and content
            e.currentTarget.classList.add('active');
            const targetContent = document.getElementById(`${targetSection}-info`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    const displayMessage = (message, type = 'error', containerId = 'message') => {
        const messageContainer = document.getElementById(containerId);
        if (messageContainer) {
            messageContainer.textContent = message;
            messageContainer.className = `form-message ${type}`;
            setTimeout(() => {
                messageContainer.textContent = '';
                messageContainer.className = 'form-message';
            }, 5000);
        }
    };

    if (!userEmail) {
        window.location.href = 'login.html';
        return;
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.hasAttribute('data-tab')) {
                e.preventDefault();
                const targetTab = e.currentTarget.getAttribute('data-tab');
                window.location.hash = targetTab;
            }
        });
    });

    const handleTabSwitching = () => {
        const hash = window.location.hash.substring(1) || 'edit-profile';
        document.querySelectorAll('.profile-nav a').forEach(nav => nav.classList.remove('active'));
        document.querySelectorAll('.profile-page').forEach(page => page.classList.remove('active'));
        document.querySelector(`.profile-nav a[data-tab="${hash}"]`)?.classList.add('active');
        document.getElementById(hash)?.classList.add('active');
    };
    
    window.addEventListener('hashchange', handleTabSwitching);
    handleTabSwitching();

    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => pfpUpload.click());
    }

    if (pfpUpload) {
        pfpUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => { profilePic.src = event.target.result; };
                reader.readAsDataURL(file);
            }
        });
    }

    const renderVerificationStatus = (status) => {
        // Find the profile picture section to add status below it
        const profilePicSection = document.querySelector('.profile-pic-section');
        if (!profilePicSection) return;
        
        // Remove any existing status display
        const existingStatus = profilePicSection.querySelector('.verification-status-display');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        let statusText = '';
        let statusClass = '';
        let statusIcon = '';
        
        switch(status) {
            case 'verified':
                statusText = 'Verified';
                statusClass = 'verified';
                statusIcon = 'fas fa-check-circle';
                break;
            case 'pending':
                statusText = 'Request Pending';
                statusClass = 'pending';
                statusIcon = 'fas fa-clock';
                break;
            default:
                statusText = 'Unverified';
                statusClass = 'unverified';
                statusIcon = 'fas fa-exclamation-circle';
                break;
        }
        
        const statusDisplay = document.createElement('div');
        statusDisplay.className = `verification-status-display ${statusClass}`;
        statusDisplay.innerHTML = `
            <i class="${statusIcon}"></i>
            <span>${statusText}</span>
        `;
        
        profilePicSection.appendChild(statusDisplay);
        
        // If verificationSection exists, add request verification button for unverified users
        if (verificationSection && status === 'unverified') {
            verificationSection.innerHTML = `
                <div class="verification-actions">
                    <button id="request-verification-btn" class="btn btn-primary btn-sm">
                        <i class="fas fa-shield-alt"></i> Request Verification
                    </button>
                </div>
            `;
        } else if (verificationSection) {
            verificationSection.innerHTML = '';
        }
    };

    const updateProfileViewForRole = (role) => {
        const profilePage = document.getElementById('edit-profile');
        if (!profilePage) return;

        // Hide all role-specific fields
        profilePage.querySelectorAll('[data-role]').forEach(el => {
            el.style.display = 'none';
        });

        // Show fields relevant to the current user's role
        profilePage.querySelectorAll(`[data-role*="${role}"]`).forEach(el => {
            el.style.display = 'flex'; // Use flex for profile-field
        });
        
        // Adjust labels based on role
        const nameLabel = document.getElementById('full_name_label');
        if (role === 'employer') {
            nameLabel.innerHTML = '<i class="fas fa-building"></i> Company Name';
        } else if (role === 'institute') {
            nameLabel.innerHTML = '<i class="fas fa-university"></i> Institute Name';
        } else {
            nameLabel.innerHTML = '<i class="fas fa-user"></i> Full Name';
        }

        // Show profile completion status for role-specific fields only
        updateProfileCompletionDisplay(role);
    };

    const updateProfileCompletionDisplay = (role) => {
        // Get role-specific fields
        const requiredFields = roleFieldsConfig[role] || roleFieldsConfig.alumni;
        const completionContainer = document.getElementById('profile-completion-status');
        
        if (!completionContainer) {
            // Create completion status container if it doesn't exist
            const statusContainer = document.createElement('div');
            statusContainer.id = 'profile-completion-status';
            statusContainer.className = 'profile-completion-status';
            
            // Insert after verification section
            const profileForm = document.getElementById('profile-form');
            if (profileForm && verificationSection) {
                verificationSection.parentNode.insertBefore(statusContainer, profileForm);
            }
        }
        
        // This will be updated after profile data is loaded
        showProfileCompletion();
    };

    const showProfileCompletion = async () => {
        try {
            const stats = await window.api.get('/users/dashboard-stats');
            const completionContainer = document.getElementById('profile-completion-status');
            if (completionContainer) {
                const completion = stats.profileCompletion;
                const statusClass = completion >= 80 ? 'complete' : completion >= 50 ? 'partial' : 'incomplete';
                
                completionContainer.innerHTML = `
                    <div class="completion-widget">
                        <div class="completion-header">
                            <h4><i class="fas fa-chart-pie"></i> Profile Completion</h4>
                            <span class="completion-percentage ${statusClass}">${completion}%</span>
                        </div>
                        <div class="completion-bar">
                            <div class="completion-fill" style="width: ${completion}%"></div>
                        </div>
                        <p class="completion-text">
                            ${completion >= 80 ? 'Great! Your profile is well-completed.' : 
                              completion >= 50 ? 'Good progress! Add more details to improve visibility.' : 
                              'Complete your profile to increase visibility and opportunities.'}
                        </p>
                    </div>
                `;
            }
        } catch (error) {
        }
    };

    const createAdvancedDropdown = (field, currentValue, options) => {
        const container = document.createElement('div');
        container.className = 'dropdown-container';
        
        // Check if this is a multi-value field (skills, languages, etc.)
        const isMultiValue = ['skills', 'languages', 'certifications', 'achievements'].includes(field);
        
        let inputContainer;
        
        if (isMultiValue) {
            // For multi-value fields, create a tag-like input system
            inputContainer = createMultiValueInput(field, currentValue, options);
        } else {
            // For single-value fields, use the existing dropdown
            inputContainer = createSingleValueInput(field, currentValue, options);
        }
        
        container.appendChild(inputContainer.element);
        
        return { container, input: inputContainer.input };
    };

    const createMultiValueInput = (field, currentValue, options) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'multi-value-wrapper';
        
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'tags-container';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'dropdown-input multi-value-input';
        input.placeholder = `Add ${field.replace('_', ' ')}...`;
        
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown-list';
        
        // Parse current values (comma-separated)
        let currentValues = [];
        if (currentValue) {
            currentValues = currentValue.split(',').map(v => v.trim()).filter(v => v);
        }
        
        // Render existing tags
        const renderTags = () => {
            tagsContainer.innerHTML = '';
            currentValues.forEach((value, index) => {
                const tag = document.createElement('span');
                tag.className = 'value-tag';
                tag.innerHTML = `${value} <i class="fas fa-times remove-tag" data-index="${index}"></i>`;
                tagsContainer.appendChild(tag);
            });
        };
        
        // Update the hidden input value
        const updateInputValue = () => {
            input.value = currentValues.join(', ');
        };
        
        // Add a new value
        const addValue = (value) => {
            if (value && !currentValues.includes(value)) {
                currentValues.push(value);
                renderTags();
                updateInputValue();
            }
        };
        
        // Remove a value
        const removeValue = (index) => {
            currentValues.splice(index, 1);
            renderTags();
            updateInputValue();
        };
        
        // Initialize
        renderTags();
        updateInputValue();
        
        // Create the add input
        const addInput = document.createElement('input');
        addInput.type = 'text';
        addInput.className = 'add-value-input';
        addInput.placeholder = `Type to add ${field.replace('_', ' ')}...`;
        
        const filterOptions = (query) => {
            const filtered = options.filter(option => 
                option.toLowerCase().includes(query.toLowerCase()) && !currentValues.includes(option)
            );
            
            dropdown.innerHTML = '';
            
            // Show matching options
            filtered.slice(0, 10).forEach(option => {
                const item = document.createElement('div');
                item.className = 'dropdown-item';
                item.textContent = option;
                item.addEventListener('click', () => {
                    addValue(option);
                    addInput.value = '';
                    dropdown.classList.remove('show');
                });
                dropdown.appendChild(item);
            });
            
            // Add "Add New" option for fields that support it
            const allowCustomItems = ['skills', 'languages', 'certifications'].includes(field);
            if (allowCustomItems && query.trim().length > 0) {
                const exactMatch = options.find(option => 
                    option.toLowerCase() === query.toLowerCase()
                );
                
                if (!exactMatch && !currentValues.includes(query.trim()) && filtered.length < 10) {
                    const addNewItem = document.createElement('div');
                    addNewItem.className = 'dropdown-item add-new-item';
                    addNewItem.innerHTML = `<i class="fas fa-plus"></i> Add "${query.trim()}"`;
                    addNewItem.addEventListener('click', () => {
                        const newValue = query.trim();
                        if (!options.includes(newValue)) {
                            options.push(newValue);
                        }
                        addValue(newValue);
                        addInput.value = '';
                        dropdown.classList.remove('show');
                        showToast(`Added "${newValue}" as a new ${field.replace('_', ' ')}`, 'success');
                    });
                    dropdown.appendChild(addNewItem);
                }
            }
            
            if (filtered.length === 0 && (!allowCustomItems || query.trim().length === 0)) {
                const noResults = document.createElement('div');
                noResults.className = 'dropdown-item no-results';
                noResults.textContent = 'No matching options found';
                dropdown.appendChild(noResults);
            }
        };
        
        // Event listeners for add input
        addInput.addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.length > 0) {
                filterOptions(query);
                dropdown.classList.add('show');
            } else {
                dropdown.classList.remove('show');
            }
        });
        
        addInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = e.target.value.trim();
                if (value) {
                    addValue(value);
                    e.target.value = '';
                    dropdown.classList.remove('show');
                }
            }
        });
        
        addInput.addEventListener('blur', () => {
            setTimeout(() => {
                dropdown.classList.remove('show');
            }, 150);
        });
        
        // Event delegation for remove buttons
        tagsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-tag')) {
                const index = parseInt(e.target.dataset.index);
                removeValue(index);
            }
        });
        
        wrapper.appendChild(tagsContainer);
        wrapper.appendChild(addInput);
        wrapper.appendChild(dropdown);
        
        return { element: wrapper, input };
    };

    const createSingleValueInput = (field, currentValue, options) => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'dropdown-input';
        input.value = currentValue || '';
        input.placeholder = `Type or select ${field.replace('_', ' ')}...`;
        
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown-list';
        
        // Check if field supports adding new items
        const allowCustomItems = ['skills', 'specialization', 'languages', 'country'].includes(field);
        
        const filterOptions = (query) => {
            const filtered = options.filter(option => 
                option.toLowerCase().includes(query.toLowerCase())
            );
            
            dropdown.innerHTML = '';
            
            // Show matching options first
            filtered.slice(0, 10).forEach(option => {
                const item = document.createElement('div');
                item.className = 'dropdown-item';
                item.textContent = option;
                item.addEventListener('click', () => {
                    input.value = option;
                    dropdown.classList.remove('show');
                });
                dropdown.appendChild(item);
            });
            
            // Add "Add New" option for fields that support it
            if (allowCustomItems && query.trim().length > 0) {
                const exactMatch = options.find(option => 
                    option.toLowerCase() === query.toLowerCase()
                );
                
                if (!exactMatch && filtered.length < 10) {
                    const addNewItem = document.createElement('div');
                    addNewItem.className = 'dropdown-item add-new-item';
                    addNewItem.innerHTML = `<i class="fas fa-plus"></i> Add "${query.trim()}"`;
                    addNewItem.addEventListener('click', () => {
                        const newValue = query.trim();
                        if (!options.includes(newValue)) {
                            options.push(newValue);
                        }
                        input.value = newValue;
                        dropdown.classList.remove('show');
                        showToast(`Added "${newValue}" as a new ${field.replace('_', ' ')}`, 'success');
                    });
                    dropdown.appendChild(addNewItem);
                }
            }
            
            if (filtered.length === 0 && (!allowCustomItems || query.trim().length === 0)) {
                const noResults = document.createElement('div');
                noResults.className = 'dropdown-item no-results';
                noResults.textContent = 'No matching options found';
                dropdown.appendChild(noResults);
            }
        };
        
        input.addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.length > 0) {
                filterOptions(query);
                dropdown.classList.add('show');
            } else {
                dropdown.classList.remove('show');
            }
        });
        
        input.addEventListener('focus', () => {
            filterOptions(input.value || '');
            dropdown.classList.add('show');
        });
        
        input.addEventListener('blur', (e) => {
            setTimeout(() => {
                dropdown.classList.remove('show');
            }, 150);
        });
        
        const wrapper = document.createElement('div');
        wrapper.appendChild(input);
        wrapper.appendChild(dropdown);
        
        return { element: wrapper, input };
    };

    const openEditModal = (field, currentValue, fieldType = 'text') => {
        // Remove any existing modal first
        const existingModal = document.getElementById('edit-field-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'edit-field-modal';
        modal.className = 'modal';
        modal.style.display = 'flex';
        
        // Set modal content based on field
        const fieldLabels = {
            'full_name': 'Full Name',
            'bio': 'Bio',
            'company': 'Company/Institution',
            'job_title': 'Job Title',
            'city': 'City',
            'linkedin_profile': 'LinkedIn Profile',
            'institute_name': 'Institute Name',
            'major': 'Major',
            'graduation_year': 'Graduation Year',
            'department': 'Department',
            'industry': 'Industry',
            'skills': 'Skills',
            'website': 'Website',
            'specialization': 'Specialization',
            'languages': 'Languages',
            'phone_number': 'Phone Number'
        };
        
        const fieldLabel = fieldLabels[field] || field.replace('_', ' ');
        let inputElement;
        let inputContainer;
        
        // Determine if field should use dropdown
        const useDropdown = dropdownData.hasOwnProperty(field);
        
        if (useDropdown) {
            const dropdown = createAdvancedDropdown(field, currentValue, dropdownData[field]);
            inputContainer = dropdown.container;
            inputElement = dropdown.input;
        } else if (fieldType === 'textarea') {
            inputContainer = document.createElement('div');
            inputElement = document.createElement('textarea');
            inputElement.className = 'modal-textarea';
            inputElement.rows = 4;
            inputElement.value = currentValue || '';
            inputContainer.appendChild(inputElement);
        } else {
            inputContainer = document.createElement('div');
            inputElement = document.createElement('input');
            inputElement.type = fieldType;
            inputElement.className = 'modal-input';
            inputElement.value = currentValue || '';
            inputContainer.appendChild(inputElement);
        }
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Edit ${fieldLabel}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--text-color);">${fieldLabel}</label>
                        <div id="input-container"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary close-modal">Cancel</button>
                    <button type="button" class="btn btn-primary save-field-btn">Save Changes</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Insert the input container
        modal.querySelector('#input-container').appendChild(inputContainer);
        
        // Focus the input
        setTimeout(() => inputElement.focus(), 100);
        
        // Add event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        modal.querySelector('.save-field-btn').addEventListener('click', () => {
            saveFieldValue(field, inputElement.value);
            modal.remove();
        });
        
        // Handle Enter key
        inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                modal.querySelector('.save-field-btn').click();
            }
        });
    };

    const saveFieldValue = async (field, value) => {
        try {
            // Show loading state
            const saveBtn = document.querySelector('.save-field-btn');
            if (saveBtn) {
                const originalText = saveBtn.textContent;
                saveBtn.textContent = 'Saving...';
                saveBtn.disabled = true;
            }
            
            // Create form data with only the field being updated
            const formData = new FormData();
            formData.set(field, value);
            
            const result = await window.api.putForm('/users/profile', formData);
            
            // Update the display element immediately
            const displayElement = document.querySelector(`.display-field[data-field="${field}"]`);
            if (displayElement) {
                displayElement.textContent = value || 'Not set';
            }
            
            // Also update the hidden input field if it exists
            const inputElement = document.querySelector(`input[name="${field}"], textarea[name="${field}"], select[name="${field}"]`);
            if (inputElement) {
                inputElement.value = value;
            }
            
            // Update profile completion without causing data loss
            setTimeout(() => showProfileCompletion(), 100);
            
            showToast('Profile updated successfully!', 'success');
        } catch (error) {
            showToast('Error updating profile: ' + error.message, 'error');
        }
    };


    const populateProfileData = (data) => {
        // Enhanced fields list to cover all profile fields including new ones
        const fields = [
            'full_name', 'bio', 'company', 'job_title', 'city', 'address', 'country', 
            'phone_number', 'linkedin_profile', 'twitter_profile', 'github_profile', 
            'availability_status', 'institute_name', 'major', 'graduation_year', 
            'department', 'industry', 'skills', 'website', 'specialization', 
            'experience_years', 'certifications', 'achievements', 'languages', 
            'research_interests', 'current_position', 'company_size', 'founded_year', 
            'student_count', 'expected_graduation', 'current_year', 'gpa'
        ];
        
        fields.forEach(field => {
            const displayElement = document.querySelector(`.display-field[data-field="${field}"]`);
            const inputElement = document.querySelector(`.edit-field[name="${field}"]`);
            
            if (displayElement) {
                displayElement.textContent = data[field] || 'Not set';
            }
            if (inputElement) {
                if (inputElement.type === 'checkbox') {
                    inputElement.checked = !!data[field];
                } else {
                    inputElement.value = data[field] || '';
                }
            }
        });

        const badgeContainer = document.getElementById('profile-verified-badge');
        if(badgeContainer) {
            badgeContainer.innerHTML = data.verification_status === 'verified' ? '<span class="verified-badge-sm" title="Verified"><i class="fas fa-check-circle"></i></span>' : '';
        }
        
        renderVerificationStatus(data.verification_status);
        const emailElement = document.getElementById('email');
        if (emailElement) {
            emailElement.textContent = data.email || 'Not set';
        }

        if (data.profile_pic_url) {
            profilePic.src = `http://localhost:3000/${data.profile_pic_url}`;
            profilePic.onerror = () => { 
                profilePic.src = createInitialsAvatar(data.full_name || 'User'); 
            };
        } else {
            profilePic.src = createInitialsAvatar(data.full_name || 'User');
        }
        
        // Update the view based on the user's role
        updateProfileViewForRole(userRole);
        
        // Show profile completion after data is loaded
        setTimeout(() => showProfileCompletion(), 100);
    };

    const fetchUserProfile = async () => {
        try {
            const data = await window.api.get(`/users/profile`);
            populateProfileData(data);
        } catch (error) {
            displayMessage('An error occurred while fetching profile data.');
        }
    };

    const fetchPrivacySettings = async () => {
        try {
            const settings = await window.api.get(`/users/privacy`);
            document.getElementById('is_profile_public').checked = settings.is_profile_public;
            document.getElementById('is_email_visible').checked = settings.is_email_visible;
            document.getElementById('is_company_visible').checked = settings.is_company_visible;
            document.getElementById('is_location_visible').checked = settings.is_location_visible;
        } catch (error) {
        }
    };

    document.querySelectorAll('.edit-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const parent = e.target.closest('.profile-field');
            const displayField = parent.querySelector('.display-field');
            const fieldName = displayField.getAttribute('data-field');
            const currentValue = displayField.textContent === 'Not set' ? '' : displayField.textContent;
            
            // Determine field type based on field name
            let fieldType = 'text';
            if (fieldName === 'bio' || fieldName === 'skills') {
                fieldType = 'textarea';
            } else if (fieldName === 'linkedin_profile' || fieldName === 'website') {
                fieldType = 'url';
            } else if (fieldName === 'graduation_year') {
                fieldType = 'number';
            }
            
            openEditModal(fieldName, currentValue, fieldType);
        });
    });

    document.querySelectorAll('.edit-field').forEach(field => {
        field.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.target.nextElementSibling.click();
            }
        });
    });

    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Saving Changes...';
            submitBtn.disabled = true;
            
            try {
                const formData = new FormData(form);
                
                // Add additional data from display fields that may have been updated via modal
                document.querySelectorAll('.display-field[data-field]').forEach(element => {
                    const fieldName = element.getAttribute('data-field');
                    const fieldValue = element.textContent === 'Not set' ? '' : element.textContent;
                    if (fieldName && fieldValue && !formData.has(fieldName)) {
                        formData.append(fieldName, fieldValue);
                    }
                });
                
                const result = await window.api.putForm(`/users/profile`, formData);
                showToast('All changes saved successfully!', 'success');

                const updatedProfile = result.user;
                
                if (updatedProfile && updatedProfile.profile_pic_url) {
                    localStorage.setItem('userPfpUrl', updatedProfile.profile_pic_url);
                } else if (updatedProfile) {
                    localStorage.removeItem('userPfpUrl');
                }
                
                // Refresh profile data instead of reloading page
                setTimeout(() => {
                    fetchUserProfile();
                }, 500);
                
            } catch (error) {
                displayMessage(`Error: ${error.message}`);
            } finally {
                // Reset button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    if(privacyForm) {
        privacyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const settings = {
                is_profile_public: document.getElementById('is_profile_public').checked,
                is_email_visible: document.getElementById('is_email_visible').checked,
                is_company_visible: document.getElementById('is_company_visible').checked,
                is_location_visible: document.getElementById('is_location_visible').checked
            };
            try {
                const result = await window.api.put(`/users/privacy`, settings);
                displayMessage(result.message, 'success', 'privacy-message');
            } catch (error) {
                displayMessage(error.message, 'error', 'privacy-message');
            }
        });
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                displayMessage('New passwords do not match.', 'error', 'password-message');
                return;
            }

            try {
                const result = await window.api.post('/users/change-password', { currentPassword, newPassword });
                displayMessage(result.message, 'success', 'password-message');
                passwordForm.reset();
            } catch (error) {
                displayMessage(error.message, 'error', 'password-message');
            }
        });
    }

    if(verificationSection) {
        verificationSection.addEventListener('click', async (e) => {
            if (e.target.id === 'request-verification-btn') {
                e.target.disabled = true;
                e.target.textContent = 'Submitting...';
                try {
                    const result = await window.api.post('/users/request-verification', {});
                    showToast(result.message, 'success');
                    renderVerificationStatus('pending');
                } catch (error) {
                    showToast(error.message, 'error');
                } finally {
                    e.target.disabled = false;
                    e.target.textContent = 'Request Verification';
                }
            }
        });
    }

    // Setup header action buttons
    const socialProfileLink = document.getElementById('social-profile-link-header');
    const mentorProfileLink = document.getElementById('mentor-profile-link-header');
    const profileMessageBtn = document.getElementById('profile-message-btn');
    const profileShareBtn = document.getElementById('profile-share-btn');

    // Get current user ID for links
    let currentUserId = null;
    try {
        const userData = await window.api.get('/auth/me');
        currentUserId = userData.userId || userData.user_id;
    } catch (error) {
        console.error('Error fetching user ID:', error);
    }

    // Update links with user ID
    if (currentUserId && socialProfileLink) {
        socialProfileLink.href = `social-profile.html?userId=${currentUserId}`;
    }

    if (currentUserId && mentorProfileLink) {
        mentorProfileLink.href = `mentor-profile.html?id=${currentUserId}`;
    }

    // Message button handler
    if (profileMessageBtn) {
        profileMessageBtn.addEventListener('click', () => {
            window.location.href = 'messages.html';
        });
    }

    // Share profile button handler
    if (profileShareBtn) {
        profileShareBtn.addEventListener('click', () => {
            const profileUrl = window.location.origin + '/client/view-profile.html?email=' + encodeURIComponent(userEmail);
            if (navigator.share) {
                navigator.share({
                    title: 'My Profile',
                    url: profileUrl
                }).catch(() => {});
            } else {
                navigator.clipboard.writeText(profileUrl);
                showToast('Profile link copied to clipboard!', 'success');
            }
        });
    }

    await fetchUserProfile();
    await fetchPrivacySettings();
});