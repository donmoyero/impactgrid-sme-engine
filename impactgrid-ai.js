/* =====================================================
   IMPACTGRID AI ENGINE
   Financial Intelligence & Consultant Engine
===================================================== */

const ImpactGridAI = {

analyze(question,data,currency){

const q = question.toLowerCase();

/* ===== FORECAST ===== */

if(this.isForecastQuestion(q))
return this.forecastEngine(q,data,currency);

/* ===== RISK ===== */

if(this.isRiskQuestion(q))
return this.riskEngine(data,currency);

/* ===== PERFORMANCE ===== */

if(this.isPerformanceQuestion(q))
return this.performanceEngine(data,currency);

/* ===== STRATEGY ===== */

if(this.isStrategyQuestion(q))
return this.strategyEngine(data,currency);

/* ===== CHARTS ===== */

if(this.isChartQuestion(q))
return this.chartExplanation(data,currency);

/* ===== DEFAULT ===== */

return this.generalAdvice();

},

/* =====================================================
   INTENT DETECTION
===================================================== */

isForecastQuestion(q){
return q.includes("forecast") ||
       q.includes("projection") ||
       q.includes("future") ||
       q.includes("year") ||
       q === "3" ||
       q === "5" ||
       q === "10";
},

isRiskQuestion(q){
return q.includes("risk") ||
       q.includes("stable") ||
       q.includes("volatility");
},

isPerformanceQuestion(q){
return q.includes("performance") ||
       q.includes("health") ||
       q.includes("profit") ||
       q.includes("margin");
},

isStrategyQuestion(q){
return q.includes("strategy") ||
       q.includes("improve") ||
       q.includes("grow") ||
       q.includes("increase");
},

isChartQuestion(q){
return q.includes("chart") ||
       q.includes("analysis") ||
       q.includes("explain");
},

/* =====================================================
   FORECAST ENGINE
===================================================== */

forecastEngine(question,data,currency){

if(data.length < 3){
return "ImpactGrid AI requires at least 3 months of financial data before reliable projections can be generated.";
}

/* detect years */

let years = 3;

if(question.includes("5")) years = 5;
if(question.includes("10")) years = 10;

/* trigger forecast chart */

try{
if(typeof generateAIProjection === "function"){
generateAIProjection(years);
}
}catch(e){
console.warn("Forecast chart engine not loaded yet");
}

/* growth calculation */

const first = data[0];
const last = data[data.length-1];

let months =
(last.date.getFullYear()-first.date.getFullYear())*12 +
(last.date.getMonth()-first.date.getMonth());

if(months <= 0) months = 1;

const cagr = Math.pow(last.revenue/first.revenue,1/months)-1;

const projected = last.revenue*Math.pow(1+cagr,years*12);

return `
ImpactGrid AI Projection Analysis

Based on historical financial performance, your business revenue has been expanding at approximately ${(cagr*100).toFixed(2)}% per month.

If the current trajectory continues, projected revenue after ${years} years could reach:

${this.formatCurrency(projected,currency)}

Consultant Insight

Growth appears sustainable provided that operational costs remain controlled and revenue volatility stays within stable limits.

A visual forecast has been generated below for reference.
`;

},

/* =====================================================
   PERFORMANCE ENGINE
===================================================== */

performanceEngine(data,currency){

const revenue = this.sum(data,"revenue");
const profit = this.sum(data,"profit");

const margin = revenue>0 ? (profit/revenue)*100 : 0;

let insight="";

if(margin>20)
insight="Your business demonstrates strong profitability and efficient operations.";

else if(margin>10)
insight="Your company shows moderate profitability with opportunities to optimise margins.";

else
insight="Profit margins appear under pressure which suggests operational cost challenges.";

return `
ImpactGrid AI Performance Review

Total Revenue Recorded
${this.formatCurrency(revenue,currency)}

Total Profit Generated
${this.formatCurrency(profit,currency)}

Average Profit Margin
${margin.toFixed(2)}%

Consultant Assessment

${insight}

Strategic Focus

Maintaining revenue growth while improving cost discipline will strengthen long-term financial stability.
`;

},

/* =====================================================
   RISK ENGINE
===================================================== */

riskEngine(data,currency){

const volatility = this.calculateVolatility(data);

let level="";
let explanation="";

if(volatility<15){
level="Low";
explanation="Revenue behaviour appears stable and predictable.";
}

else if(volatility<30){
level="Moderate";
explanation="Revenue fluctuations exist but remain manageable.";
}

else{
level="Elevated";
explanation="High revenue volatility may increase operational risk.";
}

return `
ImpactGrid AI Risk Assessment

Revenue Volatility
${volatility.toFixed(2)}%

Risk Level
${level}

Consultant Insight

${explanation}

Recommendation

Focus on stabilising recurring revenue streams and reducing dependence on unpredictable income sources.
`;

},

/* =====================================================
   STRATEGY ENGINE
===================================================== */

strategyEngine(data,currency){

const margin = this.getMargin(data);
const volatility = this.calculateVolatility(data);

let strategy="";

if(margin<10)
strategy += "• Review operational expenses and cost structure.\n";

if(volatility>30)
strategy += "• Introduce more predictable revenue streams.\n";

if(margin>20)
strategy += "• Reinvest profits into growth initiatives.\n";

if(strategy==="")
strategy="• Continue scaling operations while maintaining financial stability.";

return `
ImpactGrid AI Strategic Recommendations

${strategy}

Long-Term Advisory

Sustainable SME growth is achieved through balanced profitability, revenue stability and operational efficiency.
`;

},

/* =====================================================
   CHART ANALYSIS
===================================================== */

chartExplanation(data,currency){

if(data.length<3)
return "ImpactGrid AI requires additional financial records to analyse chart behaviour.";

const growth = this.calculateGrowth(data);
const volatility = this.calculateVolatility(data);

return `
ImpactGrid Chart Analysis

Revenue Growth
${growth.toFixed(2)}%

Revenue Volatility
${volatility.toFixed(2)}%

Consultant Insight

These charts illustrate how revenue, expenses and profit evolve over time.

Consistent revenue growth combined with controlled expense levels indicates a healthy financial trajectory.

Monitoring volatility alongside profit margins helps anticipate operational risks.
`;

},

/* =====================================================
   EXECUTIVE REPORT
===================================================== */

generateExecutiveSummary(data,currency){

const revenue=this.sum(data,"revenue");
const profit=this.sum(data,"profit");
const margin=this.getMargin(data);
const volatility=this.calculateVolatility(data);

return `
Executive Financial Summary

Total Revenue
${this.formatCurrency(revenue,currency)}

Total Profit
${this.formatCurrency(profit,currency)}

Profit Margin
${margin.toFixed(2)}%

Revenue Volatility
${volatility.toFixed(2)}%

Consultant Summary

The business demonstrates ${
margin>15 ? "strong profitability" : "moderate profitability"
} with ${
volatility<20 ? "stable revenue behaviour." : "noticeable revenue volatility."
}

Maintaining predictable income streams and disciplined cost management will strengthen long-term financial stability.
`;

},

/* =====================================================
   GENERAL ADVICE
===================================================== */

generalAdvice(){

return `
ImpactGrid AI Consultant

You can ask questions like:

• "3 year projection"
• "5 year forecast"
• "Explain my charts"
• "How risky is my business?"
• "How can I improve profitability?"
• "Give strategic advice"
`;

},

/* =====================================================
   HELPERS
===================================================== */

sum(data,key){
return data.reduce((a,b)=>a+(b[key]||0),0);
},

calculateVolatility(data){

const revenues=data.map(d=>d.revenue);

const mean=revenues.reduce((a,b)=>a+b)/revenues.length;

const variance=revenues.reduce((a,b)=>a+(b-mean)**2,0)/revenues.length;

return (Math.sqrt(variance)/mean)*100;

},

calculateGrowth(data){

if(data.length<2) return 0;

const first=data[0].revenue;
const last=data[data.length-1].revenue;

return ((last-first)/first)*100;

},

getMargin(data){

const revenue=this.sum(data,"revenue");
const profit=this.sum(data,"profit");

return revenue>0?(profit/revenue)*100:0;

},

formatCurrency(value,currency){

return new Intl.NumberFormat(undefined,{
style:"currency",
currency:currency
}).format(value);

}

};
