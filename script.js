/* ================= GLOBAL STATE ================= */

let businessData      = [];
let currentCurrency   = "GBP";

let revenueChart      = null;
let profitChart       = null;
let expenseChart      = null;
let performanceBarChart   = null;
let distributionPieChart  = null;
let aiForecastChart       = null;

let aiChatHistory     = [];
let lastAIInsightText = "";


/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", function() {
  bindGlobalFunctions();
  renderAIInsights();
});


/* ================= CURRENCY ================= */

function setCurrency(currency) {
  currentCurrency = currency;
  updateAll();
}

function formatCurrency(val) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currentCurrency
  }).format(val);
}


/* ================= ADD DATA ================= */

function addData() {
  var monthValue = document.getElementById("month").value;
  var revenue    = parseFloat(document.getElementById("revenue").value);
  var expenses   = parseFloat(document.getElementById("expenses").value);

  if (!monthValue || isNaN(revenue) || isNaN(expenses)) {
    alert("Please enter a valid month, revenue, and expenses.");
    return;
  }

  var date   = new Date(monthValue + "-01");
  var profit = revenue - expenses;

  businessData.push({ date: date, revenue: revenue, expenses: expenses, profit: profit });
  businessData.sort(function(a, b) { return a.date - b.date; });

  updateAll();
}


/* ================= MASTER UPDATE ================= */

function updateAll() {
  renderRecordsTable();
  updateProgressIndicator();
  renderCoreCharts();
  renderAIInsights();

  if (businessData.length >= 3) {
    renderPerformanceMatrix();
    renderRiskAssessment();
  }
}


/* ================= RECORDS TABLE ================= */

function renderRecordsTable() {
  var tbody = document.getElementById("recordsTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (businessData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:28px;font-family:monospace;font-size:12px;">No records yet — add your first month above</td></tr>';
    return;
  }

  businessData.forEach(function(record) {
    var profitColor = record.profit >= 0 ? "var(--success)" : "var(--danger)";
    var row = document.createElement("tr");
    row.innerHTML =
      "<td>" + record.date.toISOString().slice(0, 7) + "</td>" +
      "<td>" + formatCurrency(record.revenue) + "</td>" +
      "<td>" + formatCurrency(record.expenses) + "</td>" +
      '<td style="color:' + profitColor + ';font-weight:600;">' + formatCurrency(record.profit) + "</td>";
    tbody.appendChild(row);
  });
}


/* ================= PROGRESS INDICATOR ================= */

function updateProgressIndicator() {
  var progress = document.getElementById("dataProgress");
  if (!progress) return;

  var count = businessData.length;

  if (count < 3) {
    progress.innerHTML = count + " / 3 months entered &nbsp;&middot;&nbsp; Add " + (3 - count) + " more month" + (3 - count !== 1 ? "s" : "") + " to activate ImpactGrid Insights";
  } else {
    progress.innerHTML = '<span style="color:var(--success);">&#9679;</span> &nbsp;' + count + ' months recorded &nbsp;&middot;&nbsp; <strong style="color:var(--gold-light);">ImpactGrid Insights Active</strong>';
  }
}


/* ================= CORE CHARTS ================= */

function renderCoreCharts() {
  var labels = businessData.map(function(d) { return d.date.toISOString().slice(0, 7); });

  if (revenueChart)  { revenueChart.destroy();  revenueChart  = null; }
  if (profitChart)   { profitChart.destroy();   profitChart   = null; }
  if (expenseChart)  { expenseChart.destroy();  expenseChart  = null; }

  revenueChart = createStyledChart("revenueChart", "line", labels,
    businessData.map(function(d) { return d.revenue; }),
    "Revenue", "rgba(200,169,110,0.9)", "rgba(200,169,110,0.08)");

  profitChart = createStyledChart("profitChart", "line", labels,
    businessData.map(function(d) { return d.profit; }),
    "Profit / Loss", "rgba(45,212,160,0.9)", "rgba(45,212,160,0.08)");

  expenseChart = createStyledChart("expenseChart", "bar", labels,
    businessData.map(function(d) { return d.expenses; }),
    "Expenses", "rgba(255,77,109,0.85)", "rgba(255,77,109,0.08)");
}

function createStyledChart(id, type, labels, data, label, color, fillColor) {
  var canvas = document.getElementById(id);
  if (!canvas) return null;

  var isBar = (type === "bar");

  return new Chart(canvas, {
    type: type,
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        borderColor: color,
        backgroundColor: isBar ? color : fillColor,
        borderWidth: isBar ? 0 : 2,
        pointBackgroundColor: color,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: !isBar,
        borderRadius: isBar ? 6 : 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: {
            color: "rgba(122,139,168,0.9)",
            font: { family: "monospace", size: 11 }
          }
        },
        tooltip: {
          backgroundColor: "#121729",
          borderColor: "#222b42",
          borderWidth: 1,
          titleColor: "#edf0f7",
          bodyColor: "#7a8ba8",
          padding: 12,
          callbacks: {
            label: function(ctx) { return " " + formatCurrency(ctx.raw); }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#3d4e68", font: { family: "monospace", size: 10 } },
          grid:  { color: "rgba(26,32,53,0.8)" }
        },
        y: {
          ticks: {
            color: "#3d4e68",
            font: { family: "monospace", size: 10 },
            callback: function(val) { return formatCurrency(val); }
          },
          grid: { color: "rgba(26,32,53,0.8)" }
        }
      }
    }
  });
}


/* ================= AI FORECAST ================= */

function generateAIProjection(years) {
  if (businessData.length < 3) return;

  var canvas      = document.getElementById("aiForecastChart");
  var explanation = document.getElementById("aiForecastExplanation");
  if (!canvas) return;

  if (aiForecastChart) { aiForecastChart.destroy(); aiForecastChart = null; }

  var growthRates = [];
  for (var i = 1; i < businessData.length; i++) {
    if (businessData[i - 1].revenue > 0) {
      growthRates.push((businessData[i].revenue - businessData[i - 1].revenue) / businessData[i - 1].revenue);
    }
  }

  var avgGrowth = growthRates.length > 0
    ? growthRates.reduce(function(a, b) { return a + b; }, 0) / growthRates.length
    : 0;

  var revenue = businessData[businessData.length - 1].revenue;
  var labels = [], base = [], optimistic = [], conservative = [];

  for (var y = 1; y <= years; y++) {
    revenue = revenue * Math.pow(1 + avgGrowth, 12);
    var b = Math.max(0, Math.round(revenue));
    labels.push("Year " + y);
    base.push(b);
    optimistic.push(Math.round(b * 1.15));
    conservative.push(Math.round(b * 0.85));
  }

  aiForecastChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Optimistic (+15%)",
          data: optimistic,
          borderColor: "rgba(45,212,160,0.55)",
          backgroundColor: "transparent",
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 3,
          borderWidth: 1.5
        },
        {
          label: "Base Projection",
          data: base,
          borderColor: "rgba(200,169,110,1)",
          backgroundColor: "rgba(200,169,110,0.06)",
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "rgba(200,169,110,1)",
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2.5
        },
        {
          label: "Conservative (-15%)",
          data: conservative,
          borderColor: "rgba(255,77,109,0.55)",
          backgroundColor: "transparent",
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 3,
          borderWidth: 1.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: {
            color: "rgba(122,139,168,0.9)",
            font: { family: "monospace", size: 11 },
            boxWidth: 14,
            padding: 16
          }
        },
        tooltip: {
          backgroundColor: "#121729",
          borderColor: "#222b42",
          borderWidth: 1,
          titleColor: "#edf0f7",
          bodyColor: "#7a8ba8",
          padding: 12,
          callbacks: {
            label: function(ctx) { return " " + ctx.dataset.label + ": " + formatCurrency(ctx.raw); }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#3d4e68", font: { family: "monospace", size: 10 } },
          grid:  { color: "rgba(26,32,53,0.8)" }
        },
        y: {
          ticks: {
            color: "#3d4e68",
            font: { family: "monospace", size: 10 },
            callback: function(val) { return formatCurrency(val); }
          },
          grid: { color: "rgba(26,32,53,0.8)" }
        }
      }
    }
  });

  if (explanation) {
    explanation.innerHTML =
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:16px;">' +
        tile("Optimistic", formatCurrency(optimistic[optimistic.length - 1]), "rgba(45,212,160,0.2)", "#2dd4a0") +
        tile("Base Projection", formatCurrency(base[base.length - 1]), "rgba(200,169,110,0.12)", "#c8a96e") +
        tile("Conservative", formatCurrency(conservative[conservative.length - 1]), "rgba(255,77,109,0.12)", "#ff4d6d") +
      "</div>";
  }
}

function tile(label, value, bg, color) {
  return '<div style="padding:14px 16px;background:' + bg + ';border:1px solid ' + color + '30;border-radius:8px;">' +
    '<div style="font-size:10px;font-family:monospace;color:' + color + ';letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">' + label + '</div>' +
    '<div style="font-size:15px;font-weight:700;color:' + color + ';">' + value + '</div>' +
  '</div>';
}


/* ================= AI INSIGHTS ================= */

function renderAIInsights() {
  var section = document.getElementById("aiInsights");
  if (!section) return;

  if (businessData.length < 1) {
    section.innerHTML = '<span style="color:var(--text-muted);font-size:12px;">Awaiting financial data — insights appear once records are entered.</span>';
    return;
  }

  var totalRevenue = sum("revenue");
  var totalProfit  = sum("profit");
  var margin       = getMargin();
  var growth       = calculateMonthlyGrowth();
  var volatility   = calculateVolatility();

  var anomalies    = ImpactGridAI.detectAnomalies(businessData);
  var anomalyHTML  = anomalies.length > 0
    ? '<p style="color:var(--warning);margin-top:12px;"><strong>&#9888; Anomalies:</strong> ' + anomalies.map(function(a) { return a.date.toISOString().slice(0,7); }).join(", ") + " showed unusual revenue patterns.</p>"
    : "";

  lastAIInsightText = "Total Revenue: " + formatCurrency(totalRevenue) +
    " | Total Profit: " + formatCurrency(totalProfit) +
    " | Profit Margin: " + margin.toFixed(2) + "%" +
    " | Growth: " + growth.toFixed(2) + "%" +
    " | Volatility: " + volatility.toFixed(2) + "%";

  var marginColor     = margin > 20    ? "var(--success)" : margin > 10 ? "var(--gold-light)" : "var(--danger)";
  var growthColor     = growth >= 0    ? "var(--success)" : "var(--danger)";
  var volatilityColor = volatility < 15 ? "var(--success)" : volatility < 30 ? "var(--warning)" : "var(--danger)";

  section.innerHTML =
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;">' +
      metricTile("Total Revenue",  formatCurrency(totalRevenue), "var(--gold-light)") +
      metricTile("Total Profit",   formatCurrency(totalProfit),  totalProfit >= 0 ? "var(--success)" : "var(--danger)") +
      metricTile("Profit Margin",  margin.toFixed(2) + "%",      marginColor) +
      metricTile("Revenue Growth", growth.toFixed(2) + "%",      growthColor) +
      metricTile("Volatility",     volatility.toFixed(2) + "%",  volatilityColor) +
    "</div>" +
    (anomalyHTML ? '<div style="margin-top:14px;">' + anomalyHTML + "</div>" : "");
}

function metricTile(label, value, color) {
  return '<div style="padding:14px 16px;background:var(--bg-mid);border:1px solid var(--border);border-radius:8px;">' +
    '<div style="font-size:10px;font-family:monospace;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">' + label + "</div>" +
    '<div style="font-size:16px;font-weight:700;color:' + color + ';">' + value + "</div>" +
  "</div>";
}


/* ================= PERFORMANCE MATRIX ================= */

function renderPerformanceMatrix() {
  var volatility = calculateVolatility();
  var growth     = calculateMonthlyGrowth();
  var margin     = getMargin();

  // Clean 0–100 scores
  var stabilityScore = Math.min(100, Math.max(0, parseFloat((100 - volatility).toFixed(1))));
  var growthScore    = Math.min(100, Math.max(0, parseFloat(Math.min(growth, 100).toFixed(1))));
  var profitScore    = Math.min(100, Math.max(0, parseFloat(Math.min(margin * 2, 100).toFixed(1))));

  // Destroy old charts safely
  if (performanceBarChart)  { performanceBarChart.destroy();  performanceBarChart  = null; }
  if (distributionPieChart) { distributionPieChart.destroy(); distributionPieChart = null; }

  // ── HORIZONTAL BAR CHART ──
  var barCanvas = document.getElementById("performanceBarChart");
  if (barCanvas) {
    performanceBarChart = new Chart(barCanvas, {
      type: "bar",
      data: {
        labels: ["Stability Index", "Growth Score", "Profit Score"],
        datasets: [
          {
            label: "Score",
            data: [stabilityScore, growthScore, profitScore],
            backgroundColor: ["rgba(45,212,160,0.85)", "rgba(200,169,110,0.85)", "rgba(61,127,255,0.85)"],
            borderWidth: 0,
            borderRadius: 6,
            barThickness: 28
          },
          {
            label: "Remaining",
            data: [100 - stabilityScore, 100 - growthScore, 100 - profitScore],
            backgroundColor: "rgba(26,32,53,0.6)",
            borderWidth: 0,
            borderRadius: 6,
            barThickness: 28
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#121729",
            borderColor: "#222b42",
            borderWidth: 1,
            titleColor: "#edf0f7",
            bodyColor: "#7a8ba8",
            padding: 12,
            filter: function(item) { return item.datasetIndex === 0; },
            callbacks: {
              label: function(ctx) { return " Score: " + ctx.raw.toFixed(1) + " / 100"; }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            max: 100,
            ticks: {
              color: "#3d4e68",
              font: { family: "monospace", size: 10 },
              callback: function(val) { return val + "%"; }
            },
            grid: { color: "rgba(26,32,53,0.8)" }
          },
          y: {
            stacked: true,
            ticks: { color: "#7a8ba8", font: { size: 12 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  // ── GAUGE CANVASES (replace pie) ──
  var pieCanvas = document.getElementById("distributionPieChart");
  if (pieCanvas) {
    var container = pieCanvas.parentElement;
    pieCanvas.style.display = "none";

    var existing = container.querySelector(".gauge-grid");
    if (existing) existing.remove();

    container.insertAdjacentHTML("beforeend",
      '<div class="gauge-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:8px 0;">' +
        gaugeCard("stability", "Stability", stabilityScore, "#2dd4a0") +
        gaugeCard("growth",    "Growth",    growthScore,    "#c8a96e") +
        gaugeCard("profit",    "Profit",    profitScore,    "#3d7fff") +
      "</div>"
    );

    // Small delay to ensure DOM is painted before drawing on canvas
    setTimeout(function() {
      drawGauge("gauge-stability", stabilityScore, "#2dd4a0");
      drawGauge("gauge-growth",    growthScore,    "#c8a96e");
      drawGauge("gauge-profit",    profitScore,    "#3d7fff");
    }, 50);
  }

  // ── HEALTH SCORE ──
  var health = Math.min(100, Math.max(0, Math.round((stabilityScore + growthScore + profitScore) / 3)));
  var healthColor  = health >= 70 ? "#2dd4a0" : health >= 40 ? "#c8a96e" : "#ff4d6d";
  var healthBorder = health >= 70 ? "rgba(45,212,160,0.3)" : health >= 40 ? "rgba(200,169,110,0.3)" : "rgba(255,77,109,0.3)";
  var healthLabel  = health >= 70 ? "Healthy" : health >= 40 ? "Moderate" : "At Risk";

  setText("businessHealthIndex",
    '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">' +
      '<div style="padding:14px 22px;background:var(--bg-mid);border:1px solid ' + healthBorder + ';border-radius:8px;">' +
        '<div style="font-size:10px;font-family:monospace;color:var(--text-muted);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:4px;">Business Health Score</div>' +
        '<div style="font-size:28px;font-weight:800;color:' + healthColor + ';line-height:1;">' + health + '<span style="font-size:14px;opacity:0.55;margin-left:2px;">/100</span></div>' +
        '<div style="font-size:11px;font-family:monospace;color:' + healthColor + ';margin-top:4px;letter-spacing:0.06em;">' + healthLabel + '</div>' +
      "</div>" +
      '<div style="font-size:12px;color:var(--text-secondary);max-width:360px;line-height:1.7;">Composite score based on revenue stability, growth trajectory, and profit margin. Updates in real time.</div>' +
    "</div>"
  );
}

function gaugeCard(id, label, score, color) {
  return '<div style="text-align:center;padding:12px 8px;background:var(--bg-mid);border:1px solid var(--border);border-radius:12px;">' +
    '<canvas id="gauge-' + id + '" width="120" height="80" style="display:block;margin:0 auto;"></canvas>' +
    '<div style="font-size:18px;font-weight:800;color:' + color + ';margin-top:4px;">' + score.toFixed(0) + '<span style="font-size:11px;opacity:0.45;margin-left:1px;">/100</span></div>' +
    '<div style="font-size:10px;font-family:monospace;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-top:3px;">' + label + "</div>" +
  "</div>";
}

function drawGauge(canvasId, value, color) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var w   = canvas.width;
  var h   = canvas.height;
  var cx  = w / 2;
  var cy  = h * 0.9;
  var r   = w * 0.38;

  ctx.clearRect(0, 0, w, h);

  // Track
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI);
  ctx.strokeStyle = "rgba(26,32,53,0.9)";
  ctx.lineWidth   = 10;
  ctx.lineCap     = "round";
  ctx.stroke();

  // Value arc
  var endAngle = Math.PI + (value / 100) * Math.PI;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, endAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth   = 10;
  ctx.lineCap     = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur  = 10;
  ctx.stroke();
  ctx.shadowBlur  = 0;
}


/* ================= RISK ASSESSMENT ================= */

function renderRiskAssessment() {
  var volatility = calculateVolatility();
  var margin     = getMargin();

  var stabilityLevel = volatility > 30 ? "Elevated" : volatility > 15 ? "Moderate" : "Low";
  var marginLevel    = margin < 10     ? "Elevated" : margin < 20     ? "Moderate" : "Low";
  var liquidityLevel = margin > 5      ? "Stable"   : "Weak";

  function riskColor(level) {
    return level === "Low" || level === "Stable" ? "#2dd4a0" : level === "Moderate" ? "#f5a623" : "#ff4d6d";
  }

  setText("stabilityRisk",
    '<span style="color:' + riskColor(stabilityLevel) + ';font-weight:700;">' + stabilityLevel + '</span>' +
    '<span style="color:var(--text-muted);font-size:12px;margin-left:10px;">Volatility: ' + volatility.toFixed(1) + '%</span>'
  );
  setText("marginRisk",
    '<span style="color:' + riskColor(marginLevel) + ';font-weight:700;">' + marginLevel + '</span>' +
    '<span style="color:var(--text-muted);font-size:12px;margin-left:10px;">Margin: ' + margin.toFixed(1) + '%</span>'
  );
  setText("liquidityRisk",
    '<span style="color:' + riskColor(liquidityLevel) + ';font-weight:700;">' + liquidityLevel + '</span>'
  );

  var insight = "Operational risk is currently within manageable bounds.";
  if (volatility > 30) insight = "High revenue volatility detected — consider diversifying income streams to improve stability.";
  if (margin < 10)     insight += " Profit margin is under pressure; a cost structure review is recommended.";
  if (volatility <= 15 && margin >= 20) insight = "Strong financial health — revenue is stable and margins are healthy.";

  setText("riskInsight", insight);
}


/* ================= AI CHAT ================= */

async function askImpactGridAI() {
  var input  = document.getElementById("aiChatInput");
  var output = document.getElementById("aiChatOutput");
  if (!input || !output) return;

  var question = input.value.trim();
  if (question === "") return;

  output.innerHTML += '<div class="ai-user">' + question + "</div>";
  input.value = "";
  output.scrollTop = output.scrollHeight;

  aiChatHistory.push({ role: "user", content: question });

  var typingId = "typing-" + Date.now();
  output.innerHTML += '<div class="ai-response" id="' + typingId + '"><span class="ai-typing">ImpactGrid AI is thinking<span class="dots">...</span></span></div>';
  output.scrollTop = output.scrollHeight;

  var response = await ImpactGridAI.analyze(question, businessData, currentCurrency, aiChatHistory);

  var typingEl = document.getElementById(typingId);
  if (typingEl) typingEl.remove();

  output.innerHTML += '<div class="ai-response">' + response + "</div>";
  output.scrollTop = output.scrollHeight;

  var tmp = document.createElement("div");
  tmp.innerHTML = response;
  lastAIInsightText = tmp.innerText || tmp.textContent || lastAIInsightText;

  aiChatHistory.push({ role: "ai", content: response });
}

function fillAIChat(text) {
  var input = document.getElementById("aiChatInput");
  if (input) {
    input.value = text;
    input.focus();
    askImpactGridAI();
  }
}


/* ================= PDF ENGINE ================= */

function generatePDF() {
  if (businessData.length === 0) {
    alert("Add at least one month of data before generating a report.");
    return;
  }

  var jsPDF  = window.jspdf.jsPDF;
  var doc    = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  var W      = 210;
  var mg     = 18;

  function sf(size, style, r, g, b) {
    doc.setFontSize(size);
    doc.setFont("helvetica", style || "normal");
    doc.setTextColor(r !== undefined ? r : 180, g !== undefined ? g : 195, b !== undefined ? b : 215);
  }

  function rule(y) {
    doc.setDrawColor(200, 169, 110);
    doc.setLineWidth(0.25);
    doc.line(mg, y, W - mg, y);
  }

  function box(x, y, w, h, fr, fg, fb, sr, sg, sb) {
    doc.setFillColor(fr !== undefined ? fr : 14, fg !== undefined ? fg : 18, fb !== undefined ? fb : 32);
    doc.setDrawColor(sr !== undefined ? sr : 34, sg !== undefined ? sg : 43, sb !== undefined ? sb : 66);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, w, h, 2, 2, "FD");
  }

  function addHeader() {
    doc.setFillColor(6, 8, 15);
    doc.rect(0, 0, W, 20, "F");
    doc.setFillColor(200, 169, 110);
    doc.rect(0, 0, W, 1, "F");
    sf(8, "bold", 200, 169, 110);
    doc.text("ImpactGrid", mg, 13);
    sf(8, "normal", 61, 78, 104);
    doc.text("Financial Intelligence Report  ·  IFSRM v3.0", mg + 26, 13);
  }

  // ── COVER ──
  doc.setFillColor(6, 8, 15);
  doc.rect(0, 0, W, 85, "F");
  doc.setFillColor(200, 169, 110);
  doc.rect(0, 0, W, 1.5, "F");

  sf(24, "bold", 226, 201, 138);
  doc.text("ImpactGrid", mg, 26);
  sf(9, "normal", 61, 78, 104);
  doc.text("Financial Stability Engine  ·  IFSRM v3.0", mg, 34);

  doc.setDrawColor(200, 169, 110);
  doc.setLineWidth(0.4);
  doc.line(mg, 40, 85, 40);

  sf(16, "bold", 237, 240, 247);
  doc.text("Financial Intelligence Report", mg, 52);
  sf(9, "normal", 61, 78, 104);
  doc.text("Generated: " + new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), mg, 61);
  doc.text("Currency: " + currentCurrency + "   ·   Months on Record: " + businessData.length, mg, 68);

  var bTypeEl = document.getElementById("businessType");
  var bType   = bTypeEl ? bTypeEl.options[bTypeEl.selectedIndex].text : "SME";
  box(W - 68, 20, 50, 22);
  sf(7, "normal", 61, 78, 104);
  doc.text("BUSINESS TYPE", W - 63, 29);
  sf(9, "bold", 200, 169, 110);
  doc.text(bType.toUpperCase().slice(0, 16), W - 63, 36);

  // ── METRIC CARDS ──
  var totalRevenue  = sum("revenue");
  var totalExpenses = sum("expenses");
  var totalProfit   = sum("profit");
  var margin        = getMargin();
  var growth        = calculateMonthlyGrowth();
  var volatility    = calculateVolatility();
  var stability     = Math.min(100, Math.max(0, 100 - volatility));
  var gScore        = Math.min(100, Math.max(0, Math.min(growth, 100)));
  var pScore        = Math.min(100, Math.max(0, Math.min(margin * 2, 100)));
  var health        = Math.min(100, Math.max(0, Math.round((stability + gScore + pScore) / 3)));

  var y = 96;
  sf(8, "normal", 61, 78, 104);
  doc.text("KEY FINANCIAL METRICS", mg, y);
  rule(y + 3); y += 10;

  var cards = [
    { l: "Total Revenue",  v: formatCurrency(totalRevenue),  c: [200,169,110] },
    { l: "Total Expenses", v: formatCurrency(totalExpenses), c: [255,77,109] },
    { l: "Net Profit",     v: formatCurrency(totalProfit),   c: totalProfit >= 0 ? [45,212,160] : [255,77,109] },
    { l: "Profit Margin",  v: margin.toFixed(1) + "%",       c: margin > 20 ? [45,212,160] : margin > 10 ? [200,169,110] : [255,77,109] },
    { l: "Revenue Growth", v: growth.toFixed(1) + "%",       c: growth >= 0 ? [45,212,160] : [255,77,109] },
    { l: "Health Score",   v: health + " / 100",             c: health >= 70 ? [45,212,160] : health >= 40 ? [200,169,110] : [255,77,109] }
  ];

  var cw = (W - mg * 2 - 10) / 3;
  cards.forEach(function(c, i) {
    var cx = mg + (i % 3) * (cw + 5);
    var cy = y + Math.floor(i / 3) * 28;
    box(cx, cy, cw, 23);
    sf(7, "normal", 61, 78, 104);
    doc.text(c.l.toUpperCase(), cx + 5, cy + 8);
    doc.setTextColor(c.c[0], c.c[1], c.c[2]);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(c.v, cx + 5, cy + 17);
  });
  y += 62;

  // ── RECORDS TABLE ──
  rule(y); y += 8;
  sf(8, "normal", 61, 78, 104);
  doc.text("MONTHLY FINANCIAL RECORDS", mg, y); y += 8;

  box(mg, y, W - mg * 2, 9, 14, 18, 32, 34, 43, 66);
  var cols = [mg + 3, mg + 42, mg + 90, mg + 138];
  var heads = ["MONTH", "REVENUE", "EXPENSES", "PROFIT / LOSS"];
  sf(7, "bold", 122, 139, 168);
  heads.forEach(function(h, i) { doc.text(h, cols[i], y + 6); });
  y += 11;

  businessData.forEach(function(record, idx) {
    if (y > 268) { doc.addPage(); addHeader(); y = 30; }
    var fill = idx % 2 === 0 ? [10,13,24] : [14,18,32];
    box(mg, y, W - mg * 2, 8, fill[0], fill[1], fill[2], 26, 32, 53);
    sf(8, "normal", 180, 195, 215);
    doc.text(record.date.toISOString().slice(0, 7), cols[0], y + 5.5);
    doc.text(formatCurrency(record.revenue),        cols[1], y + 5.5);
    doc.text(formatCurrency(record.expenses),       cols[2], y + 5.5);
    var pc = record.profit >= 0 ? [45,212,160] : [255,77,109];
    doc.setTextColor(pc[0], pc[1], pc[2]);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(record.profit),         cols[3], y + 5.5);
    y += 9;
  });

  // ── PAGE 2: INSIGHTS + RISK + RECOMMENDATIONS ──
  doc.addPage();
  addHeader();
  y = 30;

  sf(8, "normal", 61, 78, 104);
  doc.text("IMPACTGRID AI — STRATEGIC INSIGHTS & ADVISORY", mg, y);
  rule(y + 3); y += 14;

  box(mg, y, W - mg * 2, 10);
  doc.setFillColor(200, 169, 110);
  doc.roundedRect(mg, y, 2, 10, 1, 1, "F");
  sf(8, "bold", 226, 201, 138);
  doc.text("ImpactGrid AI Financial Analysis", mg + 6, y + 7);
  y += 16;

  var insightText = lastAIInsightText ||
    "Total Revenue: " + formatCurrency(totalRevenue) + ". Net Profit: " + formatCurrency(totalProfit) + ". " +
    "Profit Margin: " + margin.toFixed(1) + "%. Revenue Growth: " + growth.toFixed(1) + "%. " +
    (margin > 20 ? "Strong profitability demonstrated — operational efficiency is high." :
     margin > 10 ? "Moderate profitability. Optimise operating costs to improve margins." :
     "Margin pressure detected. A detailed cost structure review is strongly recommended.") + " " +
    (volatility > 30 ? "High revenue volatility — recurring income streams would improve financial stability." : "Revenue volatility is within acceptable limits.");

  var lines = doc.splitTextToSize(insightText, W - mg * 2 - 4);
  lines.forEach(function(line) {
    if (y > 262) { doc.addPage(); addHeader(); y = 30; }
    sf(9, "normal", 180, 195, 215);
    doc.text(line, mg, y);
    y += 5.5;
  });

  y += 8; rule(y); y += 10;

  // Risk
  sf(8, "normal", 61, 78, 104);
  doc.text("RISK ASSESSMENT", mg, y); y += 10;

  var risks = [
    { l: "Stability Risk", v: volatility > 30 ? "Elevated" : volatility > 15 ? "Moderate" : "Low",   n: "Volatility: " + volatility.toFixed(1) + "%" },
    { l: "Margin Risk",    v: margin < 10     ? "Elevated" : margin < 20     ? "Moderate" : "Low",    n: "Margin: " + margin.toFixed(1) + "%" },
    { l: "Liquidity Risk", v: margin > 5      ? "Stable"   : "Weak",                                  n: "" }
  ];

  risks.forEach(function(r) {
    if (y > 265) { doc.addPage(); addHeader(); y = 30; }
    var rc = r.v === "Low" || r.v === "Stable" ? [45,212,160] : r.v === "Moderate" ? [245,166,35] : [255,77,109];
    box(mg, y, W - mg * 2, 14);
    sf(7, "normal", 122, 139, 168);
    doc.text(r.l.toUpperCase(), mg + 5, y + 6);
    doc.setTextColor(rc[0], rc[1], rc[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(r.v, mg + 5, y + 12);
    if (r.n) { sf(8, "normal", 61, 78, 104); doc.text(r.n, mg + 44, y + 12); }
    y += 18;
  });

  y += 4; rule(y); y += 10;

  // Recommendations
  sf(8, "normal", 61, 78, 104);
  doc.text("STRATEGIC RECOMMENDATIONS", mg, y); y += 10;

  var recs = [];
  if (margin < 10)     recs.push("Review your cost structure. Margins below 10% indicate operational inefficiency or pricing challenges.");
  if (volatility > 30) recs.push("Introduce recurring revenue products or retainer agreements to reduce income volatility.");
  if (growth < 0)      recs.push("Revenue is declining. Identify top-performing periods and replicate the conditions that drove them.");
  if (margin > 20 && growth > 0) recs.push("Strong margins and positive growth — consider reinvesting profits into scaling or new markets.");
  if (recs.length === 0) recs.push("Continue scaling while maintaining financial discipline. Monitor margins and volatility quarterly.");

  recs.forEach(function(rec) {
    if (y > 265) { doc.addPage(); addHeader(); y = 30; }
    box(mg, y, W - mg * 2, 14);
    doc.setFillColor(200, 169, 110);
    doc.roundedRect(mg, y + 3, 2, 8, 1, 1, "F");
    sf(8, "normal", 180, 195, 215);
    var wrapped = doc.splitTextToSize(rec, W - mg * 2 - 12);
    doc.text(wrapped[0], mg + 6, y + 9);
    y += 18;
  });

  // ── FOOTER on every page ──
  var total = doc.internal.getNumberOfPages();
  for (var p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFillColor(6, 8, 15);
    doc.rect(0, 285, W, 12, "F");
    doc.setFillColor(200, 169, 110);
    doc.rect(0, 285, W, 0.4, "F");
    sf(7, "normal", 61, 78, 104);
    doc.text("© 2026 ImpactGrid Stability Engine  ·  IFSRM v3.0  ·  Confidential", mg, 291);
    doc.text("Page " + p + " of " + total, W - mg - 14, 291);
  }

  doc.save("ImpactGrid_Report_" + new Date().toISOString().slice(0, 10) + ".pdf");
}


/* ================= HELPERS ================= */

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.innerHTML = val;
}

function calculateMonthlyGrowth() {
  if (businessData.length < 2) return 0;
  var first = businessData[0].revenue;
  var last  = businessData[businessData.length - 1].revenue;
  return first > 0 ? ((last - first) / first) * 100 : 0;
}

function calculateVolatility() {
  if (businessData.length < 2) return 0;
  var revenues = businessData.map(function(d) { return d.revenue; });
  var mean     = revenues.reduce(function(a, b) { return a + b; }, 0) / revenues.length;
  var variance = revenues.reduce(function(a, b) { return a + Math.pow(b - mean, 2); }, 0) / revenues.length;
  return mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;
}

function getMargin() {
  var revenue = sum("revenue");
  var profit  = sum("profit");
  return revenue > 0 ? (profit / revenue) * 100 : 0;
}

function sum(key) {
  return businessData.reduce(function(a, b) { return a + (b[key] || 0); }, 0);
}


/* ================= NAV ================= */

function showSection(section, event) {
  document.querySelectorAll(".page-section").forEach(function(s) {
    s.classList.remove("active-section");
  });
  var target = document.getElementById(section);
  if (target) target.classList.add("active-section");

  document.querySelectorAll(".sidebar li").forEach(function(li) {
    li.classList.remove("active");
  });
  if (event) {
    var li = event.target.closest ? event.target.closest("li") : event.target;
    if (li) li.classList.add("active");
  }
}


/* ================= SIDEBAR ================= */

function toggleSidebar() {
  var sidebar = document.getElementById("sidebar");
  if (!sidebar) return;

  sidebar.classList.toggle("collapsed");
  var isCollapsed = sidebar.classList.contains("collapsed");

  var tab = document.getElementById("sidebar-reopen-tab");

  if (isCollapsed) {
    if (!tab) {
      tab = document.createElement("button");
      tab.id = "sidebar-reopen-tab";
      tab.innerHTML = "&#9654;";
      tab.title = "Open sidebar";
      tab.style.cssText =
        "position:fixed;left:0;top:50%;transform:translateY(-50%);" +
        "width:22px;height:48px;background:#0e1220;" +
        "border:1px solid #222b42;border-left:none;" +
        "border-radius:0 6px 6px 0;color:#c8a96e;font-size:11px;" +
        "cursor:pointer;z-index:9999;display:flex;align-items:center;justify-content:center;";
      tab.onclick = function() { toggleSidebar(); };
      document.body.appendChild(tab);
    }
    tab.style.display = "flex";
  } else {
    if (tab) tab.style.display = "none";
  }
}


/* ================= THEME ================= */

function toggleTheme() {
  document.body.classList.toggle("light-mode");
}


/* ================= LOGOUT ================= */

async function logout() {
  if (window.supabaseClient) await window.supabaseClient.auth.signOut();
  window.location.href = "login.html";
}


/* ================= BIND GLOBALS ================= */

function bindGlobalFunctions() {
  window.addData              = addData;
  window.setCurrency          = setCurrency;
  window.showSection          = showSection;
  window.logout               = logout;
  window.askImpactGridAI      = askImpactGridAI;
  window.fillAIChat           = fillAIChat;
  window.toggleTheme          = toggleTheme;
  window.toggleSidebar        = toggleSidebar;
  window.generatePDF          = generatePDF;
  window.generateAIProjection = generateAIProjection;
}
