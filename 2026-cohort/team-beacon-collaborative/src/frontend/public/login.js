(() => {
  const form = document.getElementById('login-form');
  const email = document.getElementById('login-email');
  const password = document.getElementById('login-password');
  const toggle = document.getElementById('password-toggle');
  const submit = form.querySelector('.login-button');
  const status = document.getElementById('login-status');
  const showStatus = (message, type) => { status.textContent = message; status.className = `login-status ${type}`; status.hidden = false; status.focus(); };
  const setError = (input, message) => { input.closest('.form-field').classList.toggle('invalid', Boolean(message)); input.setAttribute('aria-invalid', Boolean(message)); document.getElementById(`${input.id}-error`).textContent = message || ''; };
  const validate = () => {
    const emailError = !email.value.trim() ? 'Enter your email address.' : !email.validity.valid ? 'Enter a valid email address.' : '';
    const passwordError = !password.value ? 'Enter your password.' : '';
    setError(email, emailError); setError(password, passwordError);
    return !emailError && !passwordError;
  };
  [email, password].forEach(input => input.addEventListener('input', validate));
  toggle.addEventListener('click', () => { const isHidden = password.type === 'password'; password.type = isHidden ? 'text' : 'password'; toggle.setAttribute('aria-pressed', String(isHidden)); toggle.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password'); toggle.querySelector('i').className = `fa-solid fa-eye${isHidden ? '-slash' : ''}`; });
  document.getElementById('forgot-password').addEventListener('click', event => { event.preventDefault(); showStatus('Password reset will be available when the account connection is added.', 'info'); });
  form.addEventListener('submit', async event => {
    event.preventDefault(); status.hidden = true;
    if (!validate()) { form.querySelector('[aria-invalid="true"]').focus(); return; }
    const auth = window.NourishShareAuth;
    if (!auth || typeof auth.signIn !== 'function') { showStatus('Secure sign-in is not connected in this preview yet. Your details have not been sent.', 'info'); return; }
    submit.setAttribute('aria-busy', 'true'); submit.disabled = true; submit.querySelector('span').textContent = 'Logging in…';
    try { await auth.signIn({ email: email.value.trim(), password: password.value, remember: form.elements.remember.checked }); showStatus('Signed in. Opening your workspace…', 'success'); }
    catch (error) { const code = error && error.code; const message = code === 'auth/invalid-credential' || code === 'auth/wrong-password' ? 'That email or password did not match an account. Please try again.' : code === 'auth/network-request-failed' ? 'We could not connect just now. Check your connection and try again.' : 'We could not sign you in right now. Please try again.'; showStatus(message, 'error'); }
    finally { submit.removeAttribute('aria-busy'); submit.disabled = false; submit.querySelector('span').textContent = 'Log In'; }
  });
})();
