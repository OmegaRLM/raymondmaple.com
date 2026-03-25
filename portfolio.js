// Filter buttons
const filters  = document.querySelectorAll('.pf-filter');
const entries  = document.querySelectorAll('.pf-entry');
const labels   = document.querySelectorAll('.pf-studio-label');

filters.forEach(btn => {
  btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const f = btn.dataset.filter;

    entries.forEach(entry => {
      const show = f === 'all' || entry.dataset.studio === f;
      entry.classList.toggle('hidden', !show);
    });

    labels.forEach(label => {
      const show = f === 'all' || label.dataset.studio === f;
      label.classList.toggle('hidden', !show);
    });
  });
});

