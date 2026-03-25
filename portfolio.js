// Filter buttons
const filters  = document.querySelectorAll('.pf-filter');
const entries  = document.querySelectorAll('.pf-entry');
const labels   = document.querySelectorAll('.pf-studio-label');

// Scroll-based focus: entries closest to vertical center get full size/brightness
function updateFocus() {
  const mid = window.innerHeight / 2;
  document.querySelectorAll('.pf-entry:not(.hidden)').forEach(entry => {
    const rect = entry.getBoundingClientRect();
    const entryCenterY = rect.top + rect.height / 2;
    const dist = Math.abs(entryCenterY - mid);
    // t = 1 at center, 0 at 400px away
    const t = Math.max(0, 1 - dist / 400);

    const yearSpan = entry.querySelector('.pf-year span');
    const card = entry.querySelector('.pf-card');
    const desc = entry.querySelector('.pf-desc');

    if (yearSpan) {
      yearSpan.style.transform = `scale(${1 + 0.5 * t})`;
      yearSpan.style.color = `color-mix(in srgb, #ffffff ${Math.round(t * 100)}%, var(--text-dim))`;
    }
    if (desc) {
      desc.style.color = `color-mix(in srgb, #ffffff ${Math.round(t * 80)}%, var(--text-muted))`;
    }
    if (card) {
      const s = 1 + 0.1 * t;
      const alpha = (0.8 * t).toFixed(3);
      const glowAlpha = (0.2 * t).toFixed(3);
      card.style.transform = `scale(${s})`;
      card.style.borderColor = t > 0.05
        ? `rgba(120, 200, 255, ${alpha})`
        : '';
      card.style.boxShadow = t > 0.05
        ? `0 0 0 1px rgba(120,200,255,${glowAlpha}), 0 4px 24px rgba(120,200,255,${(0.1 * t).toFixed(3)})`
        : '';
    }
  });
}

window.addEventListener('scroll', updateFocus, { passive: true });
updateFocus();

filters.forEach(btn => {
  btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const f = btn.dataset.filter;

    entries.forEach(entry => {
      const show = f === 'all' || entry.dataset.studio === f;
      entry.classList.toggle('hidden', !show);
      if (!show) {
        const yearSpan = entry.querySelector('.pf-year span');
        const card = entry.querySelector('.pf-card');
        if (yearSpan) { yearSpan.style.transform = ''; yearSpan.style.color = ''; }
        const desc = entry.querySelector('.pf-desc');
        if (desc) { desc.style.color = ''; }
        if (card) { card.style.transform = ''; card.style.borderColor = ''; card.style.boxShadow = ''; }
      }
    });
    updateFocus();

    labels.forEach(label => {
      const show = f === 'all' || label.dataset.studio === f;
      label.classList.toggle('hidden', !show);
    });
  });
});

