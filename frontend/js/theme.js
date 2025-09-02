const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`;
const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`;

function updateThemeIcon() {
    const isDark = document.documentElement.classList.contains('dark');
    const themeIcon = document.getElementById('theme-toggle-icon');
    if (themeIcon) {
        themeIcon.innerHTML = isDark ? sunIcon : moonIcon;
    }
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    updateThemeIcon();
}

function initTheme() {
    // Set initial theme based on system preference (for the session)
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
    }
    
    const themeToggleButton = document.getElementById('theme-toggle');
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
    }
    updateThemeIcon();
}

// Initialize the theme and button when the DOM is loaded
document.addEventListener('DOMContentLoaded', initTheme);