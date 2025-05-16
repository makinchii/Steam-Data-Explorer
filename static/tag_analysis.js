function drawDualTagCharts(topTags, otherTags) {
  const ctxTop = document.getElementById('topTagsChart').getContext('2d');
  const ctxOther = document.getElementById('otherTagsChart').getContext('2d');
  const ctxPie = document.getElementById('tagPieChart').getContext('2d');

  // Set canvas dimensions
  document.getElementById('topTagsChart').height = 600;
  document.getElementById('otherTagsChart').height = 600;
  document.getElementById('tagPieChart').height = 500;

  // Top 10 Tags Bar Chart
  new Chart(ctxTop, {
    type: 'bar',
    data: {
      labels: topTags.map(([tag]) => tag),
      datasets: [{
        label: 'Top 10 Tags',
        data: topTags.map(([, count]) => count),
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
            font: { size: 14 }
          },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: { font: { size: 14 } }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { size: 15 } }
        }
      }
    }
  });

  // Next 20 Tags Bar Chart
  new Chart(ctxOther, {
    type: 'bar',
    data: {
      labels: otherTags.map(([tag]) => tag),
      datasets: [{
        label: 'Next 20 Tags',
        data: otherTags.map(([, count]) => count),
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
            font: { size: 14 }
          },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: { font: { size: 14 } }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { size: 15 } }
        }
      }
    }
  });

  // Tag Distribution Pie Chart
  new Chart(ctxPie, {
    type: 'pie',
    data: {
      labels: topTags.slice(0, 15).map(([tag]) => tag),
      datasets: [{
        label: 'Top 15 Tag Distribution',
        data: topTags.slice(0, 15).map(([, count]) => count),
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
