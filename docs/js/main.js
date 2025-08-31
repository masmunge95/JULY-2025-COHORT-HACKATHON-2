document.addEventListener('DOMContentLoaded', () => {
    // Ensure user is authenticated before doing anything
    checkUserSession().then(() => {
        initializeDashboard();
    });
});

function initializeDashboard() {
    const generateQuizBtn = document.getElementById('generate-quiz-btn');
    const generateFlashcardsBtn = document.getElementById('generate-flashcards-btn');
    const topicInput = document.getElementById('topic-input');
    const upgradeButton = document.getElementById('upgrade-button');

    let currentQuiz = null;
    let currentQuestionIndex = 0;
    let score = 0;

    // Load initial dashboard data
    async function loadDashboard() {
        try {
            const data = await api.getDashboardData();
            ui.updateDashboard(data);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            ui.showError('Could not load your dashboard data. Please refresh the page.');
        }
    }

    // Handle Quiz Generation
    generateQuizBtn.addEventListener('click', async () => {
        const topic = topicInput.value.trim();
        if (!topic) {
            alert('Please enter a topic.');
            return;
        }
        ui.showLoading();
        try {
            const data = await api.generateQuiz(topic);
            currentQuiz = { topic, questions: data.questions };
            currentQuestionIndex = 0;
            score = 0;
            ui.renderQuiz(topic, data.questions);
            ui.renderQuestion(data.questions[0], 0);
            loadDashboard(); // Refresh history
        } catch (error) {
            ui.showError(error.message);
        }
    });

    // Handle Flashcard Generation
    generateFlashcardsBtn.addEventListener('click', async () => {
        const topic = topicInput.value.trim();
        if (!topic) {
            alert('Please enter a topic.');
            return;
        }
        ui.showLoading();
        try {
            const data = await api.generateFlashcards(topic);
            ui.renderFlashcards(topic, data.flashcards);
            loadDashboard(); // Refresh history
        } catch (error) {
            ui.showError(error.message);
        }
    });

    // Handle Quiz Interactions
    ui.quizQuestionContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('quiz-option')) {
            const selectedAnswer = e.target.textContent.trim();
            const correctAnswer = currentQuiz.questions[currentQuestionIndex].answer;
            const isCorrect = selectedAnswer === correctAnswer;

            if (isCorrect) {
                score++;
            }

            // Disable all options after selection
            document.querySelectorAll('.quiz-option').forEach(btn => btn.disabled = true);
            e.target.classList.add(isCorrect ? 'bg-green-200' : 'bg-red-200');

            ui.showQuizFeedback(isCorrect, correctAnswer);
        }
    });

    ui.quizNextBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentQuiz.questions.length) {
            ui.renderQuestion(currentQuiz.questions[currentQuestionIndex], currentQuestionIndex);
            ui.quizFeedback.innerHTML = '';
            ui.quizNextBtn.classList.add('hidden');
        } else {
            // End of quiz
            ui.showQuizResults(score, currentQuiz.questions.length);
            api.trackQuizResult(currentQuiz.topic, score, currentQuiz.questions.length)
               .then(() => loadDashboard()); // Refresh dashboard after tracking
        }
    });

    document.getElementById('quiz-restart-btn').addEventListener('click', () => {
        ui.quizView.classList.add('hidden');
        ui.welcomeMessage.classList.remove('hidden');
        topicInput.value = '';
    });

    // Handle Premium Upgrade
    upgradeButton.addEventListener('click', async () => {
        try {
            const { checkout_url } = await api.createCheckoutSession();
            window.location.href = checkout_url;
        } catch (error) {
            ui.showError('Could not initiate payment. Please try again later.');
        }
    });

    // Check for payment success query param
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
        ui.showToast('Payment successful! You are now a premium member.', 5000);
        // Clean the URL
        window.history.replaceState({}, document.title, "/dashboard.html");
    }

    // Initial load
    loadDashboard();
}