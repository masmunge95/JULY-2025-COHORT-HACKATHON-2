/**
 * IMPORTANT:
 * You must replace these placeholder values with your actual Supabase project URL and Anon Key.
 * You can find these in your Supabase project's "API" settings.
 * The 'anon' key is safe to use in client-side code.
 */
const SUPABASE_URL = 'https://ssmddcoxoocqitjjlnfs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbWRkY294b29jcWl0ampsbmZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzAyMDUsImV4cCI6MjA3MjIwNjIwNX0.bSDGrMrYPSN0R_QoY0QehNENYZjs7jU_uueScvP_MlQ';

// Initialize the Supabase client
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase URL and Anon Key are required. Make sure to update them in auth.js");
}
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Get DOM Elements ---
const authForm = document.getElementById('auth-form');
const loginButton = document.getElementById('login-button');
const signupButton = document.getElementById('signup-button');
const authError = document.getElementById('auth-error');
const loadingSpinner = document.getElementById('loading');
const authView = document.getElementById('auth-view');

// --- Helper Functions ---

/**
 * Toggles the visibility of the loading spinner and the auth form.
 * @param {boolean} isLoading - Whether to show the loading spinner.
 */
function setLoading(isLoading) {
    if (isLoading) {
        loadingSpinner.classList.remove('hidden');
        authView.classList.add('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
        authView.classList.remove('hidden');
    }
}

/**
 * Displays an error message in the auth form.
 * @param {string} message - The error message to display.
 */
function showError(message) {
    authError.textContent = message;
    authError.classList.remove('hidden');
}

// --- Event Handlers ---

loginButton.addEventListener('click', async (e) => {
    e.preventDefault();
    setLoading(true);
    showError(''); // Clear previous errors

    const email = authForm.email.value;
    const password = authForm.password.value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        showError(error.message);
        setLoading(false);
        return;
    }

    // On success, Supabase handles the session. The checkUserSession will redirect.
    // Or you can redirect manually here.
    window.location.href = '/dashboard.html'; // <-- CHANGE TO YOUR PROTECTED PAGE
});

signupButton.addEventListener('click', async (e) => {
    e.preventDefault();
    setLoading(true);
    showError(''); // Clear previous errors

    const email = authForm.email.value;
    const password = authForm.password.value;

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        showError(error.message);
    } else {
        // By default, Supabase sends a confirmation email.
        alert('Signup successful! Please check your email to verify your account.');
    }
    
    setLoading(false);
});

/**
 * Checks if a user session exists and redirects to the dashboard if it does.
 * This function is called from index.html.
 */
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        console.log('Active session found. Redirecting...');
        window.location.href = '/dashboard.html'; // <-- CHANGE TO YOUR PROTECTED PAGE
    }
}

// Check for an active session as soon as the script loads
checkUserSession();