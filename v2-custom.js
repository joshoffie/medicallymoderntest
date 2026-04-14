(function(){
  'use strict';
  console.log('[MM V2] customJs loaded');

  // ============================================================
  // 1) FINAL PAGE BACK/SUBMIT BUTTON FIX
  //    - On final page, move the back button (form-pagebreak-back_37)
  //      into the submit button row so they render side-by-side,
  //      with Back on the left, Submit on the right.
  // ============================================================
  function fixFinalPageButtons() {
    var submitBtn = document.getElementById('input_54');
    if (!submitBtn) return;
    var submitWrapper = submitBtn.closest('.form-buttons-wrapper');
    if (!submitWrapper) return;
    var backBtn = document.getElementById('form-pagebreak-back_37');
    if (!backBtn) return;
    // If already moved, skip
    if (submitWrapper.querySelector('#form-pagebreak-back_37')) return;
    // Move back button into the submit wrapper (before submit)
    submitWrapper.insertBefore(backBtn, submitBtn);
    // Hide the now-empty pagebreak li
    var emptyPb = document.querySelector('li.form-input-wide > .form-pagebreak');
    if (emptyPb && !emptyPb.querySelector('button')) {
      emptyPb.closest('li').style.display = 'none';
    }
    // Ensure wrapper lays them out nicely
    submitWrapper.style.display = 'flex';
    submitWrapper.style.justifyContent = 'space-between';
    submitWrapper.style.alignItems = 'center';
    submitWrapper.style.gap = '12px';
    backBtn.style.display = 'inline-flex';
    backBtn.style.visibility = 'visible';
    backBtn.style.opacity = '1';
  }

  // ============================================================
  // 2) SKIP BUTTON -> AUTO-SUBMIT on member ID page (Q96)
  //    JotForm's native "Skip this step" on an optional field
  //    advances to the next page. On the member ID page there is
  //    no next page — we want it to click the Submit button.
  // ============================================================
  function hookSkipButton() {
    // JotForm skip buttons carry .jfSkipBtn-container or similar
    var skipBtns = document.querySelectorAll('.jfSkipBtn, [class*="SkipBtn"], button.jfSkipBtn, .jfSkipButton');
    skipBtns.forEach(function(btn){
      if (btn.__mmSkipHooked) return;
      // Only hook the skip on the member ID field (cid_96 or id_96)
      var li = btn.closest('li.form-line');
      if (!li) return;
      if (li.id !== 'id_96') return;
      btn.__mmSkipHooked = true;
      btn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        setTimeout(function(){
          var submit = document.getElementById('input_54');
          if (submit) submit.click();
        }, 50);
      }, true);
      console.log('[MM V2] skip hooked on', li.id);
    });
  }

  // ============================================================
  // 3) PRODUCT COMBO VALIDATION on Q38 (max 2; no Dexcom+Libre)
  //    Allowed combos:
  //      - Dexcom CGM (alone)
  //      - FreeStyle Libre CGM (alone)
  //      - Insulin pump/supplies (alone)
  //      - Dexcom CGM + Insulin pump/supplies
  //      - FreeStyle Libre CGM + Insulin pump/supplies
  //    Disallowed:
  //      - Dexcom CGM + FreeStyle Libre CGM
  //      - 3 selections
  // ============================================================
  function hookProductCheckboxes() {
    var productLi = document.getElementById('id_38');
    if (!productLi) return;
    var checkboxes = productLi.querySelectorAll('input[type="checkbox"]');
    if (!checkboxes.length) return;
    if (productLi.__mmProductHooked) return;
    productLi.__mmProductHooked = true;

    function labelForCheckbox(cb){
      var lbl = productLi.querySelector('label[for="'+cb.id+'"]');
      return lbl ? lbl.textContent.trim() : cb.value;
    }

    // Determine which one is which by their labels
    var mapped = [];
    checkboxes.forEach(function(cb){
      var label = labelForCheckbox(cb).toLowerCase();
      var type = 'other';
      if (label.includes('dexcom')) type = 'dexcom';
      else if (label.includes('libre')) type = 'libre';
      else if (label.includes('pump')) type = 'pump';
      mapped.push({cb: cb, type: type});
    });

    function showError(msg){
      var existing = document.getElementById('mm-product-error');
      if (!existing) {
        existing = document.createElement('div');
        existing.id = 'mm-product-error';
        existing.style.cssText = 'color:#c0392b; font-size:14px; margin-top:8px; padding:8px 12px; background:#fdecea; border-radius:6px; border:1px solid #f5c6cb;';
        productLi.querySelector('.form-input-wide, .form-input').appendChild(existing);
      }
      existing.textContent = msg;
      existing.style.display = 'block';
    }
    function clearError(){
      var existing = document.getElementById('mm-product-error');
      if (existing) existing.style.display = 'none';
    }

    function validate(e){
      var checked = mapped.filter(function(m){ return m.cb.checked; });
      var types = checked.map(function(m){ return m.type; });
      var hasDex = types.includes('dexcom');
      var hasLibre = types.includes('libre');
      var hasPump = types.includes('pump');

      // Rule: No Dexcom + Libre combo
      if (hasDex && hasLibre) {
        if (e && e.target) e.target.checked = false;
        showError('Please choose either Dexcom or Libre — not both. You can pair either CGM with an insulin pump.');
        return false;
      }
      // Rule: Max 2 selections
      if (checked.length > 2) {
        if (e && e.target) e.target.checked = false;
        showError('You can select up to 2 items. Valid combos: one CGM alone, pump alone, or one CGM + pump.');
        return false;
      }
      clearError();
      return true;
    }

    mapped.forEach(function(m){
      m.cb.addEventListener('click', validate, true);
      m.cb.addEventListener('change', validate, true);
    });
    console.log('[MM V2] product checkboxes hooked');
  }

  // ============================================================
  // 4) DOCTOR PAGE: require clinic OR phone (one of the two)
  // ============================================================
  function hookDoctorPage() {
    var nextBtns = document.querySelectorAll('.form-pagebreak-next');
    nextBtns.forEach(function(btn){
      if (btn.__mmDocHooked) return;
      // Only on the doctor page-break (we'll detect by checking the currently active page
      btn.__mmDocHooked = true;
      btn.addEventListener('click', function(e){
        // Identify doctor page by presence of doctor fields (Q43 Dr name)
        var activePage = document.querySelector('.form-section.page-section:not(.form-section-closed)');
        if (!activePage) return;
        // Check if this active page contains Q43 (doctor last name) — doctor section trigger
        if (!activePage.querySelector('#id_43')) return;
        // Clinic input and phone input — Q45 clinic, Q52 phone
        var clinic = document.querySelector('#id_45 input[type="text"], #id_45 input');
        var phoneParts = document.querySelectorAll('#id_52 input');
        var clinicVal = clinic && clinic.value && clinic.value.trim();
        var phoneVal = [...phoneParts].map(function(i){return i.value;}).join('').replace(/\D/g,'');
        if (!clinicVal && phoneVal.length < 10) {
          e.preventDefault();
          e.stopImmediatePropagation();
          var err = document.getElementById('mm-doctor-error');
          if (!err) {
            err = document.createElement('div');
            err.id = 'mm-doctor-error';
            err.style.cssText = 'color:#c0392b; font-size:14px; margin-top:8px; padding:8px 12px; background:#fdecea; border-radius:6px; border:1px solid #f5c6cb;';
            activePage.appendChild(err);
          }
          err.textContent = 'Please enter either the clinic name or the doctor\u2019s phone number.';
          err.style.display = 'block';
        }
      }, true);
    });
  }

  // Re-run hooks periodically to catch page navigation / dynamic rerenders
  function tick() {
    try { fixFinalPageButtons(); } catch(e) {}
    try { hookSkipButton(); } catch(e) {}
    try { hookProductCheckboxes(); } catch(e) {}
    try { hookDoctorPage(); } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tick);
  } else {
    tick();
  }
  setInterval(tick, 800);
})();
