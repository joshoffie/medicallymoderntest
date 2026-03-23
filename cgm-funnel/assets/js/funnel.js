/**
 * Medically Modern — CGM Funnel Logic
 * qualify → validate → route → collect → connect
 *
 * Each answer is stored and passed through to the backend/CRM.
 * The flow mirrors the Hims-style one-question-per-screen pattern
 * optimized for Medicare-aged patients.
 */

(function() {
  'use strict';

  // ---- State ----
  const funnelData = {};
  let currentStep = 1;
  const totalSteps = 7;
  const stepHistory = [1];

  // ---- DOM ----
  const container = document.getElementById('funnelContainer');
  const progressFill = document.getElementById('progressFill');
  const headerPhone = document.getElementById('headerPhone');

  // ---- Progress ----
  function updateProgress(step) {
    const pct = Math.min((step / totalSteps) * 100, 100);
    progressFill.style.width = pct + '%';
  }

  // ---- Navigation ----
  function goToStep(stepId) {
    const currentEl = container.querySelector('.step.active');
    const nextEl = document.getElementById('step' + stepId) ||
                   document.getElementById('stepNotEligible');

    if (!nextEl || nextEl === currentEl) return;

    currentEl.classList.remove('active');
    nextEl.classList.add('active');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Track step
    if (typeof stepId === 'number') {
      currentStep = stepId;
      stepHistory.push(stepId);
    }

    updateProgress(typeof stepId === 'number' ? stepId : totalSteps);

    // Show phone on later steps
    if (currentStep >= 4) {
      headerPhone.style.display = 'flex';
    }
  }

  // ---- Option Click Handlers ----
  container.addEventListener('click', function(e) {
    const optionBtn = e.target.closest('.option-btn');
    if (optionBtn) {
      const value = optionBtn.dataset.value;
      const nextStep = optionBtn.dataset.next;

      // Store answer
      const stepEl = optionBtn.closest('.step');
      const stepNum = stepEl.dataset.step;
      funnelData['step_' + stepNum] = value;

      // Visual feedback
      optionBtn.style.borderColor = 'var(--mm-teal)';
      optionBtn.style.background = 'var(--mm-teal-light)';

      // Slight delay for visual feedback, then advance
      setTimeout(function() {
        if (nextStep === 'not-eligible') {
          goToStep('not-eligible');
        } else {
          goToStep(parseInt(nextStep));
        }
      }, 300);

      return;
    }

    const ctaBtn = e.target.closest('.cta-btn[data-next]');
    if (ctaBtn) {
      const nextStep = parseInt(ctaBtn.dataset.next);
      goToStep(nextStep);
      return;
    }
  });

  // ---- Form Submission ----
  const intakeForm = document.getElementById('intakeForm');
  intakeForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Collect form data
    const formData = new FormData(intakeForm);
    formData.forEach(function(value, key) {
      funnelData[key] = value;
    });

    // Personalize confirmation screen
    const firstNameSpan = document.getElementById('patientFirstName');
    if (funnelData.firstName) {
      firstNameSpan.textContent = funnelData.firstName;
    }

    // Log the complete funnel data (replace with real backend call)
    console.log('=== FUNNEL SUBMISSION ===');
    console.log(JSON.stringify(funnelData, null, 2));

    // TODO: Replace with actual API call to your CRM/Monday.com
    // Example:
    // fetch('/api/intake', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(funnelData)
    // });

    // Advance to confirmation
    goToStep(7);
  });

  // ---- Phone formatting ----
  const phoneInput = document.getElementById('phone');
  phoneInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);

    if (value.length >= 7) {
      value = '(' + value.slice(0, 3) + ') ' + value.slice(3, 6) + '-' + value.slice(6);
    } else if (value.length >= 4) {
      value = '(' + value.slice(0, 3) + ') ' + value.slice(3);
    } else if (value.length >= 1) {
      value = '(' + value;
    }

    e.target.value = value;
  });

  // ---- Keyboard navigation ----
  document.addEventListener('keydown', function(e) {
    // Allow back with Escape or Backspace (when not in input)
    if ((e.key === 'Escape' || e.key === 'Backspace') &&
        !e.target.closest('input') &&
        stepHistory.length > 1) {
      stepHistory.pop();
      const prevStep = stepHistory[stepHistory.length - 1];

      const currentEl = container.querySelector('.step.active');
      currentEl.classList.remove('active');

      const prevEl = document.getElementById('step' + prevStep);
      if (prevEl) {
        prevEl.classList.add('active');
        currentStep = prevStep;
        updateProgress(prevStep);
      }
    }
  });

  // ---- Init ----
  updateProgress(1);

})();
