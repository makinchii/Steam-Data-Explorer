
document.addEventListener('DOMContentLoaded', () => {
  // Set search mode based on URL query
  const params     = new URLSearchParams(window.location.search);
  const searchType = params.get('type') || 'name';

  const typeMap = {
    'app-id'   : 'Search by App ID',
    'name'     : 'Search by Name',
    'developer': 'Search by Developer',
    'genre'    : 'Search by Genre',
    'tag'      : 'Search by Tag'
  };

  updateSearchMode(searchType, typeMap[searchType] || 'Search');

  // Dropdown menu handlers
  document.querySelectorAll('.dropdown-menu a[data-action]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      handleMenuAction(item.getAttribute('data-action'));
    });
  });

  attachTooltipListeners();
});

document.addEventListener('click', e => {
  if (e.target.closest('a.visit-steam')) {
    return;
  }

  const card = e.target.closest('.game-card');
  if (!card) return;

  const appid = card.getAttribute('data-appid');
  if (appid) {
    window.open(`https://store.steampowered.com/app/${appid}`, '_blank');
  }
});

document.addEventListener('mouseover', e => {
  const card = e.target.closest('.game-card');
  if (card && card.getAttribute('data-appid')) {
    card.style.cursor = 'pointer';
  }
});


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
  let y = e.clientY - (offsetHeight / 2);

  if (x + offsetWidth > window.innerWidth)  {
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


function updateSearchMode(mode, placeholderText) {
  const searchInput = document.getElementById('app-search');
  const searchType  = document.getElementById('search-type');

  if (searchInput && searchType) {
    searchInput.placeholder = placeholderText;
    searchType.value        = mode;
  } else {
    console.warn('Search input or hidden search-type field not found.');
  }
}

function handleMenuAction(action) {
  const errorContainer = document.getElementById('error-container');
  if (errorContainer) errorContainer.innerHTML = '';

  switch (action) {
    case 'price-analysis':
      window.location.href = '/analytics/price-analysis';
      break;
    case 'genre-breakdown':
      window.location.href = '/analytics/genre-breakdown';
      break;
    case 'tag-analysis':
      window.location.href = '/analytics/tag-analysis';
      break;
    case 'by-name':
      updateSearchMode('name', 'Search by Name');
      break;
    case 'by-id':
      updateSearchMode('app-id', 'Search by App ID');
      break;
    case 'by-developer':
      updateSearchMode('developer', 'Search by Developer');
      break;
    case 'by-genre':
      updateSearchMode('genre', 'Search by Genre');
      break;
    case 'by-tag':
      updateSearchMode('tag', 'Search by Tag');
      break;
    case 'game-data':
      window.location.href = '/download_app';
      break;
    case 'trending-data':
      window.location.href = '/download_trend';
      break;
    default:
      console.warn(`Unhandled menu action: ${action}`);
  }
}
