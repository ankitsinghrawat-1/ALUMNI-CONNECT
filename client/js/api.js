// client/js/api.js
const API_BASE_URL = 'http://localhost:3000/api';

const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('alumniConnectToken');
    const headers = { ...options.headers };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Handle query parameters
    let url = `${API_BASE_URL}${endpoint}`;
    if (options.params) {
        const queryString = new URLSearchParams(options.params).toString();
        if (queryString) {
            url += `?${queryString}`;
        }
    }

    let body;
    if (options.body instanceof FormData) {
        body = options.body;
    } else if (options.body) {
        body = JSON.stringify(options.body);
        headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            body,
        });

        if (response.status === 401) {
            localStorage.clear();
            window.location.href = 'login.html';
            throw new Error('Unauthorized');
        }

        if (response.status === 204) {
            return;
        }

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || 'An API error occurred');
        }

        return responseData;
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error("Server returned an invalid response.");
        }
        throw error;
    }
};

window.api = {
    get: (endpoint, options) => apiFetch(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: 'POST', body }),
    put: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: 'PUT', body }),
    del: (endpoint, options) => apiFetch(endpoint, { ...options, method: 'DELETE' }),
    postForm: (endpoint, formData, options = {}) => {
        return apiFetch(endpoint, { ...options, method: 'POST', body: formData });
    },
    putForm: (endpoint, formData, options = {}) => {
        return apiFetch(endpoint, { ...options, method: 'PUT', body: formData });
    }
};