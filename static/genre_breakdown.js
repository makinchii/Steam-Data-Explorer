function drawDualGenreCharts(topGenres, otherGenres) {
  const ctxTop = document.getElementById('topGenresChart').getContext('2d');
  const ctxOther = document.getElementById('otherGenresChart').getContext('2d');
  const ctxPie = document.getElementById('genrePieChart').getContext('2d');

  document.getElementById('topGenresChart').height = 600;
  document.getElementById('otherGenresChart').height = 600;
  document.getElementById('genrePieChart').height = 500;

  new Chart(ctxTop, {
    type: 'bar',
    data: {
      labels: topGenres.map(([genre]) => genre),
      datasets: [{
        label: 'Top 10 Genres',
        data: topGenres.map(([, count]) => count),
        backgroundColor: 'rgba(102, 192, 244, 0.8)',
        borderColor: 'rgba(102, 192, 244, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            autoSkip: false,
            maxRotation: 60,
            minRotation: 30,
            font: { size: 13 }
          },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: { font: { size: 13 } }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { size: 14 } }
        }
      }
    }
  });

  new Chart(ctxOther, {
    type: 'bar',
    data: {
      labels: otherGenres.map(([genre]) => genre),
      datasets: [{
        label: 'Next 20 Genres',
        data: otherGenres.map(([, count]) => count),
        backgroundColor: 'rgba(100, 240, 120, 0.7)',
        borderColor: 'rgba(100, 240, 120, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            autoSkip: false,
            maxRotation: 90,
            minRotation: 45,
            font: { size: 13 }
          },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: { font: { size: 13 } }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { size: 14 } }
        }
      }
    }
  });

  new Chart(ctxPie, {
    type: 'pie',
    data: {
      labels: topGenres.slice(0, 15).map(([genre]) => genre),
      datasets: [{
        label: 'Top 15 Genre Distribution',
        data: topGenres.slice(0, 15).map(([, count]) => count),
        backgroundColor: [
          '#66c0f4', '#a3d977', '#f4b642', '#f47360', '#d866f4',
          '#84e8dd', '#f486b0', '#f4d742', '#42f486', '#6c42f4',
          '#f44174', '#70d2f5', '#8cf542', '#f59842', '#ba42f5'
        ],
        borderColor: '#1b2838',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { font: { size: 13 } }
        },
        datalabels: {
          color: '#fff',
          font: {
            weight: 'bold',
            size: 12
          },
          align: 'end',
          offset: 20,
          formatter: (value, context) => {
            const data = context.chart.data.datasets[0].data;
            const total = data.reduce((sum, val) => sum + val, 0);
            const percentage = (value / total * 100).toFixed(1);
            return `${context.chart.data.labels[context.dataIndex]}\n${percentage}%`;
          }
        }
      },
      plugins: [ChartDataLabels]
    }
  });
}
