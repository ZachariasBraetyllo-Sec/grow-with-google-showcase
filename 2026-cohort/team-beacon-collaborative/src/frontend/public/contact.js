(() => {
  const form = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  const reason = document.getElementById('reason');
  const fields = [
    ['full-name', 'Please enter your full name.'],
    ['email', 'Enter a valid email address.'],
    ['reason', 'Please select a reason for contacting us.'],
    ['message', 'Please tell us how we can help.']
  ];
  const setError = (input, message) => {
    const wrapper = input.closest('.form-field');
    const error = document.getElementById(`${input.id}-error`);
    wrapper.classList.toggle('invalid', Boolean(message));
    input.setAttribute('aria-invalid', Boolean(message));
    error.textContent = message || '';
  };
  const validate = (input, message) => {
    const invalid = !input.value.trim() || (input.type === 'email' && !input.validity.valid);
    setError(input, invalid ? message : '');
    return !invalid;
  };
  fields.forEach(([id, message]) => document.getElementById(id).addEventListener('input', event => validate(event.target, message)));
  document.querySelectorAll('.pathway').forEach(button => button.addEventListener('click', () => {
    reason.value = button.dataset.reason;
    setError(reason, '');
    document.getElementById('message').focus({ preventScroll: true });
    document.getElementById('contact-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const valid = fields.map(([id, message]) => validate(document.getElementById(id), message)).every(Boolean);
    if (!valid) { form.querySelector('[aria-invalid="true"]').focus(); return; }
    success.hidden = false;
    success.focus();
    form.reset();
  });
})();
