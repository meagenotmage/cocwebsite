// Admin credentials
const adminEmail = "cocadmin@coc.web";
const adminPassword = "Admin@2026";

const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (email === adminEmail && password === adminPassword) {
        window.location.href = 'admin.html';
    } else {
        alert("Invalid email or password.");
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