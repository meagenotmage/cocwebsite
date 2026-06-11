// Admin credentials
const adminEmail = "cocadmin@coc.web";
const adminPassword = "Admin@2026";

const loginForm = document.getElementById("login-form");

if (loginForm) {
    loginForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        console.log("Attempting login with:", email); // Debugging line

        if (email === adminEmail && password === adminPassword) {
            alert("Login Successful!");
            window.location.href = 'admin.html';
        } else {
            alert("Invalid email or password.");
        }
    });
}
