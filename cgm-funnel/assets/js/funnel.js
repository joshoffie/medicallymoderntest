/**
 * Medically Modern — CGM Funnel Logic
 * Updated with insurance ID, doctor details, and back button
 *
 * Flow:
 * 1. Diabetes check
 * 2. Insulin check
 * 3. Insurance type
 * 4. Insurance ID (conditional based on type)
 * 5. Validate / Qualify
 * 6. Doctor details
 * 7. CGM preference
 * 8. Patient info form
 * 9. Confirmation
 */

(function() {
  'use strict';

  // ---- State ----
  const funnelData = {};
  let currentStep = 1;
  const totalSteps = 9;
  const stepHistory = [1];
  let selectedInsuranceType = null;

  // ---- DOM ----
  const container = document.getElementById('funnelContainer');
  const progressFill = document.getElementById('progressFill');
  const headerPhone = document.getElementById('headerPhone');

  // ---- Progress ----
  function updateProgress(step) {
    const pct = Math.min((step / totalSteps) * 100, 100);
    progressFill.style.width = pct + '%';
  }

  // ---- Back Button ----
  function createBackButton() {
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'back-btn';
    backBtn.innerHTML = '← Back';
    backBtn.addEventListener('click', goBack);
    return backBtn;
  }

  function goBack(e) {
    if (e) e.preventDefault();
    if (stepHistory.length <= 1) return;

    stepHistory.pop();
    const prevStep = stepHistory[stepHistory.length - 1];

    const currentEl = container.querySelector('.step.active');
    currentEl.classList.remove('active');

    const prevEl = document.getElementById('step' + prevStep);
    if (prevEl) {
      prevEl.classList.add('active');
      currentStep = prevStep;
      updateProgress(prevStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      updateBackButton();
    }
  }

  function updateBackButton() {
    // Remove existing back button
    const existingBack = container.querySelector('.back-btn');
    if (existingBack) {
      existingBack.remove();
    }

    // Add back button to steps 2-8 (not on step 1 or confirmation)
    if (currentStep >= 2 && currentStep <= 8) {
      const activeStep = container.querySelector('.step.active');
      if (activeStep) {
        const stepContent = activeStep.querySelector('.step-content');
        if (stepContent) {
          const backBtn = createBackButton();
          stepContent.insertBefore(backBtn, stepContent.firstChild);
        }
      }
    }
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

    // Update back button visibility
    updateBackButton();
  }

  // ---- Insurance ID Setup ----
  function setupInsuranceIdStep() {
    const insuranceIdForm = document.getElementById('insuranceIdForm');
    const skipInsuranceIdBtn = document.getElementById('skipInsuranceIdBtn');
    const insuranceIdQuestion = document.getElementById('insuranceIdQuestion');
    const insuranceIdHint = document.getElementById('insuranceIdHint');

    if (!insuranceIdForm) return;

    // Update question and hint based on insurance type
    if (selectedInsuranceType === 'medicare') {
      insuranceIdQuestion.textContent = "What's your Medicare ID number?";
      insuranceIdHint.textContent = "Found on your red, white, and blue Medicare card. Format: 1EG4-TE5-MK72";
    } else if (selectedInsuranceType === 'medicaid') {
      insuranceIdQuestion.textContent = "What's your Medicaid ID number?";
      insuranceIdHint.textContent = "Found on your state Medicaid card";
    } else {
      insuranceIdQuestion.textContent = "What's your Member ID?";
      insuranceIdHint.textContent = "Found on your insurance card — front or back";
    }

    insuranceIdForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const insuranceId = document.getElementById('insuranceId').value;
      if (insuranceId.trim()) {
        funnelData.insuranceId = insuranceId;
      }
      goToStep(5);
    });

    skipInsuranceIdBtn.addEventListener('click', function(e) {
      e.preventDefault();
      goToStep(5);
    });
  }

  // ---- Doctor Form Setup ----
  function setupDoctorForm() {
    const doctorForm = document.getElementById('doctorForm');
    const skipDoctorBtn = document.getElementById('skipDoctorBtn');

    if (!doctorForm) return;

    doctorForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const doctorName = document.getElementById('doctorName').value;
      const doctorPhone = document.getElementById('doctorPhone').value;
      const practiceName = document.getElementById('practiceName').value;

      if (doctorName.trim()) {
        funnelData.doctorName = doctorName;
      }
      if (doctorPhone.trim()) {
        funnelData.doctorPhone = doctorPhone;
      }
      if (practiceName.trim()) {
        funnelData.practiceName = practiceName;
      }

      goToStep(7);
    });

    skipDoctorBtn.addEventListener('click', function(e) {
      e.preventDefault();
      goToStep(7);
    });
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

      // Track insurance type for later use
      if (stepNum === '3') {
        selectedInsuranceType = value;
      }

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
  if (intakeForm) {
    intakeForm.addEventListener('submit', function(e) {
      e.preventDefault();

      // Collect form data
      const formData = new FormData(intakeForm);
      formData.forEach(function(value, key) {
        funnelData[key] = value;
      });

      // Determine if we have "zero touch" setup (all info provided)
      const hasInsuranceId = !!funnelData.insuranceId;
      const hasDoctorName = !!funnelData.doctorName;
      const hasDoctorPhone = !!funnelData.doctorPhone;
      const zeroTouch = hasInsuranceId && hasDoctorName && hasDoctorPhone;
      funnelData.zeroTouch = zeroTouch;

      // Personalize confirmation screen
      const firstNameSpan = document.getElementById('patientFirstName');
      const confirmationHeadline = document.getElementById('confirmationHeadline');
      const confirmationSubtitle = document.getElementById('confirmationSubtitle');

      if (funnelData.firstName) {
        firstNameSpan.textContent = funnelData.firstName;
      }

      // Update confirmation message based on zeroTouch
      if (zeroTouch) {
        confirmationSubtitle.textContent = "We're already getting started. We have everything we need to begin processing your CGM coverage. You'll receive a text message shortly with updates.";
      }

      // Log the complete funnel data
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
      goToStep(9);
    });
  }

  // ---- Phone formatting ----
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
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
  }

  // ---- Doctor Phone formatting ----
  const doctorPhoneInput = document.getElementById('doctorPhone');
  if (doctorPhoneInput) {
    doctorPhoneInput.addEventListener('input', function(e) {
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
  }

  // ---- Keyboard navigation ----
  document.addEventListener('keydown', function(e) {
    // Allow back with Escape (when not in input)
    if (e.key === 'Escape' && !e.target.closest('input') && stepHistory.length > 1) {
      goBack();
    }
  });

  // ---- Init ----
  function init() {
    updateProgress(1);
    updateBackButton();

    // Setup event listeners for dynamic steps
    setupInsuranceIdStep();
    setupDoctorForm();
  }

  init();

})();
