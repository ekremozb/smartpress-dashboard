// Cylinder definitions
const cylinders = {
    "50": { bore: 50, rod: 36 },
    "63": { bore: 63, rod: 45 },
    "80": { bore: 80, rod: 56 }
};

// UI Elements
const modelSelect = document.getElementById('modelSelect');
const cylSelect = document.getElementById('cylSelect');
const inputPressure = document.getElementById('inputPressure');
const inputFlow = document.getElementById('inputFlow');

const areaExtEl = document.getElementById('areaExt');
const areaRetEl = document.getElementById('areaRet');
const forceExtEl = document.getElementById('forceExt');
const forceRetEl = document.getElementById('forceRet');
const speedExtEl = document.getElementById('speedExt');
const speedRetEl = document.getElementById('speedRet');

// Initialize
function init() {
    // Populate model select
    for (const model in motionData) {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
    }
    
    // Set default model based on cylinder if needed or just first
    modelSelect.addEventListener('change', renderChart);
    
    // Hydraulic listeners
    cylSelect.addEventListener('change', calculateHydraulics);
    inputPressure.addEventListener('input', calculateHydraulics);
    inputFlow.addEventListener('input', calculateHydraulics);
    
    // Initial renders
    renderChart();
    calculateHydraulics();
}

function calculateHydraulics() {
    const d = parseInt(cylSelect.value);
    const cyl = cylinders[d];
    
    const p = parseFloat(inputPressure.value) || 0;
    const q = parseFloat(inputFlow.value) || 0;
    
    // Area calculations in cm^2
    const areaExt = (Math.PI * Math.pow(cyl.bore, 2)) / 400; 
    const areaRod = (Math.PI * Math.pow(cyl.rod, 2)) / 400;
    const areaRet = areaExt - areaRod;
    
    areaExtEl.textContent = areaExt.toFixed(2);
    areaRetEl.textContent = areaRet.toFixed(2);
    
    // Force calculations in kN: F = P(bar) * A(cm2) / 100
    // Wait: 1 bar = 0.1 N/mm2 = 10 N/cm2. F(N) = P * 10 * A. F(kN) = P * A / 100.
    const forceExt = (p * areaExt) / 100;
    const forceRet = (p * areaRet) / 100;
    
    forceExtEl.textContent = forceExt.toFixed(2) + " kN";
    forceRetEl.textContent = forceRet.toFixed(2) + " kN";
    
    // Speed calculations in mm/s
    // v = Q(l/min) / A(cm2). l/min = 1000 cm3/min. v(cm/min) = Q*1000 / A. v(mm/s) = (Q*1000*10) / (A*60)
    const speedExt = (q * 1000 * 10) / (areaExt * 60);
    const speedRet = (q * 1000 * 10) / (areaRet * 60);
    
    speedExtEl.textContent = speedExt.toFixed(2) + " mm/s";
    speedRetEl.textContent = speedRet.toFixed(2) + " mm/s";
}

function renderChart() {
    const model = modelSelect.value;
    const data = motionData[model];
    
    const trace1 = {
        x: data.time,
        y: data.speed,
        name: 'Hız (mm/s)',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#00e5ff', width: 2, shape: 'hv' },
        hovertemplate: 'Zaman: %{x} s<br>Hız: %{y} mm/s<extra></extra>'
    };
    
    const trace2 = {
        x: data.time,
        y: data.position,
        name: 'Strok (mm)',
        type: 'scatter',
        mode: 'lines',
        yaxis: 'y2',
        line: { color: '#ff9900', width: 2 },
        hovertemplate: 'Zaman: %{x} s<br>Strok: %{y} mm<extra></extra>'
    };
    
    // Create shapes for phases
    const shapes = [];
    let startX = 0;
    let currPhase = data.phases[0];
    const colors = ['rgba(255,255,255,0.02)', 'rgba(0, 229, 255, 0.05)'];
    let colorIdx = 0;
    
    for (let i = 1; i < data.time.length; i++) {
        if (data.phases[i] !== currPhase || i === data.time.length - 1) {
            shapes.push({
                type: 'rect',
                xref: 'x',
                yref: 'paper',
                x0: startX,
                y0: 0,
                x1: data.time[i],
                y1: 1,
                fillcolor: colors[colorIdx % 2],
                opacity: 1,
                line: { width: 0 }
            });
            
            // Wait, we need to show the label, plotly annotations
            startX = data.time[i];
            currPhase = data.phases[i];
            colorIdx++;
        }
    }
    
    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#c9d1d9' },
        margin: { t: 40, l: 50, r: 50, b: 40 },
        hovermode: 'x unified',
        xaxis: {
            title: 'Zaman (s)',
            gridcolor: '#30363d',
            zerolinecolor: '#30363d'
        },
        yaxis: {
            title: 'Hız (mm/s)',
            titlefont: { color: '#00e5ff' },
            tickfont: { color: '#00e5ff' },
            gridcolor: '#30363d',
            zerolinecolor: '#30363d'
        },
        yaxis2: {
            title: 'Strok (mm)',
            titlefont: { color: '#ff9900' },
            tickfont: { color: '#ff9900' },
            overlaying: 'y',
            side: 'right',
            gridcolor: 'rgba(0,0,0,0)'
        },
        shapes: shapes,
        legend: { orientation: 'h', y: 1.1 }
    };
    
    Plotly.newPlot('chartDiv', [trace1, trace2], layout, { responsive: true, displayModeBar: false });
}

document.addEventListener('DOMContentLoaded', init);
