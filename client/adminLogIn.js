// Default admin credentials
let adminEmail = "cocadmin@coc.web";
let adminPassword = "pakiss123";

const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", function(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (email === adminEmail && password === adminPassword) {
        alert("Login successful!");
        
        // You can redirect to an admin dashboard here.
        // For demonstration, we'll allow changing credentials via prompts.
        const newEmail = prompt("Enter new admin email (leave blank to keep current):");
        const newPassword = prompt("Enter new admin password (leave blank to keep current):");

        if (newEmail) {
            adminEmail = newEmail;
            alert("Admin email updated successfully!");
        }
        if (newPassword) {
            adminPassword = newPassword;
            alert("Admin password updated successfully!");
        }
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

function goHome() {
    // Replace with your actual home page URL
    window.location.href = "https://example.com";
}