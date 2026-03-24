// ===== Background grid =====
const gridBg = document.getElementById('grid-bg');
const COLS = 16;

function buildGrid() {
  const cellW = window.innerWidth / COLS;
  const rows  = Math.round(window.innerHeight / cellW);

  gridBg.innerHTML = '';
  gridBg.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
  gridBg.style.gridTemplateRows    = `repeat(${rows}, 1fr)`;

  for (let i = 0, total = COLS * rows; i < total; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';

    cell.addEventListener('mouseenter', () => {
      cell.classList.remove('fading');
    });

    cell.addEventListener('mouseleave', () => {
      cell.classList.add('fading');
      cell.addEventListener('transitionend', () => cell.classList.remove('fading'), { once: true });
    });

    gridBg.appendChild(cell);
  }
}

buildGrid();

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(buildGrid, 120);
});

// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');

toggle?.addEventListener('click', () => {
  links.classList.toggle('open');
});

// Close mobile nav when a link is clicked
links?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => links.classList.remove('open'));
});

// Highlight active nav link on scroll
const sections = document.querySelectorAll('section[id], header[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(a => a.style.color = '');
      const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (active) active.style.color = 'var(--text)';
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => observer.observe(s));
