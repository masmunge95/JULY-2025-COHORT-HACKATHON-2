const ui = {
    // Elements
    userEmail: document.getElementById('user-email'),
    premiumSection: document.getElementById('premium-section'),
    historyList: document.getElementById('history-list'),
    milestonesList: document.getElementById('milestones-list'),
    contentDisplay: document.getElementById('content-display'),
    welcomeMessage: document.getElementById('welcome-message'),
    contentLoading: document.getElementById('content-loading'),
    contentError: document.getElementById('content-error'),
    errorMessageText: document.getElementById('error-message-text'),
    quizView: document.getElementById('quiz-view'),
    quizTopic: document.getElementById('quiz-topic'),
    quizQuestionContainer: document.getElementById('quiz-question-container'),
    quizFeedback: document.getElementById('quiz-feedback'),
    quizNextBtn: document.getElementById('quiz-next-btn'),
    quizResults: document.getElementById('quiz-results'),
    quizScore: document.getElementById('quiz-score'),
    flashcardsView: document.getElementById('flashcards-view'),
    flashcardsTopic: document.getElementById('flashcards-topic'),
    flashcardsContainer: document.getElementById('flashcards-container'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message'),

    // Methods
    showLoading: function() {
        this.welcomeMessage.classList.add('hidden');
        this.quizView.classList.add('hidden');
        this.flashcardsView.classList.add('hidden');
        this.contentError.classList.add('hidden');
        this.contentLoading.classList.remove('hidden');
    },

    hideLoading: function() {
        this.contentLoading.classList.add('hidden');
    },

    showError: function(message) {
        this.hideLoading();
        this.errorMessageText.textContent = message;
        this.contentError.classList.remove('hidden');
    },

    updateDashboard: function(data) {
        this.userEmail.textContent = data.user.email;
        if (data.user.is_premium) {
            this.premiumSection.classList.add('hidden');
        } else {
            this.premiumSection.classList.remove('hidden');
        }

        // Render History
        if (data.history && data.history.length > 0) {
            this.historyList.innerHTML = data.history.map(item => `
                <div class="p-2 border-b border-gray-200">
                    <p class="font-medium">${item.topic} (${item.activity_type})</p>
                    <p class="text-xs text-gray-500">${new Date(item.created_at).toLocaleString()}</p>
                </div>
            `).join('');
        } else {
            this.historyList.innerHTML = '<p>No recent activity.</p>';
        }

        // Render Milestones
        if (data.milestones && data.milestones.length > 0) {
            this.milestonesList.innerHTML = data.milestones.map(item => `
                <div class="p-2 bg-yellow-100 rounded-md">
                    <p class="font-medium text-yellow-800">${item.milestone_name}</p>
                    <p class="text-xs text-yellow-700">${item.description}</p>
                </div>
            `).join('');
        } else {
            this.milestonesList.innerHTML = '<p>No milestones achieved yet.</p>';
        }
    },

    renderQuiz: function(topic, questions) {
        this.hideLoading();
        this.quizTopic.textContent = `Quiz: ${topic}`;
        this.quizView.classList.remove('hidden');
        this.quizResults.classList.add('hidden');
        this.quizNextBtn.classList.add('hidden');
        this.quizFeedback.innerHTML = '';
    },

    renderQuestion: function(question, index) {
        this.quizQuestionContainer.innerHTML = `
            <p class="text-lg font-semibold mb-4">${index + 1}. ${question.question}</p>
            <div class="space-y-2">
                ${question.options.map(option => `
                    <button class="quiz-option block w-full text-left p-3 border border-gray-300 rounded-md hover:bg-gray-100">
                        ${option}
                    </button>
                `).join('')}
            </div>
        `;
    },

    showQuizFeedback: function(isCorrect, correctAnswer) {
        if (isCorrect) {
            this.quizFeedback.innerHTML = '<span class="text-green-600">Correct!</span>';
        } else {
            this.quizFeedback.innerHTML = `<span class="text-red-600">Incorrect. The correct answer is: ${correctAnswer}</span>`;
        }
        this.quizNextBtn.classList.remove('hidden');
    },

    showQuizResults: function(score, total) {
        this.quizQuestionContainer.innerHTML = '';
        this.quizFeedback.innerHTML = '';
        this.quizNextBtn.classList.add('hidden');
        this.quizScore.textContent = `You scored ${score} out of ${total}!`;
        this.quizResults.classList.remove('hidden');
    },

    renderFlashcards: function(topic, flashcards) {
        this.hideLoading();
        this.flashcardsTopic.textContent = `Flashcards: ${topic}`;
        this.flashcardsView.classList.remove('hidden');
        
        this.flashcardsContainer.innerHTML = flashcards.map((card, index) => `
            <div class="flashcard perspective-1000 h-48 cursor-pointer" onclick="this.classList.toggle('flipped')">
                <div class="flashcard-inner relative w-full h-full">
                    <div class="flashcard-front absolute w-full h-full bg-white border rounded-lg shadow p-4 flex flex-col justify-center items-center">
                        <span class="text-xs text-gray-500 absolute top-2 left-2">${index + 1}/${flashcards.length}</span>
                        <p class="text-lg text-center">${card.front}</p>
                    </div>
                    <div class="flashcard-back absolute w-full h-full bg-indigo-100 border rounded-lg shadow p-4 flex flex-col justify-center items-center">
                        <p class="text-center">${card.back}</p>
                    </div>
                </div>
            </div>
        `).join('');
    },

    showToast: function(message, duration = 3000) {
        this.toastMessage.textContent = message;
        this.toast.classList.remove('translate-y-20', 'opacity-0');
        this.toast.classList.add('translate-y-0', 'opacity-100');

        setTimeout(() => {
            this.hideToast();
        }, duration);
    },

    hideToast: function() {
        this.toast.classList.remove('translate-y-0', 'opacity-100');
        this.toast.classList.add('translate-y-20', 'opacity-0');
    }
};