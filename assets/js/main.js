// ============================================
// MEDICALLY MODERN — HOMEPAGE JS
// ============================================

(function() {
  'use strict';

  // ---- Animated Hero Text (cycles like original site) ----
  var phrases = ['Continuous Glucose Monitors', 'Insulin Pumps'];
  var colors = ['#80adaa', '#a9d1d0'];
  var currentIndex = 0;
  var animatedEl = document.getElementById('animatedText');

  function cycleText() {
    if (!animatedEl) return;
    animatedEl.style.opacity = '0';
    setTimeout(function() {
      currentIndex = (currentIndex + 1) % phrases.length;
      animatedEl.textContent = phrases[currentIndex];
      animatedEl.style.color = colors[currentIndex];
      animatedEl.style.opacity = '1';
    }, 400);
  }

  if (animatedEl) {
    animatedEl.style.color = colors[0];
    setInterval(cycleText, 2500);
  }

  // ---- Mobile Menu Toggle ----
  var menuToggle = document.querySelector('.mobile-menu-toggle');
  var nav = document.querySelector('.nav');

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function() {
      nav.classList.toggle('nav-open');
      var isOpen = nav.classList.contains('nav-open');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });
  }

})();
