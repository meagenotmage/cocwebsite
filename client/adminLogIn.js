const loginForm = document.getElementById("login-form");

if (loginForm) {
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            // Using the centralized CONFIG object here
            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.LOGIN}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                window.location.href = 'admin.html';
            } else {
                alert("Login failed: " + (data.message || "Invalid credentials"));
            }
        } catch (error) {
            console.error("Login Error:", error);
            alert("Could not connect to the server.");
        }
    });
}