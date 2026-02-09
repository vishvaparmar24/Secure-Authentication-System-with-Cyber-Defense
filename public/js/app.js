const API_URL = '/api/auth';

// Helper to display messages
function showMessage(elementId, message, type) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = `msg-box ${type}`;
    el.style.display = 'block';
}

// Session Check
async function checkSession() {
    try {
        const res = await fetch(`${API_URL}/check-session`, { credentials: 'include' });
        const data = await res.json();
        return data.isAuthenticated;
    } catch (e) {
        return false;
    }
}

// Register Logic
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('registerBtn');

        btn.disabled = true;
        btn.textContent = 'Creating Account...';

        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();

            if (res.ok) {
                showMessage('messageBox', 'Account created! Redirecting...', 'success');
                setTimeout(() => window.location.href = 'index.html', 1500);
            } else {
                showMessage('messageBox', data.message || 'Registration failed', 'error');
                btn.disabled = false;
                btn.textContent = 'Create Account';
            }
        } catch (error) {
            showMessage('messageBox', 'Server error', 'error');
            btn.disabled = false;
        }
    });
}

// Login Logic
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('loginBtn');

        btn.disabled = true;
        btn.textContent = 'Verifying...';

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok) {
                window.location.href = 'dashboard.html';
            } else {
                showMessage('messageBox', data.message || 'Login failed', 'error');
                btn.disabled = false;
                btn.textContent = 'Sign In';
            }
        } catch (error) {
            showMessage('messageBox', 'Connection error', 'error');
            btn.disabled = false;
        }
    });
}

// Logout Logic
async function logout() {
    await fetch(`${API_URL}/logout`, { method: 'POST' });
    window.location.href = 'index.html';
}
