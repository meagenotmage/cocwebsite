// Default admin credentials
let adminEmail = "cocadmin@coc.web";
let adminPassword = "password123";

const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", function(event) {
    // Prevent the form from submitting the default way
    event.preventDefault(); 
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Check if the credentials are correct
    if (email === adminEmail && password === adminPassword) {
        // If successful, redirect to the admin dashboard
        // THIS IS THE CORRECTED LINE:
        window.location.href = 'admin.html'; 
    } else {
        // If incorrect, show an error message
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