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
  let currentStep = 'welcome';
  const totalSteps = 9;
  const stepHistory = ['welcome'];
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

    const prevEl = getStepElement(prevStep);
    if (prevEl) {
      // Clear any inline option selection styles on the step we're returning to
      prevEl.querySelectorAll('.option-btn').forEach(function(btn) {
        btn.style.borderColor = '';
        btn.style.background = '';
      });
      prevEl.querySelectorAll('.ins-item').forEach(function(item) {
        item.classList.remove('selected');
      });

      prevEl.classList.add('active');
      currentStep = prevStep;
      var progressMap = { 'welcome': 0, 'blood-sugar': 1.5, 'review': 2.5, 'insurance-picker': 3.5, 'not-eligible': 1.5, '5b': 5, '8b': 8.5, 'verify': 4.5 };
      updateProgress(typeof prevStep === 'number' ? prevStep : (progressMap[prevStep] || 1));
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

    // Add back button to steps 2-8 and string steps like blood-sugar (not on welcome or confirmation)
    if ((typeof currentStep === 'number' && currentStep >= 2 && currentStep <= 8) || currentStep === 'blood-sugar' || currentStep === 'insurance-picker' || currentStep === 'review' || currentStep === '5b' || currentStep === '8b') {
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

  // ---- Element Lookup Helper ----
  const stepIdMap = {
    'welcome': 'stepWelcome',
    'not-eligible': 'stepNotEligible',
    'blood-sugar': 'stepBloodSugar',
    'review': 'stepReview',
    'insurance-picker': 'stepInsurancePicker',
    '5b': 'step5b',
    '8b': 'step8b',
    'verify': 'stepVerify'
  };

  function getStepElement(stepId) {
    if (typeof stepId === 'number') {
      return document.getElementById('step' + stepId);
    }
    return document.getElementById(stepIdMap[stepId] || ('step' + stepId));
  }

  // ---- Navigation ----
  function goToStep(stepId) {
    const currentEl = container.querySelector('.step.active');
    const nextEl = getStepElement(stepId);

    if (!nextEl || nextEl === currentEl) return;

    currentEl.classList.remove('active');

    // Clear any inline option selection styles on the destination step
    nextEl.querySelectorAll('.option-btn').forEach(function(btn) {
      btn.style.borderColor = '';
      btn.style.background = '';
    });
    nextEl.querySelectorAll('.ins-item').forEach(function(item) {
      item.classList.remove('selected');
    });

    nextEl.classList.add('active');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Track step
    currentStep = stepId;
    stepHistory.push(stepId);

    // Map string step IDs to progress values
    var progressMap = { 'welcome': 0, 'blood-sugar': 1.5, 'review': 2.5, 'insurance-picker': 3.5, 'not-eligible': 1.5, '5b': 5, '8b': 8.5, 'verify': 4.5 };
    updateProgress(typeof stepId === 'number' ? stepId : (progressMap[stepId] || currentStep));

    // Show phone on later steps
    if ((typeof currentStep === 'number' && currentStep >= 4) || currentStep === 'insurance-picker') {
      headerPhone.style.display = 'flex';
    }

    // Auto-advance review interstitial
    if (stepId === 'review') {
      if (window._reviewTimeout) clearTimeout(window._reviewTimeout);
      window._reviewTimeout = setTimeout(function() {
        if (currentStep === 'review') goToStep(3);
      }, 5000);
    }

    // Update back button visibility
    updateBackButton();
  }

  // ---- Validate Step Router (Insurance ID → Verify → step 5 or 5b) ----
  function goToValidateStep() {
    // Go to verification loading screen first, then route to benefits summary
    goToStep('verify');
    startBenefitsVerification();
  }

  function goToBenefitsSummary() {
    // All insurance types use the same commercial-style benefits table (step 5b)
    var providerEl = document.getElementById('benefitsProviderName');
    var amounts = document.querySelectorAll('#step5b .bt-amount');
    var metSpans = document.querySelectorAll('#step5b .bt-met');

    if (selectedInsuranceType === 'medicare') {
      if (providerEl) providerEl.textContent = 'Medicare';
      // Zero out deductible and OOP for Medicare
      if (amounts[0]) amounts[0].textContent = '$0';      // Annual Deductible
      if (metSpans[0]) metSpans[0].textContent = '$0 met'; // met amount
      if (amounts[1]) amounts[1].textContent = '$0';       // Remaining Deductible
      if (amounts[2]) amounts[2].textContent = '$0';       // OOP Max
      if (metSpans[1]) metSpans[1].textContent = '$0 met'; // OOP met
      if (amounts[3]) amounts[3].textContent = '0%';       // Coinsurance
      if (amounts[4]) amounts[4].textContent = '$0';       // Copay
      // Update estimate range
      var estLow = document.querySelector('#step5b .estimate-low');
      var estHigh = document.querySelector('#step5b .estimate-high');
      if (estLow) estLow.textContent = '$0';
      if (estHigh) estHigh.textContent = '$0';
    } else if (selectedInsuranceType === 'medicaid') {
      if (providerEl) providerEl.textContent = 'Medicaid';
      if (amounts[0]) amounts[0].textContent = '$0';
      if (metSpans[0]) metSpans[0].textContent = '$0 met';
      if (amounts[1]) amounts[1].textContent = '$0';
      if (amounts[2]) amounts[2].textContent = '$0';
      if (metSpans[1]) metSpans[1].textContent = '$0 met';
      if (amounts[3]) amounts[3].textContent = '0%';
      if (amounts[4]) amounts[4].textContent = '$0';
      var estLow2 = document.querySelector('#step5b .estimate-low');
      var estHigh2 = document.querySelector('#step5b .estimate-high');
      if (estLow2) estLow2.textContent = '$0';
      if (estHigh2) estHigh2.textContent = '$0';
    } else {
      // Commercial — use default demo values
      var providerName = funnelData.insuranceProvider || 'Your Insurance';
      if (providerEl) providerEl.textContent = providerName;
    }

    goToStep('5b');
  }

  // ---- Insurance ID Setup ----
  let insuranceIdListenersAdded = false;

  function updateInsuranceIdText() {
    const insuranceIdQuestion = document.getElementById('insuranceIdQuestion');
    const insuranceIdHint = document.getElementById('insuranceIdHint');
    const insuranceIdInput = document.getElementById('insuranceId');
    if (!insuranceIdQuestion) return;

    var hintText = "We'll run a complimentary benefits check for you — having your ID lets us get you results faster, but it's totally optional.";
    if (selectedInsuranceType === 'medicare') {
      insuranceIdQuestion.textContent = "Have your Medicare card handy?";
      insuranceIdHint.textContent = hintText;
      insuranceIdInput.placeholder = "1EG4-TE5-MK72";
    } else if (selectedInsuranceType === 'medicaid') {
      insuranceIdQuestion.textContent = "Have your Medicaid card handy?";
      insuranceIdHint.textContent = hintText;
      insuranceIdInput.placeholder = "Your Medicaid ID";
    } else if (selectedInsuranceType === 'private') {
      insuranceIdQuestion.textContent = "Have your insurance card handy?";
      insuranceIdHint.textContent = hintText;
      insuranceIdInput.placeholder = "Member ID";
    } else {
      insuranceIdQuestion.textContent = "Have your insurance card handy?";
      insuranceIdHint.textContent = hintText;
      insuranceIdInput.placeholder = "Insurance ID";
    }
  }

  function setupInsuranceIdStep() {
    const insuranceIdForm = document.getElementById('insuranceIdForm');
    const cardYesBtn = document.getElementById('cardYesBtn');
    const cardNoBtn = document.getElementById('cardNoBtn');
    if (!insuranceIdForm || insuranceIdListenersAdded) return;
    insuranceIdListenersAdded = true;

    // Show form when user has card
    if (cardYesBtn) {
      cardYesBtn.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('cardHandyOptions').style.display = 'none';
        insuranceIdForm.style.display = '';
        insuranceIdForm.querySelector('input').focus();
      });
    }

    // Skip directly to validate when user doesn't have card
    if (cardNoBtn) {
      cardNoBtn.addEventListener('click', function(e) {
        e.preventDefault();
        goToValidateStep();
      });
    }

    insuranceIdForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const insuranceId = document.getElementById('insuranceId').value;
      if (insuranceId.trim()) {
        funnelData.insuranceId = insuranceId;
      }
      goToValidateStep();
    });
  }

  // ---- Review Skip Button ----
  var reviewSkipBtn = document.getElementById('reviewSkipBtn');
  if (reviewSkipBtn) {
    reviewSkipBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (window._reviewTimeout) clearTimeout(window._reviewTimeout);
      goToStep(3);
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

      // Track insurance type and update the insurance ID step text
      if (stepNum === '3') {
        selectedInsuranceType = value;
        updateInsuranceIdText();
      }

      // Visual feedback
      optionBtn.style.borderColor = 'var(--mm-teal)';
      optionBtn.style.background = 'var(--mm-teal-light)';

      // Slight delay for visual feedback, then advance
      setTimeout(function() {
        // Clear the inline selection styles before navigating away
        // so they won't persist if the user comes back
        optionBtn.style.borderColor = '';
        optionBtn.style.background = '';

        // If it's a known string step ID, route as string; otherwise parse as number
        if (stepIdMap[nextStep]) {
          goToStep(nextStep);
        } else {
          goToStep(parseInt(nextStep));
        }
      }, 300);

      return;
    }

    const ctaBtn = e.target.closest('.cta-btn[data-next]');
    if (ctaBtn) {
      const nextStep = ctaBtn.dataset.next;
      // Check if it's a number or string step ID
      if (isNaN(nextStep)) {
        goToStep(nextStep);
      } else {
        goToStep(parseInt(nextStep));
      }
      return;
    }
  });

  // ---- Form Submission - Personal Info ----
  const personalInfoForm = document.getElementById('personalInfoForm');
  if (personalInfoForm) {
    personalInfoForm.addEventListener('submit', function(e) {
      e.preventDefault();

      // Collect form data
      const formData = new FormData(personalInfoForm);
      formData.forEach(function(value, key) {
        funnelData[key] = value;
      });

      // Advance to step 8b
      goToStep('8b');
    });
  }

  // ---- Form Submission - Account Info ----
  const accountForm = document.getElementById('accountForm');
  if (accountForm) {
    accountForm.addEventListener('submit', function(e) {
      e.preventDefault();

      // Collect form data
      const formData = new FormData(accountForm);
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

  // ---- Data Export (Testing) ----
  const exportBtn = document.getElementById('exportDataBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', function() {
      const timestamp = new Date().toISOString();
      let content = '=== MEDICALLY MODERN — INTAKE DATA EXPORT ===\n';
      content += 'Generated: ' + timestamp + '\n';
      content += '================================================\n\n';

      // Organize data by category
      content += '--- QUALIFICATION ---\n';
      if (funnelData.step_1) content += 'Diabetes Status: ' + funnelData.step_1 + '\n';
      if (funnelData['step_blood-sugar']) content += 'Blood Sugar Concern: ' + funnelData['step_blood-sugar'] + '\n';
      if (funnelData.step_2) content += 'Insulin Use: ' + funnelData.step_2 + '\n';
      content += '\n';

      content += '--- INSURANCE ---\n';
      if (funnelData.step_3) content += 'Insurance Type: ' + funnelData.step_3 + '\n';
      if (funnelData.insuranceProvider) content += 'Insurance Provider: ' + funnelData.insuranceProvider + '\n';
      if (funnelData.insuranceId) content += 'Insurance ID: ' + funnelData.insuranceId + '\n';
      content += '\n';

      content += '--- DOCTOR INFO ---\n';
      if (funnelData.doctorName) content += 'Doctor Name: ' + funnelData.doctorName + '\n';
      if (funnelData.doctorPhone) content += 'Doctor Phone: ' + funnelData.doctorPhone + '\n';
      if (funnelData.practiceName) content += 'Practice Name: ' + funnelData.practiceName + '\n';
      content += '\n';

      content += '--- CGM PREFERENCE ---\n';
      if (funnelData.step_7) content += 'CGM Choice: ' + funnelData.step_7 + '\n';
      content += '\n';

      content += '--- PATIENT INFO ---\n';
      if (funnelData.firstName) content += 'First Name: ' + funnelData.firstName + '\n';
      if (funnelData.lastName) content += 'Last Name: ' + funnelData.lastName + '\n';
      if (funnelData.phone) content += 'Phone: ' + funnelData.phone + '\n';
      if (funnelData.dob) content += 'Date of Birth: ' + funnelData.dob + '\n';
      if (funnelData.email) content += 'Email: ' + funnelData.email + '\n';
      content += '\n';

      content += '--- PROCESSING FLAGS ---\n';
      content += 'Zero-Touch Eligible: ' + (funnelData.zeroTouch ? 'YES' : 'NO') + '\n';
      content += '\n';

      content += '--- RAW JSON (for CRM import) ---\n';
      content += JSON.stringify(funnelData, null, 2) + '\n';

      // Create and download the file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mm-intake-' + (funnelData.lastName || 'unknown') + '-' + new Date().toISOString().slice(0,10) + '.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // ---- Insurance Provider Picker ----
  const insuranceGrid = document.getElementById('insuranceGrid');
  const insuranceOtherBtn = document.getElementById('insuranceOtherBtn');
  const insuranceSearch = document.getElementById('insuranceSearch');
  const insuranceNoResults = document.getElementById('insuranceNoResults');

  if (insuranceGrid) {
    insuranceGrid.addEventListener('click', function(e) {
      const item = e.target.closest('.ins-item');
      if (!item) return;

      const provider = item.dataset.provider;
      funnelData.insuranceProvider = provider;

      // Visual feedback
      insuranceGrid.querySelectorAll('.ins-item').forEach(function(c) {
        c.classList.remove('selected');
      });
      item.classList.add('selected');

      setTimeout(function() {
        goToStep(4);
      }, 350);
    });
  }

  // Search/filter
  if (insuranceSearch && insuranceGrid) {
    insuranceSearch.addEventListener('input', function() {
      var query = this.value.toLowerCase().trim();
      var items = insuranceGrid.querySelectorAll('.ins-item');
      var visibleCount = 0;

      items.forEach(function(item) {
        var label = (item.querySelector('.ins-label') || {}).textContent || '';
        var provider = item.dataset.provider || '';
        var match = label.toLowerCase().indexOf(query) !== -1 ||
                    provider.toLowerCase().indexOf(query) !== -1;
        item.style.display = match ? '' : 'none';
        if (match) visibleCount++;
      });

      if (insuranceNoResults) {
        insuranceNoResults.style.display = visibleCount === 0 ? '' : 'none';
      }
    });
  }

  if (insuranceOtherBtn) {
    insuranceOtherBtn.addEventListener('click', function(e) {
      e.preventDefault();
      funnelData.insuranceProvider = 'Other / Not Listed';
      goToStep(4);
    });
  }

  // ---- Keyboard navigation ----
  document.addEventListener('keydown', function(e) {
    // Allow back with Escape (when not in input)
    if (e.key === 'Escape' && !e.target.closest('input') && stepHistory.length > 1) {
      goBack();
    }
  });

  // ---- Reviews Carousel ----
  var reviewsTrack = document.getElementById('reviewsTrack');
  var reviewsPrev = document.getElementById('reviewsPrev');
  var reviewsNext = document.getElementById('reviewsNext');

  if (reviewsTrack && reviewsPrev && reviewsNext) {
    reviewsNext.addEventListener('click', function() {
      reviewsTrack.scrollBy({ left: 296, behavior: 'smooth' });
    });
    reviewsPrev.addEventListener('click', function() {
      reviewsTrack.scrollBy({ left: -296, behavior: 'smooth' });
    });
  }

  // ---- Password Toggle ----
  var pwToggle = document.getElementById('pwToggle');
  var pwInput = document.getElementById('password');
  if (pwToggle && pwInput) {
    pwToggle.addEventListener('click', function() {
      var isPassword = pwInput.type === 'password';
      pwInput.type = isPassword ? 'text' : 'password';
      var eyeOpen = pwToggle.querySelector('.pw-eye-open');
      var eyeClosed = pwToggle.querySelector('.pw-eye-closed');
      if (eyeOpen && eyeClosed) {
        eyeOpen.style.display = isPassword ? 'none' : '';
        eyeClosed.style.display = isPassword ? '' : 'none';
      }
    });
  }

  // ---- Benefits Verification Loading Animation ----
  var verifyInterval = null;
  var verifyTimeout = null;

  function startBenefitsVerification() {
    var progressBar = document.getElementById('verifyProgressBar');
    var statusText = document.getElementById('verifyStatusText');
    var slidesContainer = document.getElementById('verifySlides');
    var dotsContainer = document.getElementById('verifyDots');
    var verifyScreen = document.querySelector('.verify-screen');

    if (!progressBar || !slidesContainer) return;

    var slides = slidesContainer.querySelectorAll('.verify-slide');
    var dots = dotsContainer ? dotsContainer.querySelectorAll('.verify-dot') : [];
    var totalSlides = slides.length;
    var currentSlide = 0;
    var progress = 0;

    // Status messages that rotate with the progress bar
    var statusMessages = [
      { at: 0, text: 'Connecting to your insurer' },
      { at: 15, text: 'Verifying member information' },
      { at: 35, text: 'Checking CGM eligibility' },
      { at: 55, text: 'Reviewing coverage details' },
      { at: 75, text: 'Confirming your benefits' },
      { at: 92, text: 'Almost there...' }
    ];

    // Total duration: ~25 seconds (enough for 5 slide rotations at ~5s each)
    var totalDuration = 25000;
    var slideInterval = 5000;
    var progressStep = 100 / (totalDuration / 100);

    // Activate first slide
    slides[0].classList.add('active');
    if (dots.length > 0) dots[0].classList.add('active');

    // Progress bar animation
    var progressInterval = setInterval(function() {
      progress += progressStep;
      if (progress >= 100) progress = 100;

      progressBar.style.width = progress + '%';

      // Update status text with clean fade
      for (var i = statusMessages.length - 1; i >= 0; i--) {
        if (progress >= statusMessages[i].at) {
          if (statusText.textContent !== statusMessages[i].text && !statusText.classList.contains('fading')) {
            statusText.classList.add('fading');
            setTimeout(function(msg) {
              statusText.textContent = msg;
              statusText.classList.remove('fading');
            }.bind(null, statusMessages[i].text), 600);
          }
          break;
        }
      }

      if (progress >= 100) {
        clearInterval(progressInterval);
        completeBenefitsVerification(verifyScreen, statusText, progressBar);
      }
    }, 100);

    // Slide rotation
    verifyInterval = setInterval(function() {
      var prevSlide = currentSlide;
      currentSlide = (currentSlide + 1) % totalSlides;

      // Animate out current slide
      slides[prevSlide].classList.add('exiting');
      slides[prevSlide].classList.remove('active');

      // After exit animation completes, remove exiting class
      setTimeout(function() {
        slides[prevSlide].classList.remove('exiting');
      }, 1000);

      // Slight delay before showing next slide for cleaner crossfade
      setTimeout(function() {
        slides[currentSlide].classList.add('active');
      }, 250);

      // Update dots
      for (var d = 0; d < dots.length; d++) {
        dots[d].classList.toggle('active', d === currentSlide);
      }
    }, slideInterval);

    // Safety cleanup after max duration
    verifyTimeout = setTimeout(function() {
      clearInterval(verifyInterval);
    }, totalDuration + 2000);
  }

  function completeBenefitsVerification(screen, statusText, progressBar) {
    // Stop slide rotation
    if (verifyInterval) clearInterval(verifyInterval);

    // Update UI to completion state
    if (screen) screen.classList.add('complete');

    var heading = screen ? screen.querySelector('.verify-heading') : null;
    if (heading) heading.textContent = 'Benefits verified!';

    if (statusText) {
      statusText.classList.add('fading');
      setTimeout(function() {
        statusText.textContent = 'Great news — you\'re covered.';
        statusText.style.color = 'var(--mm-teal)';
        statusText.style.fontWeight = '600';
        statusText.classList.remove('fading');
      }, 600);
    }

    // Replace shield with checkmark
    var shieldSvg = screen ? screen.querySelector('.verify-shield') : null;
    if (shieldSvg) {
      shieldSvg.innerHTML = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>';
      shieldSvg.setAttribute('stroke-width', '2.5');
    }

    // Seamless transition to benefits summary after a moment
    setTimeout(function() {
      goToBenefitsSummary();

      // Clean up verify screen state for potential re-use
      if (screen) screen.classList.remove('complete');
      if (statusText) {
        statusText.style.color = '';
        statusText.style.fontWeight = '';
      }
      if (progressBar) progressBar.style.width = '0%';

      // Reset slides
      var slides = document.querySelectorAll('.verify-slide');
      slides.forEach(function(s) {
        s.classList.remove('active', 'exiting');
      });
      var dots = document.querySelectorAll('.verify-dot');
      dots.forEach(function(d, i) {
        d.classList.toggle('active', i === 0);
      });
    }, 2500);
  }

  // ---- Init ----
  function init() {
    updateProgress(0);
    updateBackButton();

    // Setup event listeners for dynamic steps
    setupInsuranceIdStep();
    setupDoctorForm();
  }

  init();

})();
