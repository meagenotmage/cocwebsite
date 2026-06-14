// Redirects to login if admin session is missing. Include on all admin pages except adminLogIn.html.
(function guardAdminPage() {
  if (!window.CONFIG) return;
  if (window.location.pathname.includes('adminLogIn')) return;

  fetch(`${CONFIG.API_URL}/api/admin/check`, { credentials: 'include' })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.authenticated) {
        window.location.href = 'adminLogIn.html';
      }
    })
    .catch(function (err) {
      console.warn('[COC] Could not verify admin session:', err);
    });
})();
