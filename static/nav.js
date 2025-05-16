document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.dropdown-menu a[data-action]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const action = item.getAttribute('data-action');
      handleMenuAction(action);
    });
  });
});

function handleMenuAction(action) {

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
        default:
            break;
    }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.dropdown-menu a[data-action]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const action = item.getAttribute('data-action');
      handleMenuAction(action);
    });
  });

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
