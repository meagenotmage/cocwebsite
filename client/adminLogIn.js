// Import the API URL from config
import { API_URL } from './config.js';

const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async function(event) {
    // Prevent the form from submitting the default way
    event.preventDefault(); 
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        // Send credentials to the server for authentication
        const response = await fetch(`${API_URL}/api/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Important for session cookies
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // If successful, redirect to the admin dashboard
            window.location.href = 'admin.html';
        } else {
            // If incorrect, show an error message
            alert(data.message || 'Invalid email or password.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
});

function togglePassword() {
    const passwordField = document.getElementById("password");
    const toggleIcon = document.querySelector(".toggle-password");
    if (passwordField.type === "password") {
        passwordField.type = "text";
        toggleIcon.textContent = "Show";
    } else {
        passwordField.type = "password";
        toggleIcon.textContent = "Hide";
    }
}