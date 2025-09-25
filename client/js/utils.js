// client/js/utils.js
// client/js/utils.js

/**
 * A universal function to fetch data and render it to a container.
 * Handles loading, empty, and error states automatically.
 * @param {string} endpoint - The API endpoint to fetch data from.
 * @param {HTMLElement} container - The DOM element to render content into.
 * @param {function} itemRenderer - A function that takes a single item and returns an HTML string.
 * @param {object} [options] - Optional parameters.
 * @param {string} [options.emptyMessage] - Message to display when no items are found.
 * @param {string} [options.gridClass] - A class to apply to the container after rendering.
 */
const renderData = async (endpoint, container, itemRenderer, options = {}) => {
    const { 
        emptyMessage = '<p class="info-message">No items to display.</p>',
        gridClass = '' 
    } = options;

    if (!container) return;

    container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

    try {
        const items = await window.api.get(endpoint);
        
        if (items.length > 0) {
            container.innerHTML = items.map(itemRenderer).join('');
            if (gridClass) {
                container.className = gridClass;
            }
        } else {
            container.innerHTML = emptyMessage;
        }
    } catch (error) {
        console.error(`Error fetching data from ${endpoint}:`, error);
        container.innerHTML = `<p class="info-message error">Failed to load content. Please try again later.</p>`;
    }
};

const showToast = (message, type = 'info') => {
    let backgroundColor;
    switch (type) {
        case 'success':
            backgroundColor = 'linear-gradient(to right, #00b09b, #96c93d)';
            break;
        case 'error':
            backgroundColor = 'linear-gradient(to right, #ff5f6d, #ffc371)';
            break;
        default:
            backgroundColor = 'linear-gradient(to right, #6a11cb, #2575fc)';
            break;
    }

    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        backgroundColor: backgroundColor,
        stopOnFocus: true, // Prevents dismissing of toast on hover
    }).showToast();
};

/**
 * Sanitizes a string to prevent XSS attacks by converting HTML special characters.
 * @param {string} str The string to sanitize.
 * @returns {string} The sanitized string.
 */
const sanitizeHTML = (str) => {
    if (str === null || str === undefined) {
        return '';
    }
    const temp = document.createElement('div');
    temp.textContent = String(str);
    return temp.innerHTML;
};

/**
 * Creates a beautiful SVG avatar with a user's initials and a unique background color.
 * @param {string} name The full name of the user.
 * @returns {string} A Data URL representing the SVG image.
 */
const createInitialsAvatar = (name) => {
    if (!name) name = 'No Name';

    // Get initials (up to 2)
    const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    // Generate a unique, consistent color based on the name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    const hue = hash % 360;
    const backgroundColor = `hsl(${hue}, 50%, 60%)`;
    const textColor = '#FFFFFF';

    // Create the SVG markup
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
            <rect width="100%" height="100%" fill="${backgroundColor}" />
            <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="${textColor}" font-size="60" font-family="Poppins, sans-serif" font-weight="600">
                ${initials}
            </text>
        </svg>
    `;

    // Return as a Base64-encoded Data URL
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};