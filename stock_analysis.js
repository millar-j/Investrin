// Event listener for the stock form submission
document.getElementById("stockForm").addEventListener("submit", function (e) {
  e.preventDefault(); // Prevent default form behavior (page reload)

  const ticker = document.getElementById("ticker").value.trim().toUpperCase(); // Sanitize & format input
  if (!ticker) return alert("Please enter a stock ticker.");

  fetchFundamentals(ticker); // Fetch and render stock fundamentals
});

// Radar chart instance holder
let radarChart;

/**
 * Fetch stock fundamentals from Alpha Vantage
 * Docs: https://www.alphavantage.co/documentation/#company-overview
 */
async function fetchFundamentals(ticker) {
  const API_KEY = "8RO4V5CHHBQAL04R";
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Handle error or rate limit
    if (!data || Object.keys(data).length === 0 || data.Note || data.Information) {
      alert("API limit reached, ticker not found, or error occurred. Try again later.");
      return;
    }

    // Extract and convert necessary data
    const fundamentals = {
      EPS: parseFloat(data.EPS) || 0,
      PERatio: parseFloat(data.PERatio) || 0,
      PEGRatio: parseFloat(data.PEGRatio) || 0,
      DividendYield: parseFloat(data.DividendYield) * 100 || 0 // Convert from decimal to percent
    };

    renderRadarChart(fundamentals, ticker);
  } catch (error) {
    console.error("Alpha Vantage API error:", error);
    alert("Unable to fetch stock data. Please check your internet connection or API key.");
  }
}

/**
 * Render a radar chart with given fundamentals
 */
function renderRadarChart(data, ticker) {
  const ctx = document.getElementById("radarChart").getContext("2d");

  if (radarChart) radarChart.destroy(); // Remove old chart

  radarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["EPS", "P/E Ratio", "P/E Growth Ratio", "Dividend Yield"],
      datasets: [{
        label: `${ticker} Fundamentals`,
        data: [data.EPS, data.PERatio, data.PEGRatio, data.DividendYield],
        backgroundColor: "rgba(255, 99, 132, 0.2)", // Transparent red fill
        borderColor: "red",
        pointBackgroundColor: "red",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "red"
      }]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          angleLines: {
            color: "rgba(255,255,255,0.2)"
          },
          suggestedMin: 0,
          suggestedMax: 30,
          pointLabels: {
            font: {
              size: 14,
              weight: 'bold'
            },
            color: '#fff'
          },
          ticks: {
            stepSize: 5,
            backdropColor: "transparent",
            color: '#ccc'
          }
        }
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "#fff"
          }
        },
        tooltip: {
          backgroundColor: "#333",
          titleColor: "#fff",
          bodyColor: "#eee"
        }
      }
    }
  });
}
