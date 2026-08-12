// SmartPress Kinematic Engine & UI Sync
const dt = 0.001;
const t_acc = 0.25;

const limits = {
    'SP-EM12-15': { maxStroke: 300, maxForce: 15 },
    'SP-EH30-35': { maxStroke: 500, maxForce: 35 },
    'SP-EH65-80': { maxStroke: 500, maxForce: 80 }
};

function syncLimits() {
    const model = document.getElementById('modelSelect').value;
    const limit = limits[model];
    
    // Adjust sliders
    document.getElementById('fastStrokeSlider').max = limit.maxStroke;
    document.getElementById('targetForceSlider').max = limit.maxForce;
    
    // Validate current values
    let fastStr = parseFloat(document.getElementById('fastStroke').value);
    let force = parseFloat(document.getElementById('targetForce').value);
    
    if (fastStr > limit.maxStroke) {
        document.getElementById('fastStroke').value = limit.maxStroke;
        document.getElementById('fastStrokeSlider').value = limit.maxStroke;
        document.getElementById('valFast').innerText = limit.maxStroke + ' mm';
    }
    if (force > limit.maxForce) {
        document.getElementById('targetForce').value = limit.maxForce;
        document.getElementById('targetForceSlider').value = limit.maxForce;
        document.getElementById('valForce').innerText = limit.maxForce + ' kN';
    }
    runSimulation();
}

function syncInputs(sourceId, value) {
    if (sourceId.includes('Slider')) {
        let inputId = sourceId.replace('Slider', '');
        document.getElementById(inputId).value = value;
    } else {
        let sliderId = sourceId + 'Slider';
        document.getElementById(sliderId).value = value;
    }
    
    let unit = " mm";
    if (sourceId.includes('Force')) unit = " kN";
    if (sourceId.includes('rpm')) unit = " RPM";
    
    let valDisplayId = "val" + sourceId.replace('Slider', '').charAt(0).toUpperCase() + sourceId.replace('Slider', '').slice(1).replace('Stroke', '');
    let displayEl = document.getElementById(valDisplayId);
    if(displayEl) displayEl.innerText = value + unit;

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

function runSimulation() {
    let rpm = parseFloat(document.getElementById('rpm').value);
    // Linear speed assumption based on pitch (e.g. 5mm lead -> (RPM/60)*5)
    // Let's assume generic logic: Hızlı Yaklaşma = (rpm/60)*20, Arama=(rpm/60)*10, Algilama=10mm/s
    let v_fast = (rpm / 60.0) * 10; 
    let v_search = (rpm / 60.0) * 2; 
    let v_detect = 10.0; // fixed low speed
    let v_press = 5.0; // fixed low speed
    
    let fastStroke = parseFloat(document.getElementById('fastStroke').value);
    let searchStroke = parseFloat(document.getElementById('searchStroke').value);
    let detectStroke = parseFloat(document.getElementById('detectStroke').value);
    let pressStroke = parseFloat(document.getElementById('pressStroke').value);
    
    let phases = [
        { name: 'Hızlı Yaklaşma', stroke: fastStroke, v: v_fast, t_acc: 0.25, t_dec: 0.0, color: 'rgba(33, 150, 243, 0.3)' },
        { name: 'Temas Arama', stroke: searchStroke, v: v_search, t_acc: 0.25, t_dec: 0.0, color: 'rgba(255, 152, 0, 0.3)' },
        { name: 'Temas Algılama', stroke: detectStroke, v: v_detect, t_acc: 0.0, t_dec: 0.0, color: 'rgba(255, 193, 7, 0.3)' },
        { name: 'Kontrollü Presleme', stroke: pressStroke, v: v_press, t_acc: 0.0, t_dec: 0.0, color: 'rgba(244, 67, 54, 0.3)' },
        { name: 'Bekleme (0.5s)', stroke: 0, v: 0, t_acc: 0, t_dec: 0, color: 'rgba(156, 39, 176, 0.3)', is_wait: true, duration: 0.5 },
        { name: 'Kontrollü Geri Çekilme', stroke: (fastStroke+searchStroke+detectStroke+pressStroke), v: -v_fast, t_acc: 0.25, t_dec: 0.25, color: 'rgba(76, 175, 80, 0.3)', is_forward: false }
    ];
    
    let total_time = [];
    let total_vel = [];
    let total_pos = [];
    let shapes = [];
    let annotations = [];
    
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
        
        annotations.push({
            x: (start_t + global_t) / 2,
            y: 1.05,
            xref: 'x',
            yref: 'paper',
            text: phase.name,
            showarrow: false,
            font: { color: 'white', size: 10 },
            textangle: 0
        });
    }
    
    document.getElementById('resCycleTime').innerText = global_t.toFixed(2) + " sn";
    
    let trace1 = {
        x: total_time,
        y: total_vel,
        name: 'Hız (mm/s)',
        type: 'scatter',
        line: {color: '#ff4d4d', width: 2, dash: 'dash'}
    };
    
    let trace2 = {
        x: total_time,
        y: total_pos,
        name: 'Pozisyon (mm)',
        type: 'scatter',
        yaxis: 'y2',
        line: {color: 'white', width: 2}
    };
    
    let layout = {
        paper_bgcolor: '#0d1117',
        plot_bgcolor: '#0d1117',
        margin: {l: 60, r: 60, t: 40, b: 40},
        xaxis: { title: 'Zaman (s)', color: 'white', gridcolor: '#30363d' },
        yaxis: { 
            title: 'Hız (mm/s)', 
            color: '#ff4d4d', 
            gridcolor: '#30363d'
        },
        yaxis2: {
            title: 'Pozisyon (mm)',
            color: 'white',
            overlaying: 'y',
            side: 'right',
            gridcolor: 'transparent'
        },
        legend: { font: {color: 'white'}, orientation: 'h', y: -0.2 },
        shapes: shapes,
        annotations: annotations
    };
    
    Plotly.newPlot('chartDiv', [trace1, trace2], layout, {responsive: true});
}

// Initial Run
window.onload = function() {
    syncLimits();
};
