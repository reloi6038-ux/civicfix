/**
 * CivicFix — Homepage Logic (v3.2)
 * Handles: Scroll progress, cursor glow, scroll reveal, typing effect,
 * magnetic buttons, counter animations, and live API data.
 */

(function () {
  // ============================================================
  // 1. SCROLL PROGRESS BAR
  // ============================================================
  const bar = document.getElementById('scroll-progress');
  if (bar) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = `${pct}%`;
    }, { passive: true });
  }

  // ============================================================
  // 2. CUSTOM CURSOR GLOW
  // ============================================================
  const glow = document.getElementById('cursor-glow');
  if (glow && window.innerWidth > 768) {
    let mouseX = 0, mouseY = 0;
    let currentX = 0, currentY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    (function animateGlow() {
      currentX += (mouseX - currentX) * 0.12;
      currentY += (mouseY - currentY) * 0.12;
      glow.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateGlow);
    })();
  }

  // ============================================================
  // 3. SCROLL REVEAL (with fallback)
  // ============================================================
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    reveals.forEach((el) => observer.observe(el));

    // Fallback: force visibility after 1s
    setTimeout(() => {
      reveals.forEach((el) => {
        if (!el.classList.contains('visible')) {
          el.classList.add('visible');
        }
      });
    }, 1000);
  }

  // ============================================================
  // 4. TYPING EFFECT — Types full sentence from empty space
  // ============================================================
  const typedEl = document.getElementById('typed-word');
  if (typedEl) {
    const fullSentence = "Fix your community";
    let charIndex = 0;
    let isDeleting = false;

    // Ensure it starts empty
    typedEl.textContent = '';

    function type() {
      if (!isDeleting) {
        // Typing forward
        typedEl.textContent = fullSentence.substring(0, charIndex + 1);
        charIndex++;

        if (charIndex === fullSentence.length) {
          // Finished typing — pause, then delete
          isDeleting = true;
          setTimeout(type, 2500);
          return;
        }
        setTimeout(type, 100);
      } else {
        // Deleting
        typedEl.textContent = fullSentence.substring(0, charIndex - 1);
        charIndex--;

        if (charIndex === 0) {
          // Finished deleting — pause, then retype
          isDeleting = false;
          setTimeout(type, 500);
          return;
        }
        setTimeout(type, 40);
      }
    }

    type();
  }

  // ============================================================
  // 5. MAGNETIC BUTTONS
  // ============================================================
  document.querySelectorAll('.btn-premium').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15 - 4}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  // ============================================================
  // 6. COUNTER ANIMATION
  // ============================================================
  function animateCounter(element, target, duration = 2000) {
    if (!element) return;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.floor(target * eased);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        element.textContent = target;
      }
    }
    requestAnimationFrame(tick);
  }

  // ============================================================
  // 7. FOOTER YEAR
  // ============================================================
  const footerYear = document.getElementById('footer-year');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  // ============================================================
  // 8. LIVE API DATA
  // ============================================================
  (async function loadHomeData() {
    const heroStatsEl = document.getElementById('hero-stats');

    try {
      const res = await api.dashboard.stats();
      const { stats, recentReports, popularCategories } = res.data;

      // --- HERO STATS ---
      if (heroStatsEl) {
        const heroStats = [
          { value: stats.total, label: 'Total Reports' },
          { value: stats.inProgress, label: 'In Progress' },
          { value: stats.resolved, label: 'Resolved' },
          { value: new Set(recentReports.map((r) => r.city)).size + popularCategories.length, label: 'Communities' }
        ];

        heroStatsEl.innerHTML = heroStats.map((s) => `
          <div class="hero-stat">
            <div class="hero-stat-value" data-target="${s.value}">0</div>
            <div class="hero-stat-label">${s.label}</div>
          </div>
        `).join('');

        const heroObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              heroStatsEl.querySelectorAll('.hero-stat-value').forEach((el) => {
                animateCounter(el, Number(el.dataset.target) || 0);
              });
              heroObserver.disconnect();
            }
          });
        }, { threshold: 0.3 });

        heroObserver.observe(heroStatsEl);
      }

      // --- PREVIEW STATS ---
      const totalIssues = stats.total || 0;
      const resolutionRate = totalIssues > 0 ? Math.round((stats.resolved / totalIssues) * 100) : 0;

      const previewTotal = document.getElementById('preview-total');
      const previewProgress = document.getElementById('preview-progress');
      const previewResolved = document.getElementById('preview-resolved');
      const previewRate = document.getElementById('preview-rate');

      if (previewTotal) previewTotal.textContent = totalIssues;
      if (previewProgress) previewProgress.textContent = stats.inProgress;
      if (previewResolved) previewResolved.textContent = stats.resolved;
      if (previewRate) previewRate.textContent = `${resolutionRate}%`;

    } catch (err) {
      if (heroStatsEl) {
        heroStatsEl.innerHTML = `
          <div class="hero-stat"><div class="hero-stat-value">🏛️</div><div class="hero-stat-label">Civic Platform</div></div>
          <div class="hero-stat"><div class="hero-stat-value">🚀</div><div class="hero-stat-label">Fast Reporting</div></div>
          <div class="hero-stat"><div class="hero-stat-value">🛡️</div><div class="hero-stat-label">Verified</div></div>
          <div class="hero-stat"><div class="hero-stat-value">📊</div><div class="hero-stat-label">Transparent</div></div>
        `;
      }
      console.warn("Homepage API error:", err);
    }
  })();
})();