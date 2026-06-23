/* ============================================================
 * Lab 10 — viz.js (Attacking MCP)
 *
 * No interactive widgets in v1 — the lab is heavy on real attack
 * scripts and code walkthroughs. Glossary is the only thing wired up.
 * ============================================================ */

(function () {
  'use strict';

  // Glossary stub — match the lab-09 pattern (browser tooltips for now).
  const terms = document.querySelectorAll('.gloss[data-gloss]');
  terms.forEach(t => {
    t.style.cursor = 'help';
    t.style.borderBottom = '1px dotted var(--ink-mute)';
  });
})();
