const API_KEY = "8RO4V5CHHBQAL04R";

let radarChart;

document.getElementById("stockForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const ticker = document.getElementById("ticker").value.trim().toUpperCase();
  if (!ticker) return alert("Please enter a stock ticker.");

  const submitBtn = this.querySelector("button");
  submitBtn.disabled = true;
  submitBtn.textContent = "Loading...";

  try {
    const fundamentals = await fetchFundamentals(ticker);
    renderRadarChart(fundamentals, ticker);
    updateKeyRatios(fundamentals);
  } catch (error) {
    alert(error.message || "Failed to fetch data.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Analyze";
  }
});

async function fetchFundamentals(ticker) {
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data || Object.keys(data).length === 0 || data.Note || data.Information || data["Error Message"]) {
    throw new Error("API limit reached, ticker not found, or error occurred. Try again later.");
  }

  return {
    EPS: parseFloat(data.EPS) || 0,
    PERatio: parseFloat(data.PERatio) || 0,
    PEGRatio: parseFloat(data.PEGRatio) || 0,
    DividendYield: (parseFloat(data.DividendYield) || 0) * 100, // convert to %
    MarketCap: data.MarketCapitalization || "-",
    DebtToEquity: parseFloat(data.DebtToEquity) || 0,
    ReturnOnEquity: parseFloat(data.ReturnOnEquityTTM) || 0,
    ProfitMargin: (parseFloat(data.ProfitMargin) || 0) * 100,
    RevenueTTM: data.RevenueTTM || "-",
    EbitdaMargin: (parseFloat(data.EBITDAMargin) || 0) * 100,
    CurrentRatio: parseFloat(data.CurrentRatio) || 0,
  };
}

function renderRadarChart(data, ticker) {
  const ctx = document.getElementById("radarChart").getContext("2d");

  const safeValue = (val) => (val > 0 ? val : 0.1);

  if (radarChart) radarChart.destroy();

  radarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["EPS", "P/E Ratio", "P/E Growth Ratio", "Dividend Yield (%)"],
      datasets: [{
        label: `${ticker} Fundamentals`,
        data: [
          safeValue(data.EPS),
          safeValue(data.PERatio),
          safeValue(data.PEGRatio),
          safeValue(data.DividendYield)
        ],
        backgroundColor: "rgba(255, 99, 132, 0.2)",
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
          angleLines: { color: "rgba(255,255,255,0.2)" },
          suggestedMin: 0,
          suggestedMax: Math.max(
            data.EPS,
            data.PERatio,
            data.PEGRatio,
            data.DividendYield
          ) * 1.5 || 10,
          ticks: { color: "#ddd", stepSize: 1 },
          pointLabels: { color: "#ccc", font: { size: 14 } },
        }
      },
      plugins: {
        legend: { labels: { color: "#ccc" } }
      }
    }
  });
}

// Update Key Ratios Panel
function updateKeyRatios(data) {
  document.getElementById("marketCap").textContent =
    data.MarketCap !== "-" ? formatLargeNumber(data.MarketCap) : "-";

  document.getElementById("deRatio").textContent = data.DebtToEquity.toFixed(2);
  document.getElementById("roe").textContent = data.ReturnOnEquity.toFixed(2) + "%";
  document.getElementById("profitMargin").textContent = data.ProfitMargin.toFixed(2) + "%";
  document.getElementById("revenue").textContent =
    data.RevenueTTM !== "-" ? formatLargeNumber(data.RevenueTTM) : "-";

  document.getElementById("ebitdaMargin").textContent = data.EbitdaMargin.toFixed(2) + "%";
  document.getElementById("currentRatio").textContent = data.CurrentRatio.toFixed(2);
}

// Helper to format large numbers like 1,234,567,890 to "1.23B"
function formatLargeNumber(numStr) {
  const num = Number(numStr);
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toString();
}
