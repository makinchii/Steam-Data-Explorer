document.addEventListener('DOMContentLoaded', () => {
  // 🆕 Set search mode based on URL query
  const params = new URLSearchParams(window.location.search);
  const searchType = params.get('type') || 'name';

  const typeMap = {
    'app-id': 'Search by App ID',
    'name': 'Search by Name',
    'developer': 'Search by Developer',
    'genre': 'Search by Genre',
    'tag': 'Search by Tag'
  };

  updateSearchMode(searchType, typeMap[searchType] || 'Search');

  // 🧭 Setup dropdown click handlers
  document.querySelectorAll('.dropdown-menu a[data-action]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const action = item.getAttribute('data-action');
      handleMenuAction(action);
    });
  });

  // 🕹️ Setup game card click behavior
  document.querySelectorAll('.game-card').forEach(card => {
    const appid = card.getAttribute('data-appid');
    if (appid) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        window.open(`https://store.steampowered.com/app/${appid}`, '_blank');
      });
    }
  });
});

function updateSearchMode(mode, placeholderText) {
  const searchInput = document.getElementById('app-search');
  const searchType = document.getElementById('search-type');

  if (searchInput && searchType) {
    searchInput.placeholder = placeholderText;
    searchType.value = mode;
  } else {
    console.warn('Search input or hidden search-type field not found.');
  }
}

function handleMenuAction(action) {

  console.log("Selected action:", action);

  const errorContainer = document.getElementById('error-container');
  if (errorContainer) {
    errorContainer.innerHTML = '';
  }

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
    default:
      break;
  }
}
