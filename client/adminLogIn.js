const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch('http://localhost:3000/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            // Redirect to admin page
            window.location.href = 'admin.html';
        } else {
            alert("Login failed: " + data.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Server error. Try again later.");
    }
});