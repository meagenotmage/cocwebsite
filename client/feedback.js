document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('feedback-form');
    const typeCards = document.querySelectorAll('.type-card');
    const isAnonCheckbox = document.getElementById('is-anonymous');
    const contactFields = document.getElementById('contact-fields');
    const partnershipHint = document.getElementById('partnership-hint');
    const senderNameInput = document.getElementById('sender-name');
    const senderEmailInput = document.getElementById('sender-email');
    const submitBtn = document.getElementById('submit-btn');
    const submitBtnText = document.getElementById('submit-btn-text');
    const submitBtnLoading = document.getElementById('submit-btn-loading');
    const successBanner = document.getElementById('feedback-success');
    const errorBanner = document.getElementById('feedback-error');
    const errorText = document.getElementById('feedback-error-text');
    const typeError = document.getElementById('type-error');
    const messageError = document.getElementById('message-error');
    const emailError = document.getElementById('email-error');

    // --- Anonymous toggle ---
    isAnonCheckbox.addEventListener('change', () => {
        if (isAnonCheckbox.checked) {
            contactFields.style.display = 'none';
        } else {
            contactFields.style.display = 'block';
            updatePartnershipHint();
        }
    });

    // Show/hide partnership hint when type changes
    typeCards.forEach(card => {
        card.addEventListener('click', () => {
            typeCards.forEach(c => c.querySelector('.type-card-inner').classList.remove('selected'));
            updatePartnershipHint();
        });
    });

    function updatePartnershipHint() {
        const selected = document.querySelector('input[name="type"]:checked');
        if (partnershipHint) {
            partnershipHint.style.display =
                (!isAnonCheckbox.checked && selected && selected.value === 'partnership')
                    ? 'flex'
                    : 'none';
        }
    }

    // Also listen for radio changes to update hint
    document.querySelectorAll('input[name="type"]').forEach(radio => {
        radio.addEventListener('change', updatePartnershipHint);
    });

    // --- Validation helpers ---
    function getSelectedType() {
        const checked = document.querySelector('input[name="type"]:checked');
        return checked ? checked.value : null;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function clearErrors() {
        typeError.style.display = 'none';
        messageError.style.display = 'none';
        emailError.style.display = 'none';
        errorBanner.style.display = 'none';
        successBanner.style.display = 'none';
    }

    function setLoading(loading) {
        submitBtn.disabled = loading;
        submitBtnText.style.display = loading ? 'none' : 'inline';
        submitBtnLoading.style.display = loading ? 'inline' : 'none';
    }

    // --- Form submit ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        let valid = true;

        const type = getSelectedType();
        if (!type) {
            typeError.style.display = 'block';
            valid = false;
        }

        const message = document.getElementById('feedback-message').value.trim();
        if (!message) {
            messageError.style.display = 'block';
            valid = false;
        }

        const isAnonymous = isAnonCheckbox.checked;
        const senderName = senderNameInput.value.trim();
        const senderEmail = senderEmailInput.value.trim();

        if (!isAnonymous && senderEmail && !isValidEmail(senderEmail)) {
            emailError.style.display = 'block';
            valid = false;
        }

        if (!valid) return;

        setLoading(true);

        const payload = {
            type,
            message,
            isAnonymous,
            senderName: isAnonymous ? undefined : (senderName || undefined),
            senderEmail: isAnonymous ? undefined : (senderEmail || undefined)
        };

        try {
            const response = await fetch(`${CONFIG.API_URL}/api/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                form.reset();
                contactFields.style.display = 'none';
                if (partnershipHint) partnershipHint.style.display = 'none';
                successBanner.style.display = 'flex';
                successBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                errorText.textContent = data.message || 'Something went wrong. Please try again.';
                errorBanner.style.display = 'flex';
            }
        } catch (err) {
            console.error('Feedback submission error:', err);
            errorText.textContent = 'Unable to reach the server. Please check your connection and try again.';
            errorBanner.style.display = 'flex';
        } finally {
            setLoading(false);
        }
    });
});
