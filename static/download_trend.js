function formatEta(seconds) {
  let sec = seconds;
  const days   = Math.floor(sec / 86400);
  sec %= 86400;
  const hours  = Math.floor(sec / 3600);
  sec %= 3600;
  const mins   = Math.floor(sec / 60);
  sec %= 60;

  const parts = [];
  if (days)  parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (mins)  parts.push(`${mins}m`);
             parts.push(`${sec}s`);
  return parts.join(' ');
}

document.addEventListener('DOMContentLoaded', () => {
  const bar       = document.getElementById('progress-bar');
  const eta       = document.getElementById('eta-text');
  const toggleBtn = document.getElementById('toggle-btn');
  const barText   = document.getElementById('bar-text');

  let sleepingUntil = null;
  let sleepTimer    = null;
  let paused        = false;
  let currentTotal  = 0;
  let currentDone   = 0;

  const SEC_PER_ITEM = 300 / 200;

  function startDownload() {
    fetch('/api/download_trend_data', { method: 'POST' })
      .catch(err => { eta.innerText = err.message; });
  }

  function stopDownload() {
    fetch('/api/stop_trend_download', { method: 'POST' })
      .then(r => r.json())
      .then(json => {

        const text = eta.innerText.split('—')[0].trim();
        eta.innerText = `${text} — paused`;
      })
      .catch(console.error);
  }

  toggleBtn.addEventListener('click', () => {
    if (!paused) {
      stopDownload();
      toggleBtn.textContent = 'Resume';
    } else {
      startDownload();
      toggleBtn.textContent = 'Pause';
    }
    paused = !paused;
  });

  function poll() {
    fetch('/api/download_trend_progress')
      .then(r => r.json())
      .then(handleProgress)
      .catch(console.error);
  }

  function handleProgress({ total, done, status }) {
    currentTotal = total;
    currentDone  = done;

    bar.max   = total;
    bar.value = done;
    barText.innerText = `${done} / ${total}`;

    const remItems = total - done;
    const etaSecs = Math.ceil(remItems * SEC_PER_ITEM);
    const etaStr  = formatEta(etaSecs);
    const etaBase  = `Time to Finish: ${etaStr}`;

    const m = status.match(/(\d+)\s*sec/i);
    if (m) {
      const secsLeft = parseInt(m[1], 10);
      sleepingUntil  = Date.now() + secsLeft * 1000;
      if (sleepTimer) clearTimeout(sleepTimer);
      return showSleepCountdown(etaBase);
    }

    eta.innerText = `${etaBase} — ${status}`;

    if (status !== 'completed') {
      setTimeout(poll, 1000);
    }
  }

  function showSleepCountdown() {

    bar.max   = currentTotal;
    bar.value = currentDone;

    const remItems = currentTotal - currentDone;
    const etaSecs  = Math.ceil(remItems * SEC_PER_ITEM);
    const etaStr   = formatEta(etaSecs);

    const diff = sleepingUntil - Date.now();
    if (diff > 0) {
      const secLeft = Math.ceil(diff / 1000);
      eta.innerText = `Time to Finish: ${etaStr} — paused, ${secLeft}s`;
      sleepTimer = setTimeout(showSleepCountdown, 1000);
    } else {
      sleepingUntil = null;
      poll();
    }
  }

  startDownload();
  poll();
});
