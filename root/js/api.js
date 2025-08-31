const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Change to your deployed backend URL in production

async function getAuthToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session ? session.access_token : null;
}

async function fetchFromAPI(endpoint, options = {}) {
    const token = await getAuthToken();
    if (!token) {
        console.error("No auth token found. Redirecting to login.");
        window.location.href = '/index.html';
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'An API error occurred');
    }

    return response.json();
}

const api = {
    getDashboardData: () => fetchFromAPI('/progress/dashboard_data'),
    generateQuiz: (topic) => fetchFromAPI('/content/generate_quiz', {
        method: 'POST',
        body: JSON.stringify({ topic }),
    }),
    generateFlashcards: (topic) => fetchFromAPI('/content/generate_flashcards', {
        method: 'POST',
        body: JSON.stringify({ topic }),
    }),
    trackQuizResult: (topic, score, total_questions) => fetchFromAPI('/progress/track_quiz_result', {
        method: 'POST',
        body: JSON.stringify({ topic, score, total_questions }),
    }),
    createCheckoutSession: () => fetchFromAPI('/payments/create_checkout_session', {
        method: 'POST',
    }),
};