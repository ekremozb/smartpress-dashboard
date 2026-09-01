// SmartPress Kinematic Engine & UI Sync
const dt = 0.001;
const t_acc = 0.25;

let referenceDataMap = {};

const limits = {
    'SP-EM12-15': { maxStroke: 500, maxForce: 14.8 },
    'SP-EM25-30 Twin': { maxStroke: 500, maxForce: 29.6 },
    'SP-EH30-35': { maxStroke: 500, maxForce: 35 },
    'SP-EH45-55': { maxStroke: 500, maxForce: 55 },
    'SP-EH65-80': { maxStroke: 500, maxForce: 80 },
    'SP-EH100-125': { maxStroke: 500, maxForce: 125 }
};

const seriesModels = {
    'SP-EM': ['SP-EM12-15', 'SP-EM25-30 Twin'],
    'SP-EH': ['SP-EH30-35', 'SP-EH45-55', 'SP-EH65-80', 'SP-EH100-125']
};

const modelReferences = {
    "SP-EM12/15": { baseRpm: 5500, fastStroke: 410.0, searchStroke: 30.0, detectStroke: 10.0, pressStroke: 50.0, v_fast: 130.95238095238093, v_search: 95.23809523809524, v_detect: 95.23809523809524, v_press: 95.23809523809524, v_return: -130.95238095238093 },
    "SP-EM25/30 Twin": { baseRpm: 5500, fastStroke: 410.0, searchStroke: 30.0, detectStroke: 10.0, pressStroke: 50.0, v_fast: 130.95238095238093, v_search: 95.23809523809524, v_detect: 95.23809523809524, v_press: 95.23809523809524, v_return: -130.95238095238093 },
    "SP-EH30/35": { baseRpm: 3000, fastStroke: 410.0, searchStroke: 30.0, detectStroke: 10.0, pressStroke: 50.0, v_fast: 183.39, v_search: 50.93, v_detect: 25.46, v_press: 22.07, v_return: -197.40 },
    "SP-EH45/55": { baseRpm: 3000, fastStroke: 410.0, searchStroke: 30.0, detectStroke: 10.0, pressStroke: 50.0, v_fast: 117.37, v_search: 32.08, v_detect: 16.04, v_press: 13.90, v_return: -122.26 },
    "SP-EH65/80": { baseRpm: 3000, fastStroke: 410.0, searchStroke: 30.0, detectStroke: 10.0, pressStroke: 50.0, v_fast: 101.50, v_search: 27.85, v_detect: 13.93, v_press: 12.07, v_return: -97.52 },
    "SP-EH100/125": { baseRpm: 3000, fastStroke: 410.0, searchStroke: 30.0, detectStroke: 10.0, pressStroke: 50.0, v_fast: 64.96, v_search: 17.83, v_detect: 8.91, v_press: 7.72, v_return: -62.41 }
};

function formatModelName(model) {
    if (model === 'SP-EM12-15') return 'SP-EM12/15';
    if (model === 'SP-EM25-30 Twin') return 'SP-EM25/30 Twin';
    if (model === 'SP-EH30-35') return 'SP-EH30/35';
    if (model === 'SP-EH45-55') return 'SP-EH45/55';
    if (model === 'SP-EH65-80') return 'SP-EH65/80';
    if (model === 'SP-EH100-125') return 'SP-EH100/125';
    return model;
}

function updateSubModels() {
    const series = document.getElementById('seriesSelect').value;
    const modelSelect = document.getElementById('modelSelect');
    modelSelect.innerHTML = '';
    
    seriesModels[series].forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.text = formatModelName(model);
        modelSelect.appendChild(option);
    });
    
    modelSelect.value = seriesModels[series][0];
    
    syncLimits();
}

function updateTotalStrokeOptions() {
    const series = document.getElementById('seriesSelect').value;
    const model = document.getElementById('modelSelect').value;
    if (!model || !limits[model]) return;
    const limit = limits[model];
    
    const strokeSelect = document.getElementById('totalStrokeSelect');
    // Save current selection if exists to persist it if possible
    let currentVal = strokeSelect.value;
    strokeSelect.innerHTML = '';
    
    const optStd = document.createElement('option');
    optStd.value = limit.maxStroke;
    optStd.text = `Standart Maks. Strok (${limit.maxStroke} mm)`;
    strokeSelect.appendChild(optStd);
    
    const optOpt = document.createElement('option');
    optOpt.value = 750;
    optOpt.text = `Opsiyonel Maks. Strok (750 mm)`;
    strokeSelect.appendChild(optOpt);
    
    // Restore if valid
    if (currentVal && Array.from(strokeSelect.options).some(o => o.value === currentVal)) {
        strokeSelect.value = currentVal;
    }
}

function syncLimits() {
    updateTotalStrokeOptions();
    
    const model = document.getElementById('modelSelect').value;
    const series = document.getElementById('seriesSelect').value;
    if (!model || !limits[model]) return;
    const limit = limits[model];
    
    // Determine RPM max
    let maxRpm = series === 'SP-EH' ? 3000 : 5500;
    document.getElementById('rpmSlider').max = maxRpm;
    document.getElementById('rpm').max = maxRpm;
    
    let rpmVal = parseFloat(document.getElementById('rpm').value);
    if (rpmVal > maxRpm) {
        document.getElementById('rpm').value = maxRpm;
        document.getElementById('rpmSlider').value = maxRpm;
        document.getElementById('valRPM').innerText = maxRpm + ' RPM';
    }
    
    // Determine Current Max Stroke
    let currentMaxStroke = parseFloat(document.getElementById('totalStrokeSelect').value) || limit.maxStroke;
    
    // Adjust max attributes for force and stroke sliders
    document.getElementById('targetForceSlider').max = limit.maxForce;
    document.getElementById('searchStrokeSlider').max = currentMaxStroke;
    document.getElementById('detectStrokeSlider').max = currentMaxStroke;
    document.getElementById('pressStrokeSlider').max = currentMaxStroke;
    
    // Validate current values
    let force = parseFloat(document.getElementById('targetForce').value);
    
    if (force > limit.maxForce) {
        document.getElementById('targetForce').value = limit.maxForce;
        document.getElementById('targetForceSlider').value = limit.maxForce;
        document.getElementById('valForce').innerText = limit.maxForce + ' kN';
    }
    
    let searchStr = parseFloat(document.getElementById('searchStroke').value) || 0;
    let detectStr = parseFloat(document.getElementById('detectStroke').value) || 0;
    let pressStr = parseFloat(document.getElementById('pressStroke').value) || 0;
    
    let totalOther = searchStr + detectStr + pressStr;
    if (totalOther > currentMaxStroke) {
        // Reset to safe defaults if model limit is exceeded
        document.getElementById('searchStroke').value = 0;
        document.getElementById('searchStrokeSlider').value = 0;
        document.getElementById('valSearch').innerText = '0 mm';
        
        document.getElementById('detectStroke').value = 0;
        document.getElementById('detectStrokeSlider').value = 0;
        document.getElementById('valDetect').innerText = '0 mm';
        
        document.getElementById('pressStroke').value = 0;
        document.getElementById('pressStrokeSlider').value = 0;
        document.getElementById('valPress').innerText = '0 mm';
        totalOther = 0;
    }
    
    // Auto-calculate Fast Stroke
    let fastStr = currentMaxStroke - totalOther;
    document.getElementById('fastStroke').value = fastStr;
    document.getElementById('fastStrokeSlider').value = fastStr;
    document.getElementById('fastStrokeSlider').max = currentMaxStroke;
    document.getElementById('valFast').innerText = fastStr + ' mm';
    
    runSimulation();
}

function syncInputs(sourceId, value) {
    if (sourceId === 'totalStroke') {
        syncLimits();
        return;
    }

    const limit = limits[document.getElementById('modelSelect').value];
    let val = parseFloat(value) || 0;

    // First apply raw value
    if (sourceId.includes('Slider')) {
        let inputId = sourceId.replace('Slider', '');
        document.getElementById(inputId).value = val;
    } else {
        let sliderId = sourceId + 'Slider';
        document.getElementById(sliderId).value = val;
    }
    
    let currentMaxStroke = parseFloat(document.getElementById('totalStrokeSelect').value) || limit.maxStroke;
    
    // Validate stroke total if a stroke field is changed
    if (sourceId.includes('Stroke')) {
        let searchStr = parseFloat(document.getElementById('searchStroke').value) || 0;
        let detectStr = parseFloat(document.getElementById('detectStroke').value) || 0;
        let pressStr = parseFloat(document.getElementById('pressStroke').value) || 0;
        
        let totalOther = searchStr + detectStr + pressStr;
        if (totalOther > currentMaxStroke) {
            let excess = totalOther - currentMaxStroke;
            val = val - excess;
            if (val < 0) val = 0;
            
            // Re-apply capped value
            if (sourceId.includes('Slider')) {
                let inputId = sourceId.replace('Slider', '');
                document.getElementById(inputId).value = val;
                document.getElementById(sourceId).value = val;
            } else {
                let sliderId = sourceId + 'Slider';
                document.getElementById(sourceId).value = val;
                document.getElementById(sliderId).value = val;
            }
            // Recalculate totalOther with capped val
            searchStr = parseFloat(document.getElementById('searchStroke').value) || 0;
            detectStr = parseFloat(document.getElementById('detectStroke').value) || 0;
            pressStr = parseFloat(document.getElementById('pressStroke').value) || 0;
            totalOther = searchStr + detectStr + pressStr;
        }
        
        // Auto-calculate Fast Stroke
        let fastStr = currentMaxStroke - totalOther;
        document.getElementById('fastStroke').value = fastStr;
        document.getElementById('fastStrokeSlider').value = fastStr;
        document.getElementById('valFast').innerText = fastStr + ' mm';
    }

    let unit = " mm";
    if (sourceId.includes('Force')) unit = " kN";
    if (sourceId.includes('rpm')) unit = " RPM";
    
    let valDisplayId = "val" + sourceId.replace('Slider', '').charAt(0).toUpperCase() + sourceId.replace('Slider', '').slice(1).replace('Stroke', '');
    let displayEl = document.getElementById(valDisplayId);
    if(displayEl) displayEl.innerText = val + unit;

    runSimulation();
}

function calcPhase(stroke, target_v, start_v, t_acc_phase, t_dec_phase, is_forward) {
    let t_total = 0.0;
    let time_list = [], vel_list = [], pos_list = [];
    
    let dist = is_forward ? stroke : -stroke;
    let end_v = t_dec_phase > 0 ? 0.0 : target_v;
    
    let d_acc = 0.5 * (start_v + target_v) * t_acc_phase;
    let d_dec = 0.5 * (target_v + end_v) * t_dec_phase;
    let v_max = target_v;
    let coast_dist = dist - d_acc - d_dec;
    
    let t_coast = 0;
    if (coast_dist * Math.sign(dist) < -1e-6) {
        if (t_dec_phase === 0) {
            let acc = (target_v - start_v) / t_acc_phase;
            let val = Math.pow(start_v, 2) + 2 * acc * dist;
            v_max = Math.sign(target_v) * Math.sqrt(Math.max(0, val));
            t_acc_phase = acc !== 0 ? (v_max - start_v) / acc : 0;
            t_coast = 0;
        } else {
            let acc_rate = target_v / t_acc_phase;
            let dec_rate = target_v / t_dec_phase;
            let val = dist / (1/(2*acc_rate) + 1/(2*dec_rate));
            v_max = Math.sign(dist) * Math.sqrt(Math.max(0, val));
            t_acc_phase = acc_rate !== 0 ? v_max / acc_rate : 0;
            t_dec_phase = dec_rate !== 0 ? v_max / dec_rate : 0;
            t_coast = 0;
        }
    } else {
        t_coast = v_max !== 0 ? coast_dist / v_max : 0;
    }
    
    let t_phase = t_acc_phase + t_coast + t_dec_phase;
    let steps = Math.floor(t_phase / dt);
    let v_sim = start_v;
    let p_sim = 0;
    
    for (let step = 0; step < steps; step++) {
        let t_local = step * dt;
        let a = 0;
        if (t_local <= t_acc_phase) {
            a = t_acc_phase > 0 ? (v_max - start_v) / t_acc_phase : 0;
        } else if (t_local <= t_acc_phase + t_coast) {
            a = 0;
            v_sim = v_max;
        } else {
            a = t_dec_phase > 0 ? (end_v - v_max) / t_dec_phase : 0;
        }
        
        v_sim = v_sim + a * dt;
        p_sim = p_sim + v_sim * dt;
        t_total += dt;
        
        time_list.push(t_total);
        vel_list.push(v_sim);
        pos_list.push(p_sim);
    }
    
    return {
        time: time_list,
        vel: vel_list,
        pos: pos_list,
        duration: t_total,
        end_v: v_sim,
        end_p: p_sim
    };
}

function resetToDefaults() {
    let rawModel = document.getElementById('modelSelect').value;
    let modelName = formatModelName(rawModel);
    let ref = modelReferences[modelName];
    if (!ref) {
        ref = { baseRpm: 1500, searchStroke: 30, detectStroke: 10, pressStroke: 50 }; // fallback
    }

    document.getElementById('targetForce').value = 29.6;
    document.getElementById('targetForceSlider').value = 29.6;
    document.getElementById('searchStroke').value = ref.searchStroke;
    document.getElementById('searchStrokeSlider').value = ref.searchStroke;
    document.getElementById('detectStroke').value = ref.detectStroke;
    document.getElementById('detectStrokeSlider').value = ref.detectStroke;
    document.getElementById('pressStroke').value = ref.pressStroke;
    document.getElementById('pressStrokeSlider').value = ref.pressStroke;
    document.getElementById('rpm').value = ref.baseRpm;
    document.getElementById('rpmSlider').value = ref.baseRpm;
    
    // UI Label textini de guncelle
    document.getElementById('valForce').innerText = '29.6 kN';
    document.getElementById('valSearch').innerText = ref.searchStroke + ' mm';
    document.getElementById('valDetect').innerText = ref.detectStroke + ' mm';
    document.getElementById('valPress').innerText = ref.pressStroke + ' mm';
    document.getElementById('valRPM').innerText = ref.baseRpm + ' RPM';
    
    syncLimits();
}

function runSimulation() {
    let rpm = parseFloat(document.getElementById('rpm').value);
    
    // Process limits logic
    let series = document.getElementById('seriesSelect').value;
    let rawModel = document.getElementById('modelSelect').value;
    let modelName = formatModelName(rawModel);
    
    let ref = modelReferences[modelName];
    
    let v_fast = 0, v_search = 0, v_detect = 0, v_press = 0, v_return = 0;
    let fast_t_dec = 0.0; // Fixed: do not decelerate to zero between phases

    if (ref) {
        let scale = rpm / ref.baseRpm;
        v_fast = ref.v_fast * scale;
        v_search = ref.v_search * scale;
        v_detect = ref.v_detect * scale;
        v_press = ref.v_press * scale;
        v_return = ref.v_return * scale;
    } else {
        // Fallback for unknown models
        let maxProcessRpm = series === 'SP-EM' ? Math.min(rpm, 4000) : rpm;
        v_fast = (rpm / 60.0) * 10;
        v_return = -v_fast;
        v_search = (maxProcessRpm / 60.0) * 2;
        v_detect = 10.0;
        v_press = 5.0;
    }
    
    let fastStroke = parseFloat(document.getElementById('fastStroke').value) || 0;
    let searchStroke = parseFloat(document.getElementById('searchStroke').value) || 0;
    let detectStroke = parseFloat(document.getElementById('detectStroke').value) || 0;
    let pressStroke = parseFloat(document.getElementById('pressStroke').value) || 0;
    
    let phases = [
        { name: 'Hızlı Yaklaşma', stroke: fastStroke, v: v_fast, t_acc: 0.25, t_dec: fast_t_dec, color: 'rgba(33, 150, 243, 0.3)' },
        { name: 'Temas Arama', stroke: searchStroke, v: v_search, t_acc: 0.25, t_dec: 0.0, color: 'rgba(255, 152, 0, 0.3)' },
        { name: 'Temas Algılama', stroke: detectStroke, v: v_detect, t_acc: 0.0, t_dec: 0.0, color: 'rgba(255, 193, 7, 0.3)' },
        { name: 'Kontrollü Presleme', stroke: pressStroke, v: v_press, t_acc: 0.0, t_dec: 0.0, color: 'rgba(244, 67, 54, 0.3)' },
        { name: 'Bekleme (1.0s)', stroke: 0, v: 0, t_acc: 0, t_dec: 0, color: 'rgba(156, 39, 176, 0.3)', is_wait: true, duration: 1.0 },
        { name: 'Kontrollü Geri Çekilme', stroke: (fastStroke+searchStroke+detectStroke+pressStroke), v: v_return, t_acc: 0.25, t_dec: 0.25, color: 'rgba(76, 175, 80, 0.3)', is_forward: false }
    ];
    
    let total_time = [];
    let total_vel = [];
    let total_pos = [];
    let shapes = [];
    let legend_traces = [];
    
    let global_t = 0.0;
    let current_v = 0.0;
    let current_p = 0.0;
    
    for (let phase of phases) {
        let start_t = global_t;
        
        if (phase.is_wait) {
            let steps = Math.floor(phase.duration / dt);
            for(let i=0; i<steps; i++) {
                global_t += dt;
                total_time.push(global_t);
                total_vel.push(0);
                total_pos.push(current_p);
            }
            current_v = 0;
        } else {
            let res = calcPhase(phase.stroke, phase.v, current_v, phase.t_acc, phase.t_dec, phase.is_forward !== false);
            for (let i=0; i<res.time.length; i++) {
                total_time.push(start_t + res.time[i]);
                total_vel.push(res.vel[i]);
                total_pos.push(current_p + res.pos[i]);
            }
            global_t += res.duration;
            current_v = res.end_v;
            current_p += (phase.is_forward !== false ? phase.stroke : -phase.stroke);
        }
        
        shapes.push({
            type: 'rect',
            xref: 'x',
            yref: 'paper',
            x0: start_t,
            y0: 0,
            x1: global_t,
            y1: 1,
            fillcolor: phase.color,
            opacity: 1,
            line: { width: 0 },
            layer: 'below'
        });
        
        legend_traces.push({
            x: [null],
            y: [null],
            name: phase.name,
            type: 'scatter',
            mode: 'lines',
            line: {color: phase.color.replace('0.3', '0.8'), width: 10},
            hoverinfo: 'none'
        });
    }
    
    document.getElementById('resCycleTime').innerText = global_t.toFixed(2) + " sn";
    
    let trace1 = {
        x: total_time,
        y: total_vel,
        name: 'Hız (Hesaplanan)',
        type: 'scatter',
        line: {color: 'white', width: 2}
    };
    
    let trace2 = {
        x: total_time,
        y: total_pos,
        name: 'Pozisyon (Hesaplanan)',
        type: 'scatter',
        yaxis: 'y2',
        line: {color: '#ff4d4d', width: 2}
    };
    
    let traces = [trace1, trace2, ...legend_traces];
    
    let modelKey = formatModelName(document.getElementById('modelSelect').value);
    let refData = referenceDataMap[modelKey];
    
    if (refData) {
        let ref_time = refData.map(d => d.time);
        let ref_vel = refData.map(d => d.speed);
        let ref_pos = refData.map(d => d.position);

        let trace3 = {
            x: ref_time,
            y: ref_vel,
            name: 'Hız (Referans)',
            type: 'scatter',
            line: {color: 'rgba(255, 255, 255, 0.4)', width: 2, dash: 'dot'}
        };
        
        let trace4 = {
            x: ref_time,
            y: ref_pos,
            name: 'Pozisyon (Referans)',
            type: 'scatter',
            yaxis: 'y2',
            line: {color: 'rgba(255, 77, 77, 0.4)', width: 2, dash: 'dot'}
        };
        traces.push(trace3);
        traces.push(trace4);
    }
    
    let layout = {
        paper_bgcolor: '#0d1117',
        plot_bgcolor: '#0d1117',
        margin: {l: 60, r: 60, t: 40, b: 40},
        hovermode: 'x unified',
        xaxis: { title: 'Zaman (s)', color: 'white', gridcolor: '#30363d' },
        yaxis: { 
            title: 'Hız (mm/s)', 
            color: 'white', 
            gridcolor: '#30363d'
        },
        yaxis2: {
            title: 'Pozisyon (mm)',
            color: '#ff4d4d',
            overlaying: 'y',
            side: 'right',
            gridcolor: 'transparent'
        },
        legend: { font: {color: 'white'}, orientation: 'h', y: -0.2 },
        shapes: shapes
    };
    
    Plotly.newPlot('chartDiv', traces, layout, {responsive: true});
}

// Initial Run
window.onload = async function() {
    try {
        let res = await fetch('data/motion_data.json');
        let rawData = await res.json();
        rawData.forEach(item => {
            referenceDataMap[item.model] = item.data;
        });
    } catch (e) {
        console.warn("Reference data could not be loaded:", e);
    }
    
    parseQueryParams();
};

function parseQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('tech')) {
        let tech = urlParams.get('tech'); // 'em' or 'eh'
        let series = tech === 'em' ? 'SP-EM' : 'SP-EH';
        document.getElementById('seriesSelect').value = series;
        updateSubModels(); // This populates models for the series
    } else {
        updateSubModels();
    }
    
    if (urlParams.has('force')) {
        let force = parseFloat(urlParams.get('force'));
        autoSelectModelByForce(force);
        document.getElementById('targetForce').value = force;
        document.getElementById('targetForceSlider').value = force;
        document.getElementById('valForce').innerText = force + " kN";
    }
    
    if (urlParams.has('pressStroke')) {
        let press = urlParams.get('pressStroke');
        document.getElementById('pressStroke').value = press;
        document.getElementById('pressStrokeSlider').value = press;
        document.getElementById('valPress').innerText = press + " mm";
    }
    
    syncLimits(); // Recalculates fastStroke and triggers simulation
}

function autoSelectModelByForce(force) {
    let series = document.getElementById('seriesSelect').value;
    let availableModels = seriesModels[series];
    let selected = availableModels[0];
    for (let model of availableModels) {
        if (force <= limits[model].maxForce) {
            selected = model;
            break;
        }
    }
    document.getElementById('modelSelect').value = selected;
}

function goToConfigurator() {
    let force = document.getElementById('targetForce').value;
    let fastStroke = document.getElementById('fastStroke').value; 
    let pressStroke = document.getElementById('pressStroke').value;
    let series = document.getElementById('seriesSelect').value;
    let tech = series === 'SP-EM' ? 'em' : 'eh';
    
    let url = `https://smartpress-ebon.vercel.app/?force=${force}&fastStroke=${fastStroke}&pressStroke=${pressStroke}&tech=${tech}`;
    window.open(url, '_blank');
}
