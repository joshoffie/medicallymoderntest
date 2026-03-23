/**
 * Medically Modern Homepage
 * Accordion interactions
 */

(function() {
  'use strict';

  // Accordion functionality
  const accordionHeaders = document.querySelectorAll('.accordion-header');

  accordionHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const item = this.closest('.accordion-item');
      const isOpen = item.classList.contains('open');

      // Close all other items
      document.querySelectorAll('.accordion-item').forEach(el => {
        el.classList.remove('open');
      });

      // Toggle current item
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });

  // Mobile menu (if nav links should be hidden on mobile, already done in CSS)
  // This keeps the JS minimal and clean

})();
