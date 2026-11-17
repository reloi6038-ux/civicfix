(async function () {
  if (requireAdmin()) return;

  const kpiEl = document.getElementById('kpi');

  try {
    const res = await adminApi.analytics();
    const { byCategory, byStatus, byCity, byMonth, avgResolutionHours, resolutionRate } = res.data;

    // KPI cards
    kpiEl.innerHTML = `
      <div class="stat-card"><div class="stat-label">Resolution Rate</div><div class="stat-value success">${resolutionRate}%</div></div>
      <div class="stat-card"><div class="stat-label">Avg Resolution</div><div class="stat-value primary">${avgResolutionHours ?? '—'} ${avgResolutionHours ? 'hrs' : ''}</div></div>
      <div class="stat-card"><div class="stat-label">Total Categories</div><div class="stat-value">${byCategory.length}</div></div>
      <div class="stat-card"><div class="stat-label">Cities Affected</div><div class="stat-value">${byCity.length}</div></div>
    `;

    // Category bar
    new Chart(document.getElementById('chart-cat'), {
      type: 'bar',
      data: {
        labels: byCategory.map((c) => c.name),
        datasets: [{ label: 'Reports', data: byCategory.map((c) => c.count), backgroundColor: '#1a56db' }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });

    // Status doughnut
    new Chart(document.getElementById('chart-status'), {
      type: 'doughnut',
      data: {
        labels: byStatus.map((s) => s.status),
        datasets: [{
          data: byStatus.map((s) => s.count),
          backgroundColor: ['#3b82f6', '#f59e0b', '#6366f1', '#f97316', '#10b981', '#ef4444', '#6b7280']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });

    // Time series
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    new Chart(document.getElementById('chart-time'), {
      type: 'line',
      data: {
        labels: byMonth.map((m) => `${months[m.month - 1]} ${m.year}`),
        datasets: [{
          label: 'Reports',
          data: byMonth.map((m) => m.count),
          borderColor: '#1a56db',
          backgroundColor: 'rgba(26,86,219,0.1)',
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });

    // Top cities
    new Chart(document.getElementById('chart-city'), {
      type: 'bar',
      data: {
        labels: byCity.map((c) => `${c.city}${c.state ? ', ' + c.state : ''}`),
        datasets: [{ label: 'Reports', data: byCity.map((c) => c.count), backgroundColor: '#0e7490' }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });

    document.getElementById('resolution-info').innerHTML = `
      <div class="detail-grid">
        <div>
          <p><strong>Resolution rate:</strong> ${resolutionRate}%</p>
          <p><strong>Average time to resolve:</strong> ${avgResolutionHours ? `${avgResolutionHours} hours (${(avgResolutionHours / 24).toFixed(1)} days)` : 'No resolved issues yet'}</p>
        </div>
        <div>
          <p class="text-sm text-muted">Reports are counted from submission to resolution. Only issues that reach the "RESOLVED" status are used in resolution metrics.</p>
        </div>
      </div>`;
  } catch (err) {
    showError(kpiEl, err.message);
  }
})();