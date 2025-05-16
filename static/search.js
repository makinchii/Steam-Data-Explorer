document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q')?.trim();
  if (!q) return;

  doSearch(q);
});

function doSearch(searchValue) {
  const results = document.getElementById('search-results');
  const errors  = document.getElementById('error-container');
  errors.innerHTML = '';
  results.innerHTML = '<div class="loading">Searching…</div>';

  const searchType = document.getElementById('search-type')?.value || 'default';

  const params = new URLSearchParams();
  params.append('q', searchValue);
  params.append('type', searchType);

  fetch(`/api/search_app?${params}`)
    .then(r => r.json())
    .then(data => {
      results.innerHTML = '';
      if (data.error) return showError(data.error);
      if (Array.isArray(data)) return displayResults(data);
      return displayResults([data]); // single-object fallback
    })
    .catch(e => showError(`Search error: ${e.message}`));
}

function displayResults(games) {
  const container = document.getElementById('search-results');
  if (games.length === 0) {
    container.innerHTML = '<div class="no-results">No results.</div>';
    return;
  }

  let html = `<div class="section-title">Search Results (${games.length})</div>`;

  games.forEach(game => {
    const headerImage     = game.header_image || '/api/placeholder/120/45';
    const altText         = game.header_image || (game.screenshots?.length ? game.screenshots[0].path_full : '/api/placeholder/120/45');
    const releaseDate     = game.release_date?.date || 'Unknown';
    const priceInfo       = game.price_overview || null;
    const discountPercent = priceInfo ? priceInfo.discount_percent : 0;
    const originalPrice   = priceInfo ? priceInfo.initial_formatted : '';
    const finalPrice      = priceInfo ? priceInfo.final_formatted : (game.is_free ? 'Free to Play' : 'Price unavailable');
    const categories      = game.categories || [];
    const genres          = game.genres || [];
    const steamAppId      = game.appid;
    const isFree          = game.is_free || false;
    const titleText   = game.name || 'Unknown Game';
    const screenshot  = game.screenshots?.[0]?.path_full || game.header_image;
    const shortDesc   = game.short_description || game.about_the_game || '';

    const tagsHtml = [
      ...categories.map(c => `<span class="steam-tag category-tag">${c.description}</span>`),
      ...genres    .map(g => `<span class="steam-tag genre-tag">${g.description}</span>`)
    ].join('');

    const priceHtml = [
      discountPercent > 0
        ? `<span class="discount">-${discountPercent}%</span>
           <span class="original-price">${originalPrice}</span>`
        : '',
      (!isFree && priceInfo)
        ? `<span class="final-price">${finalPrice}</span>`
        : '',
      (isFree)
        ? '<span class="final-price free">Free to Play</span>'
        : ''
    ].join(' ');

    html += `
      <div class="game-card"
            data-appid="${steamAppId}"
            data-name="${titleText}"
            data-screenshot="${screenshot}"
            data-desc="${shortDesc}">
        <div class="game-image">
          <img src="${headerImage}" alt="${altText}">
        </div>
        <div class="game-info">
          <div class="top-content">
            <div class="game-tags-container">
              ${tagsHtml}
            </div>
          </div>

          <div class="bottom-content">
            <div class="game-meta">
              <div class="release-date">
                Release Date: <span class="value">${releaseDate}</span>
              </div>
              <div class="price">
                ${priceHtml}
              </div>
            </div>

            <div class="game-actions">
              <a href="https://store.steampowered.com/app/${steamAppId}" target="_blank" class="visit-steam">
                 Open on Steam
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  attachTooltipListeners();
}

function attachTooltipListeners() {
  const tooltip = document.getElementById('tooltip');
  const offset  = 12;  // px from cursor
  let hoverTimer, enterEvent;

  document.querySelectorAll('.game-card').forEach(card => {
    const beginHover = (e) => {
      clearTimeout(hoverTimer);
      tooltip.style.display = 'none';
      enterEvent = e;
      hoverTimer = setTimeout(() => showTooltip(card, enterEvent), 1000);
    };

    card.addEventListener('mouseenter', beginHover);
    card.addEventListener('mousemove', beginHover);

    card.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
      tooltip.style.display = 'none';
    });
  });
}

function showTooltip(card, e) {
  const tooltip    = document.getElementById('tooltip');
  const title      = card.getAttribute('data-name');
  const screenshot = card.getAttribute('data-screenshot');
  const desc       = card.getAttribute('data-desc');

  tooltip.innerHTML = `
    <div class="tooltip-title">${title}</div>
    <img src="${screenshot}" class="tooltip-img" alt="${title}">
    <p class="tooltip-desc">${desc}</p>
  `;

  tooltip.style.position = 'fixed';
  tooltip.style.display  = 'flex';

  const { offsetWidth, offsetHeight } = tooltip;
  const offset = 12;

  let x = e.clientX + offset;
  let y = e.clientY - offsetHeight - offset;

  if (x + offsetWidth > window.innerWidth) {
    x = e.clientX - offsetWidth - offset;
  }

  if (y < offset) {
    y = e.clientY + offset;
  }

  tooltip.style.left = `${x}px`;
  tooltip.style.top  = `${y}px`;
}
