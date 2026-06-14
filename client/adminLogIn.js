const loginForm = document.getElementById("login-form");

if (loginForm) {
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        console.log("Full URL:", `${CONFIG.API_URL}${CONFIG.ENDPOINTS.LOGIN}`);

        try {
            // Using the centralized CONFIG object here
            const response = await fetch(`${CONFIG.API_URL}${CONFIG.ENDPOINTS.LOGIN}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });

            const data = await response.json().catch(function () { return {}; });

            if (response.ok && data.success) {
                window.location.href = 'admin.html';
            } else if (response.status === 404) {
                alert('Login endpoint not found on the server. Make sure the backend is running locally (npm start in server/) or deploy the latest server code to Render.');
            } else if (response.status === 503) {
                alert('Admin login is not configured on the server. Set ADMIN_EMAIL and ADMIN_PASSWORD_HASH in server/.env');
            } else {
                alert("Login failed: " + (data.message || "Invalid credentials"));
            }
        } catch (error) {
            console.error("Login Error:", error);
            alert("Could not connect to the server at " + CONFIG.API_URL + ". Make sure the backend is running (cd server && npm start).");
        }
    });
}