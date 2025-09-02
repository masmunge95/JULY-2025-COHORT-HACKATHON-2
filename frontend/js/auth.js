import { supabase } from './supabaseClient.js';

const modal = document.getElementById('auth-modal');
const overlay = document.getElementById('auth-modal-overlay');
const closeModalBtn = document.getElementById('close-modal-btn');

const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

const loginBtnMain = document.getElementById('login-btn-main');
const signupBtnMain = document.getElementById('signup-btn-main');
const getStartedBtn = document.getElementById('get-started-btn');

const authErrorDiv = document.getElementById('auth-error');
const authErrorMessage = document.getElementById('auth-error-message');

const avatarSeedInput = document.getElementById('signup-avatar-seed');
const avatarPreview = document.getElementById('avatar-preview');

const showModal = () => modal.classList.replace('hidden', 'flex');
const hideModal = () => modal.classList.replace('flex', 'hidden');

const showError = (message) => {
    authErrorMessage.textContent = message;
    authErrorDiv.classList.remove('hidden');
};

const hideError = () => {
    authErrorDiv.classList.add('hidden');
};

const switchToLogin = () => {
    hideError();
    loginTab.classList.add('border-red-500', 'text-red-500');
    loginTab.classList.remove('text-gray-500', 'dark:text-gray-400');
    signupTab.classList.remove('border-red-500', 'text-red-500');
    signupTab.classList.add('text-gray-500', 'dark:text-gray-400');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
};

const switchToSignup = () => {
    hideError();
    signupTab.classList.add('border-red-500', 'text-red-500');
    signupTab.classList.remove('text-gray-500', 'dark:text-gray-400');
    loginTab.classList.remove('border-red-500', 'text-red-500');
    loginTab.classList.add('text-gray-500', 'dark:text-gray-400');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
};

// Event Listeners
[loginBtnMain, signupBtnMain, getStartedBtn, overlay, closeModalBtn].forEach(el => {
    if (el) {
        el.addEventListener('click', (e) => {
            if (e.currentTarget === loginBtnMain) {
                switchToLogin();
                showModal();
            } else if (e.currentTarget === signupBtnMain || e.currentTarget === getStartedBtn) {
                switchToSignup();
                showModal();
            } else if (e.currentTarget === overlay || e.currentTarget === closeModalBtn) {
                hideModal();
            }
        });
    }
});

loginTab.addEventListener('click', switchToLogin);
signupTab.addEventListener('click', switchToSignup);

avatarSeedInput.addEventListener('input', (e) => {
    const seed = e.target.value || 'default';
    avatarPreview.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
});

// Handle Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        showError(error.message);
    } else {
        window.location.href = 'dashboard.html';
    }
});

// Handle Signup
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const firstName = document.getElementById('signup-firstname').value;
    const lastName = document.getElementById('signup-lastname').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const avatarSeed = document.getElementById('signup-avatar-seed').value;

    if (password.length < 6) {
        showError("Password must be at least 6 characters long.");
        return;
    }
    if (!firstName || !lastName) {
        showError("First and last name are required.");
        return;
    }

    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (signUpError) {
        showError(signUpError.message);
        return;
    }

    if (user) {
        const avatar_url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed || email)}`;
        
        const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
                id: user.id,
                first_name: firstName,
                last_name: lastName,
                avatar_url: avatar_url
            });

        if (profileError) {
            showError(`Account created, but failed to create profile: ${profileError.message}`);
        } else {
            alert('Signup successful! Please check your email to verify your account.');
            switchToLogin();
        }
    }
});