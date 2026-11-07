(function () {
  const form = document.getElementById('delete-form');
  const status = document.getElementById('status');
  const submitBtn = document.getElementById('submit-btn');
  if (!form || !status || !submitBtn) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.className = 'status';
    status.textContent = '';
    submitBtn.disabled = true;

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('/api/v1/account-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          (payload && payload.error && payload.error.message) ||
          payload.message ||
          'Could not delete the account. Check your email and password.';
        throw new Error(message);
      }
      status.className = 'status ok';
      status.textContent =
        'Your account has been permanently deleted. You can close this page.';
      form.reset();
    } catch (error) {
      status.className = 'status error';
      status.textContent = error.message || 'Something went wrong.';
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
