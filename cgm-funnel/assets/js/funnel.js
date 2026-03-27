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

      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      prevEl.classList.add('active');
      currentStep = prevStep;
      var progressMap = { 'welcome': 0, 'blood-sugar': 1.5, 'review': 2.5, 'insurance-picker': 3.5, 'not-eligible': 1.5, '5b': 5, '8b': 8.5, 'verify': 4.5 };
      updateProgress(typeof prevStep === 'number' ? prevStep : (progressMap[prevStep] || 1));
      requestAnimationFrame(function() {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
      });
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

    // Scroll to absolute top BEFORE swapping steps so browser is
    // already at 0,0 when the new step renders
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;  // Safari fallback

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

    // Belt-and-suspenders: scroll again after layout and after paint
    requestAnimationFrame(function() {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      requestAnimationFrame(function() {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
      });
    });

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

    // Re-trigger animations for doctor subtitle (step 6)
    if (stepId === 6) {
      var subtitle = nextEl.querySelector('.doctor-subtitle');
      if (subtitle) {
        // Remove class to reset, force reflow, then re-add to trigger animations
        subtitle.classList.remove('animate-in');
        void subtitle.offsetHeight;  // force reflow
        subtitle.classList.add('animate-in');
      }
    }

    // Re-trigger animations for confirmation screen (step 9)
    if (stepId === 9) {
      var dropBadge = nextEl.querySelector('.drop-check');
      var trampolineText = nextEl.querySelector('.trampoline-text');
      if (dropBadge) { dropBadge.style.animation = 'none'; dropBadge.offsetHeight; dropBadge.style.animation = ''; }
      if (trampolineText) { trampolineText.style.animation = 'none'; trampolineText.offsetHeight; trampolineText.style.animation = ''; }
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

    var hintHtml = 'We\'ll run a <em style="color:var(--mm-teal);font-weight:600;font-style:italic;">complimentary benefits check</em> for you. Having your ID gets you results faster, but it\'s totally optional.';
    if (selectedInsuranceType === 'medicare') {
      insuranceIdQuestion.textContent = "Have your Medicare card handy?";
      insuranceIdHint.innerHTML = hintHtml;
      insuranceIdInput.placeholder = "1EG4-TE5-MK72";
    } else if (selectedInsuranceType === 'medicaid') {
      insuranceIdQuestion.textContent = "Have your Medicaid card handy?";
      insuranceIdHint.innerHTML = hintHtml;
      insuranceIdInput.placeholder = "Your Medicaid ID";
    } else if (selectedInsuranceType === 'private') {
      insuranceIdQuestion.textContent = "Have your insurance card handy?";
      insuranceIdHint.innerHTML = hintHtml;
      insuranceIdInput.placeholder = "Member ID";
    } else {
      insuranceIdQuestion.textContent = "Have your insurance card handy?";
      insuranceIdHint.innerHTML = hintHtml;
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

    // Skip benefits check entirely when user doesn't have card — go straight to doctor info
    if (cardNoBtn) {
      cardNoBtn.addEventListener('click', function(e) {
        e.preventDefault();
        goToStep(6);
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

      // Visual feedback — green flash for 150ms, then smooth transition
      optionBtn.style.borderColor = 'var(--mm-teal)';
      optionBtn.style.background = 'var(--mm-teal-light)';

      setTimeout(function() {
        optionBtn.style.borderColor = '';
        optionBtn.style.background = '';

        if (stepIdMap[nextStep]) {
          goToStep(nextStep);
        } else {
          goToStep(parseInt(nextStep));
        }
      }, 150);

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

  // ---- Reviews Carousel (auto-rotating + user control) ----
  var reviewsTrack = document.getElementById('reviewsTrack');
  var reviewsPrev = document.getElementById('reviewsPrev');
  var reviewsNext = document.getElementById('reviewsNext');

  if (reviewsTrack && reviewsPrev && reviewsNext) {
    var reviewCards = reviewsTrack.querySelectorAll('.g-review-card');
    var reviewIndex = 0;
    var reviewAutoTimer = null;
    var reviewPaused = false;
    var REVIEW_INTERVAL = 4000; // 4 seconds per card

    function scrollToReview(idx) {
      if (!reviewCards.length) return;
      reviewIndex = ((idx % reviewCards.length) + reviewCards.length) % reviewCards.length;
      // Use scrollLeft on the track instead of scrollIntoView to avoid
      // moving the main page viewport on mobile
      var card = reviewCards[reviewIndex];
      reviewsTrack.scrollTo({ left: card.offsetLeft - reviewsTrack.offsetLeft, behavior: 'smooth' });
    }

    function startReviewAuto() {
      stopReviewAuto();
      reviewAutoTimer = setInterval(function() {
        if (!reviewPaused) scrollToReview(reviewIndex + 1);
      }, REVIEW_INTERVAL);
    }

    function stopReviewAuto() {
      if (reviewAutoTimer) { clearInterval(reviewAutoTimer); reviewAutoTimer = null; }
    }

    // Manual controls — pause auto-rotation for 10s after interaction
    function onUserInteract(direction) {
      scrollToReview(reviewIndex + direction);
      reviewPaused = true;
      stopReviewAuto();
      setTimeout(function() { reviewPaused = false; startReviewAuto(); }, 10000);
    }

    reviewsNext.addEventListener('click', function() { onUserInteract(1); });
    reviewsPrev.addEventListener('click', function() { onUserInteract(-1); });

    // Pause on touch drag (mobile swipe)
    reviewsTrack.addEventListener('touchstart', function() {
      reviewPaused = true;
      stopReviewAuto();
    }, { passive: true });
    reviewsTrack.addEventListener('touchend', function() {
      setTimeout(function() { reviewPaused = false; startReviewAuto(); }, 10000);
    }, { passive: true });

    // Start auto-rotation when step 9 becomes visible
    // Delay carousel init so it doesn't interfere with scroll-to-top
    var step9Observer = new MutationObserver(function() {
      var step9 = document.getElementById('step9');
      if (step9 && step9.classList.contains('active')) {
        setTimeout(function() {
          reviewIndex = 0;
          reviewsTrack.scrollLeft = 0;  // instant reset, no scrollIntoView
          reviewPaused = false;
          startReviewAuto();
        }, 300);
      } else {
        stopReviewAuto();
      }
    });
    var step9El = document.getElementById('step9');
    if (step9El) {
      step9Observer.observe(step9El, { attributes: true, attributeFilter: ['class'] });
    }
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

  // ---- Dual-M Logo Rendering (shared geometry + functions) ----
  var dualM = (function() {
    var W = 512, H = 512;  // 512 internal for retina crispness

    // All coordinates scaled 2x from 256-space for 512 canvas
    // Back M (lighter teal, NARROWER + TALLER)
    var backM = [
      {x: 88,  y: 444}, {x: 88,  y: 48},
      {x: 256, y: 236}, {x: 424, y: 48}, {x: 424, y: 444}
    ];
    // Front M (darker teal, WIDER + SHORTER)
    var frontM = [
      {x: 24,  y: 444}, {x: 24,  y: 160},
      {x: 256, y: 352}, {x: 488, y: 160}, {x: 488, y: 444}
    ];

    var frontColor = '#80adaa';
    var backColor  = '#a9d1d0';
    var lineW = 40;       // 20 * 2
    var eraseW = lineW + 40;  // (20+20) * 2
    var eraseShiftY = 2;      // 1 * 2

    function dist(a, b) { var dx=b.x-a.x, dy=b.y-a.y; return Math.sqrt(dx*dx+dy*dy); }

    function buildPath(pts) {
      var segLens = [], totalLen = 0;
      for (var i = 1; i < pts.length; i++) { var d = dist(pts[i-1], pts[i]); segLens.push(d); totalLen += d; }
      var waypointDists = [0]; var acc = 0;
      for (var i = 0; i < segLens.length; i++) { acc += segLens[i]; waypointDists.push(acc); }
      return { pts: pts, totalLen: totalLen, waypointDists: waypointDists };
    }

    var backPathData  = buildPath(backM);
    var frontPathData = buildPath(frontM);

    function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2; }

    function configureCtx(ctx) {
      ctx.lineCap = 'butt'; ctx.lineJoin = 'miter'; ctx.miterLimit = 20; ctx.lineWidth = lineW;
    }

    function interpPoint(pts, wpDists, d) {
      for (var i = 0; i < wpDists.length - 1; i++) {
        if (d >= wpDists[i] && d <= wpDists[i+1]) {
          var segLen = wpDists[i+1] - wpDists[i];
          var f = segLen > 0 ? (d - wpDists[i]) / segLen : 0;
          return { x: pts[i].x + (pts[i+1].x - pts[i].x) * f, y: pts[i].y + (pts[i+1].y - pts[i].y) * f };
        }
      }
      return { x: pts[pts.length-1].x, y: pts[pts.length-1].y };
    }

    function drawStaticM(ctx, pts, color) {
      ctx.clearRect(0, 0, W, H); configureCtx(ctx);
      ctx.strokeStyle = color; ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }

    function drawPartialM(ctx, pathData, startFrac, endFrac, color) {
      ctx.clearRect(0, 0, W, H);
      if (endFrac <= startFrac + 0.005) return;
      configureCtx(ctx); ctx.strokeStyle = color; ctx.globalAlpha = 1;
      var totalLen = pathData.totalLen;
      var startDist = startFrac * totalLen, endDist = endFrac * totalLen;
      var pts = pathData.pts, wpDists = pathData.waypointDists;
      var subPoints = [interpPoint(pts, wpDists, startDist)];
      for (var i = 1; i < pts.length - 1; i++) {
        if (wpDists[i] > startDist && wpDists[i] < endDist) subPoints.push({x: pts[i].x, y: pts[i].y});
      }
      subPoints.push(interpPoint(pts, wpDists, endDist));
      if (subPoints.length >= 2) {
        ctx.beginPath(); ctx.moveTo(subPoints[0].x, subPoints[0].y);
        for (var i = 1; i < subPoints.length; i++) ctx.lineTo(subPoints[i].x, subPoints[i].y);
        ctx.stroke();
      }
    }

    function eraseFrontOverlap(ctx) {
      ctx.save(); ctx.globalCompositeOperation = 'destination-out';
      ctx.lineCap = 'butt'; ctx.lineJoin = 'miter'; ctx.miterLimit = 20;
      ctx.lineWidth = eraseW; ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.beginPath(); ctx.moveTo(frontM[0].x, frontM[0].y + eraseShiftY);
      for (var i = 1; i < frontM.length; i++) ctx.lineTo(frontM[i].x, frontM[i].y + eraseShiftY);
      ctx.stroke(); ctx.restore();
    }

    function drawGlowM(ctx, pts, color, t, blendIn) {
      ctx.clearRect(0, 0, W, H);
      var breathe = (Math.sin(t * Math.PI * 2 / 1200 - Math.PI/2) + 1) / 2;
      ctx.save(); configureCtx(ctx); ctx.strokeStyle = color;
      var glowIntensity = 0.06 + breathe * 0.10;
      var glowSize = 4 + breathe * 6;
      ctx.shadowColor = color; ctx.shadowBlur = glowSize * blendIn;
      ctx.globalAlpha = glowIntensity * blendIn;
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      ctx.shadowBlur = glowSize * 2 * blendIn; ctx.globalAlpha = glowIntensity * 0.5 * blendIn;
      ctx.stroke(); ctx.restore();
      configureCtx(ctx); ctx.strokeStyle = color; ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }

    // Draw the static dual-M (for welcome screen)
    function drawStatic(backCtx, frontCtx) {
      drawStaticM(backCtx, backM, backColor);
      eraseFrontOverlap(backCtx);
      drawStaticM(frontCtx, frontM, frontColor);
    }

    return {
      W: W, H: H, backM: backM, frontM: frontM,
      backPathData: backPathData, frontPathData: frontPathData,
      frontColor: frontColor, backColor: backColor,
      drawStaticM: drawStaticM, drawPartialM: drawPartialM,
      eraseFrontOverlap: eraseFrontOverlap, drawGlowM: drawGlowM,
      drawStatic: drawStatic, easeInOutCubic: easeInOutCubic
    };
  })();

  // ---- Welcome Screen: One-Time Draw Animation ----
  (function() {
    var bc = document.getElementById('welcomeBackCanvas');
    var fc = document.getElementById('welcomeFrontCanvas');
    if (!bc || !fc) return;
    var backCtx = bc.getContext('2d');
    var frontCtx = fc.getContext('2d');
    var W = dualM.W, H = dualM.H;

    var drawDur = 900, gapDur = 100;
    var phase = 0, phaseTime = 0, lastTime = 0;
    var animId;

    function animate(time) {
      if (!lastTime) lastTime = time;
      var dt = Math.min(time - lastTime, 50);
      lastTime = time;
      phaseTime += dt;

      switch (phase) {
        case 0: // Draw front (dark) M L→R
          var p = Math.min(phaseTime / drawDur, 1);
          var e = dualM.easeInOutCubic(p);
          backCtx.clearRect(0, 0, W, H);
          dualM.drawPartialM(frontCtx, dualM.frontPathData, 0, e, dualM.frontColor);
          if (p >= 1) { phase = 1; phaseTime = 0; }
          break;
        case 1: // Brief gap
          backCtx.clearRect(0, 0, W, H);
          dualM.drawStaticM(frontCtx, dualM.frontM, dualM.frontColor);
          if (phaseTime >= gapDur) { phase = 2; phaseTime = 0; }
          break;
        case 2: // Draw back (light) M L→R
          var p = Math.min(phaseTime / drawDur, 1);
          var e = dualM.easeInOutCubic(p);
          dualM.drawStaticM(frontCtx, dualM.frontM, dualM.frontColor);
          dualM.drawPartialM(backCtx, dualM.backPathData, 0, e, dualM.backColor);
          dualM.eraseFrontOverlap(backCtx);
          if (p >= 1) { phase = 3; } // done — hold static
          break;
        case 3: // Final static hold — stop animating
          dualM.drawStatic(backCtx, frontCtx);
          return; // don't request another frame
      }
      animId = requestAnimationFrame(animate);
    }
    // Delay start slightly so it plays after page transition
    setTimeout(function() { animId = requestAnimationFrame(animate); }, 300);
  })();

  // ---- Verify Screen: Animated Dual-M Snake ----
  var snakeAnim = null;

  function startSnakeAnimation() {
    var backCanvas  = document.getElementById('verifyBackCanvas');
    var frontCanvas = document.getElementById('verifyFrontCanvas');
    if (!backCanvas || !frontCanvas) return;
    var backCtx  = backCanvas.getContext('2d');
    var frontCtx = frontCanvas.getContext('2d');
    var W = dualM.W, H = dualM.H;

    var drawDur = 900, holdDur = 2000, gapDur = 100, pauseDur = 300;
    var phase = 0, phaseTime = 0, lastTime = 0;
    var running = true, forceM = false;

    function phaseDuration(p) {
      if (p === 3 || p === 11) return holdDur;
      if (p === 1 || p === 5 || p === 9 || p === 13) return gapDur;
      if (p === 7 || p === 15) return pauseDur;
      return drawDur;
    }

    function animate(time) {
      if (!running) return;
      if (!lastTime) lastTime = time;
      var dt = Math.min(time - lastTime, 50);
      lastTime = time;

      if (forceM) {
        dualM.drawStatic(backCtx, frontCtx);
        snakeAnim = requestAnimationFrame(animate);
        return;
      }

      phaseTime += dt;
      var dur = phaseDuration(phase);
      var progress = Math.min(phaseTime / dur, 1);
      var eased = dualM.easeInOutCubic(progress);
      var isReverse = phase >= 8;

      switch (phase) {
        case 0: case 8: // DRAW FRONT (dark M first)
          backCtx.clearRect(0, 0, W, H);
          if (!isReverse) dualM.drawPartialM(frontCtx, dualM.frontPathData, 0, eased, dualM.frontColor);
          else dualM.drawPartialM(frontCtx, dualM.frontPathData, 1 - eased, 1, dualM.frontColor);
          break;
        case 1: case 9: // GAP
          backCtx.clearRect(0, 0, W, H);
          dualM.drawStaticM(frontCtx, dualM.frontM, dualM.frontColor);
          break;
        case 2: case 10: // DRAW BACK (light M second)
          dualM.drawStaticM(frontCtx, dualM.frontM, dualM.frontColor);
          if (!isReverse) dualM.drawPartialM(backCtx, dualM.backPathData, 0, eased, dualM.backColor);
          else dualM.drawPartialM(backCtx, dualM.backPathData, 1 - eased, 1, dualM.backColor);
          dualM.eraseFrontOverlap(backCtx);
          break;
        case 3: case 11: // HOLD WITH GLOW
          var glowBlend = Math.min(phaseTime / 250, 1);
          dualM.drawGlowM(backCtx, dualM.backM, dualM.backColor, phaseTime, glowBlend);
          dualM.eraseFrontOverlap(backCtx);
          dualM.drawGlowM(frontCtx, dualM.frontM, dualM.frontColor, phaseTime, glowBlend);
          break;
        case 4: case 12: // UNDRAW BACK
          dualM.drawStaticM(frontCtx, dualM.frontM, dualM.frontColor);
          if (!isReverse) dualM.drawPartialM(backCtx, dualM.backPathData, eased, 1, dualM.backColor);
          else dualM.drawPartialM(backCtx, dualM.backPathData, 0, 1 - eased, dualM.backColor);
          dualM.eraseFrontOverlap(backCtx);
          break;
        case 5: case 13: // GAP
          backCtx.clearRect(0, 0, W, H);
          dualM.drawStaticM(frontCtx, dualM.frontM, dualM.frontColor);
          break;
        case 6: case 14: // UNDRAW FRONT
          backCtx.clearRect(0, 0, W, H);
          if (!isReverse) dualM.drawPartialM(frontCtx, dualM.frontPathData, eased, 1, dualM.frontColor);
          else dualM.drawPartialM(frontCtx, dualM.frontPathData, 0, 1 - eased, dualM.frontColor);
          break;
        case 7: case 15: // PAUSE
          backCtx.clearRect(0, 0, W, H); frontCtx.clearRect(0, 0, W, H);
          break;
      }

      if (progress >= 1) { phase = (phase + 1) % 16; phaseTime = 0; }
      snakeAnim = requestAnimationFrame(animate);
    }

    running = true; forceM = false;
    snakeAnim = requestAnimationFrame(animate);

    return {
      stop: function() { running = false; if (snakeAnim) cancelAnimationFrame(snakeAnim); },
      showM: function() { forceM = true; }
    };
  }

  // ---- Benefits Verification Loading Animation ----
  var verifyInterval = null;
  var verifyTimeout = null;

  var snakeCtrl = null;

  function startBenefitsVerification() {
    var progressBar = document.getElementById('verifyProgressBar');
    var statusText = document.getElementById('verifyStatusText');
    var slidesContainer = document.getElementById('verifySlides');
    var dotsContainer = document.getElementById('verifyDots');
    var verifyScreen = document.querySelector('.verify-screen');

    if (!progressBar || !slidesContainer) return;

    // Start snake M animation
    if (snakeCtrl) snakeCtrl.stop();
    snakeCtrl = startSnakeAnimation();

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

    // Lock snake animation into M shape
    if (snakeCtrl) snakeCtrl.showM();

    // Seamless transition to benefits summary after a moment
    setTimeout(function() {
      goToBenefitsSummary();

      // Clean up verify screen state for potential re-use
      if (snakeCtrl) { snakeCtrl.stop(); snakeCtrl = null; }
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

  // ---- CGM card touch animation support (mobile) ----
  // Triggers animation on tap, plays it briefly before the screen advances.
  // Uses pointerdown (works on touch + mouse) with scroll detection to avoid
  // triggering on scroll gestures.
  function setupCgmTouchAnimations() {
    var cards = document.querySelectorAll('.cgm-card[data-anim]');
    cards.forEach(function(card) {
      var startY = 0;
      card.addEventListener('pointerdown', function(e) {
        startY = e.clientY;
      }, { passive: true });
      card.addEventListener('pointerup', function(e) {
        // Only trigger if the finger didn't travel more than 10px (not a scroll)
        if (Math.abs(e.clientY - startY) < 10) {
          card.classList.add('touched');
          setTimeout(function() { card.classList.remove('touched'); }, 600);
        }
      }, { passive: true });
    });
  }

  // ---- Init ----
  function init() {
    updateProgress(0);
    updateBackButton();

    // Setup event listeners for dynamic steps
    setupInsuranceIdStep();
    setupDoctorForm();
    setupCgmTouchAnimations();
  }

  init();

})();
