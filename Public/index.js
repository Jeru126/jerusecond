// --- 1. Interactive Welcome Toast Notification ---
window.addEventListener('load', () => {
    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.innerHTML = '<strong>Welcome back!</strong> Check out this week’s updated sports schedules.';
    document.body.appendChild(toast);

    // Show toast after a slight delay
    setTimeout(() => {
        toast.classList.add('show');
    }, 500);

    // Hide toast after 4.5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4500);
});

// --- 2. Dark Mode Toggle with localStorage Memory ---
document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (!darkModeToggle) return;

    const currentTheme = localStorage.getItem('theme');

    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️ Light Mode';
    }

    darkModeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.classList.toggle('dark-mode');
        
        let theme = 'light';
        if (document.body.classList.contains('dark-mode')) {
            theme = 'dark';
            darkModeToggle.textContent = '☀️ Light Mode';
        } else {
            darkModeToggle.textContent = '🌙 Dark Mode';
        }
        localStorage.setItem('theme', theme);
    });
});