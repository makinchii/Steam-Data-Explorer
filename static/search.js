let currentSearchResults = [];
let currentSearchQuery   = '';
let currentSearchType    = '';
let currentPage          = 1;
const pageSize           = 100;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const q      = params.get('q')?.trim();
  if (!q) return;

  currentSearchQuery = q;
  currentSearchType  = params.get('type') || 'default';
  currentPage        = parseInt(params.get('page')) || 1;

  const typeField = document.getElementById('search-type');
  if (typeField) typeField.value = currentSearchType;

  fetchResults();
});

function fetchResults() {
  const results = document.getElementById('search-results');
  const errors  = document.getElementById('error-container');
  errors.innerHTML = '';
  results.innerHTML = '<div class="loading">Searching…</div>';

  const params = new URLSearchParams();
  params.append('q',    currentSearchQuery);
  params.append('type', currentSearchType);

  fetch(`/api/search_app?${params}`)
    .then(r => r.json())
    .then(data => {
      results.innerHTML = '';
      if (data.error) return showError(data.error);

      currentSearchResults = Array.isArray(data) ? data : [data];
      renderPage();
    })
    .catch(e => showError(`Search error: ${e.message}`));
}

function renderPage() {
  const start = (currentPage - 1) * pageSize;
  const end   = start + pageSize;
  const pageItems = currentSearchResults.slice(start, end);

  displayResults(pageItems);
  renderPaginationControls();
}

function renderPaginationControls() {
  ['pagination-top', 'pagination'].forEach(id => {
    const container = document.getElementById(id);
    if (!container) return;

    container.innerHTML = '';
    const total      = currentSearchResults.length;
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return;

    // Prev
    const prev = document.createElement('button');
    prev.textContent = '‹ Prev';
    prev.disabled    = currentPage === 1;
    prev.addEventListener('click', () => {
      currentPage--;
      updateURL();
      renderPage();
    });
    container.appendChild(prev);

    // Info
    const info = document.createElement('span');
    info.textContent = ` Page ${currentPage} of ${totalPages} (${total} results) `;
    container.appendChild(info);

    // Next
    const next = document.createElement('button');
    next.textContent = 'Next ›';
    next.disabled    = currentPage === totalPages;
    next.addEventListener('click', () => {
      currentPage++;
      updateURL();
      renderPage();
    });
    container.appendChild(next);
  });
}

function updateURL() {
  const params = new URLSearchParams({
    q:    currentSearchQuery,
    type: currentSearchType
  });
  if (currentPage > 1) params.set('page', currentPage);
  window.history.replaceState({}, '', `?${params.toString()}`);
}

function displayResults(games) {
  const container = document.getElementById('search-results');
  if (games.length === 0) {
    container.innerHTML = '<div class="no-results">No results.</div>';
    return;
  }

  let html = `<div class="section-title">
                Search Results (${currentSearchResults.length}) 
                – Showing ${Math.min((currentPage-1)*pageSize+1, currentSearchResults.length)} 
                to ${Math.min(currentPage*pageSize, currentSearchResults.length)}
              </div>`;

  games.forEach(game => {
    const headerImage     = game.header_image || '/api/placeholder/120/45';
    const altText         = headerImage;
    const releaseDate     = game.release_date?.date || 'Unknown';
    const priceInfo       = game.price_overview || null;
    const discountPercent = priceInfo ? priceInfo.discount_percent : 0;
    const originalPrice   = priceInfo ? priceInfo.initial_formatted : '';
    const finalPrice      = priceInfo ? priceInfo.final_formatted : (game.is_free ? 'Free to Play' : 'Price unavailable');
    const categories      = game.categories || [];
    const genres          = game.genres || [];
    const steamAppId      = game.steam_appid;
    const isFree          = game.is_free || false;
    const titleText       = game.name || 'Unknown Game';
    const screenshot      = game.screenshots?.[0]?.path_full || game.header_image;
    const shortDesc       = game.short_description || game.about_the_game || '';

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
              <a href="https://store.steampowered.com/app/${steamAppId}"
                 target="_blank"
                 class="visit-steam">
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
  attachTagClickListeners();
}

function attachTooltipListeners() {
  const tooltip = document.getElementById('tooltip');
  const offset  = 12;
  let hoverTimer, enterEvent;

  document.querySelectorAll('.game-card').forEach(card => {
    const beginHover = e => {
      clearTimeout(hoverTimer);
      tooltip.style.display = 'none';
      enterEvent = e;
      hoverTimer = setTimeout(() => showTooltip(card, enterEvent), 1000);
    };

    card.addEventListener('mouseenter', beginHover);
    card.addEventListener('mousemove',  beginHover);
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
  let y = e.clientY - offsetHeight / 2;

  if (x + offsetWidth > window.innerWidth) {
    x = e.clientX - offsetWidth - offset;
  }
  if (y < 0) {
    y = 0;
  } else if (y + offsetHeight > window.innerHeight) {
    y = window.innerHeight - offsetHeight;
  }

  tooltip.style.left = `${x}px`;
  tooltip.style.top  = `${y}px`;
}

function attachTagClickListeners() {
  document.querySelectorAll('.steam-tag').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      const term = el.textContent.trim();
      const type = el.classList.contains('genre-tag') ? 'genre' : 'tag';
      const params = new URLSearchParams({ q: term, type });
      window.location.href = `/search?${params.toString()}`;
    });
  });
}

function showError(msg) {
  const errors = document.getElementById('error-container');
  errors.innerHTML = `<div class="error">${msg}</div>`;
}
