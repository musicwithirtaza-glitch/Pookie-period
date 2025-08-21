(function(){
  const $ = (s) => document.querySelector(s);
  const form = $('#trackerForm');
  const summary = $('#summary');
  const result = $('#result');
  const monthsEl = $('#multiMonths');
  const resetBtn = $('#resetBtn');
  const themeToggle = $('#themeToggle');

  // --- Theme ---
  const THEME_KEY = 'pookie_theme';
  const savedTheme = localStorage.getItem(THEME_KEY);
  if(savedTheme){ document.documentElement.setAttribute('data-theme', savedTheme); }
  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
  });

  // --- Load saved data ---
  const STORAGE_KEY = 'trackerData_v2';
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  if(saved){
    $('#startDate').value = saved.startDate || '';
    $('#cycleLength').value = saved.cycleLength ?? 28;
    $('#periodLength').value = saved.periodLength ?? 5;
    $('#notes').value = saved.notes || '';
    if(saved.startDate) { computeAndRender(); }
  }

  // --- Reset ---
  resetBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    form.reset();
    result.hidden = true;
  });

  // --- Helpers ---
  function addDays(date, days){
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }
  function format(d){
    return d.toLocaleDateString(undefined, { weekday:'short', year:'numeric', month:'short', day:'numeric' });
  }
  function clamp(val, min, max){ return Math.max(min, Math.min(max, val)); }

  function computePrediction(startDate, cycleLen, periodLen){
    // Next period = start + cycleLen
    const nextPeriod = addDays(startDate, cycleLen);
    // Ovulation is ~14 days before next period
    const ovulation = addDays(nextPeriod, -14);
    // Fertile window = ovulation -5 days to ovulation (inclusive)
    const fertileStart = addDays(ovulation, -5);
    const fertileEnd = ovulation; // inclusive

    const periodEnd = addDays(startDate, periodLen - 1);

    return { nextPeriod, ovulation, fertileStart, fertileEnd, periodEnd };
  }

  function renderSummary(pred, notes){
    summary.innerHTML = [
      ['🩸 Next period', format(pred.nextPeriod)],
      ['📆 Current period window', `${format(new Date($('#startDate').value))} – ${format(pred.periodEnd)}`],
      ['🌱 Fertile window', `${format(pred.fertileStart)} – ${format(pred.fertileEnd)}`],
      ['💡 Ovulation day', format(pred.ovulation)]
    ].map(([label, value]) => `<div class="item"><strong>${label}:</strong> ${value}</div>`).join('')
    + (notes ? `<div class="item"><strong>📝 Notes:</strong> ${notes.replace(/</g,'&lt;')}</div>` : '');
  }

  function renderMonths(startDate, cycleLen, periodLen){
    monthsEl.innerHTML = '';
    // Show next 6 predicted cycles
    let anchor = new Date(startDate);
    for(let i=1;i<=6;i++){
      const thisStart = addDays(anchor, cycleLen);
      const pred = computePrediction(thisStart, cycleLen, periodLen);
      const title = thisStart.toLocaleDateString(undefined, { month:'long', year:'numeric' });
      const html = `
        <div class="month">
          <h4>${title}</h4>
          <div class="meta">Cycle #${i}</div>
          <div>🩸 Period: <strong>${format(thisStart)}</strong> → ${format(addDays(thisStart, periodLen-1))}</div>
          <div>💡 Ovulation: <strong>${format(pred.ovulation)}</strong></div>
          <div>🌱 Fertile: ${format(pred.fertileStart)} – ${format(pred.fertileEnd)}</div>
        </div>
      `;
      monthsEl.insertAdjacentHTML('beforeend', html);
      anchor = thisStart;
    }
  }

  function computeAndRender(){
    const startDateInput = $('#startDate').value;
    const cycleLength = clamp(parseInt($('#cycleLength').value,10), 20, 40);
    const periodLength = clamp(parseInt($('#periodLength').value,10), 2, 10);
    const notes = $('#notes').value.trim();

    const startDate = new Date(startDateInput);
    if(!(startDate instanceof Date) || isNaN(startDate.getTime())){
      alert('Please select a valid start date.');
      return;
    }

    const pred = computePrediction(startDate, cycleLength, periodLength);

    localStorage.setItem('trackerData_v2', JSON.stringify({
      startDate: startDateInput,
      cycleLength,
      periodLength,
      notes
    }));

    renderSummary(pred, notes);
    renderMonths(startDate, cycleLength, periodLength);
    result.hidden = false;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    computeAndRender();
  });
})();