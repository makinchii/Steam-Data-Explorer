function drawPriceCharts(priceBuckets) {

  Chart.register(ChartDataLabels);

  const ctxHistogram = document.getElementById('priceHistogramChart').getContext('2d');
  const ctxPie = document.getElementById('pricePieChart').getContext('2d');

  document.getElementById('priceHistogramChart').height = 600;
  document.getElementById('pricePieChart').height = 600;

  const orderedLabels = ["Free", "$0–5", "$5–10", "$10–20", "$20–30", "$30–50", "$50–70", "$70+"];
  const orderedData = orderedLabels.map(label => priceBuckets[label] || 0);



  new Chart(ctxHistogram, {
    type: 'bar',
    data: {
      labels: orderedLabels,
      datasets: [{
        label: 'Number of Games',
        data: orderedData,
        backgroundColor: 'rgba(102, 192, 244, 0.8)',
        borderColor: 'rgba(102, 192, 244, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { font: { size: 14 } }
        },
        x: {
          ticks: { font: { size: 14 }, maxRotation: 60, minRotation: 30 },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });

  new Chart(ctxPie, {
    type: 'pie',
    data: {
      labels: orderedLabels,
      datasets: [{
        label: 'Price Distribution',
        data: orderedData,
        backgroundColor: orderedLabels.map((_, i) =>
          `hsl(${(i * 30) % 360}, 70%, 60%)`
        ),
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
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.raw;
              const data = context.chart.data.datasets[0].data;
              const total = data.reduce((sum, val) => sum + val, 0);
              const percent = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${value} games (${percent}%)`;
            }
          }
        },
      },
    }
  });
}
