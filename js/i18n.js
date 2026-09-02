const translations = {
    tr: {
        "app_title": "SmartPress Kinematik Dashboard",
        "app_subtitle": "İnteraktif Hareket Profili Simülasyonu",
        "form_title_app": "Mekanik Limitler ve Modeller",
        "lbl_series": "SmartPress Serisi",
        "lbl_model": "SmartPress Modeli",
        "lbl_force": "Hedef Baskı Kuvveti",
        "lbl_total_stroke": "Kullanılacak Toplam Strok",
        "lbl_kinematics": "Kinematik Fazlar (dt=0.001s, a=0.25s rampa)",
        "lbl_fast_stroke": "Hızlı Yaklaşma Stroku (Otomatik)",
        "lbl_search_stroke": "Temas Arama Stroku",
        "lbl_detect_stroke": "Temas Algılama Stroku",
        "lbl_press_stroke": "Kontrollü Presleme Stroku",
        "lbl_rpm": "Servo Motor Hızı (RPM)",
        "btn_reset": "Varsayılan Değerlere Dön",
        "btn_goto_config": "Satış Konfigüratörüne Git",
        "res_title": "Dinamik Kinematik Grafiği",
        "res_cycle": "Tahmini Çevrim Süresi (Kinematik)",
        "opt_eh_series": "SP-EH Serisi (Max 500mm Strok)",
        "opt_em_series": "SP-EM Serisi (Max 500mm Strok)",
        "opt_std_stroke": "Standart Maks. Strok",
        "opt_opt_stroke": "Opsiyonel Maks. Strok (750 mm)"
    },
    en: {
        "app_title": "SmartPress Kinematic Dashboard",
        "app_subtitle": "Interactive Motion Profile Simulation",
        "form_title_app": "Mechanical Limits and Models",
        "lbl_series": "SmartPress Series",
        "lbl_model": "SmartPress Model",
        "lbl_force": "Target Press Force",
        "lbl_total_stroke": "Total Stroke to Use",
        "lbl_kinematics": "Kinematic Phases (dt=0.001s, a=0.25s ramp)",
        "lbl_fast_stroke": "Fast Approach Stroke (Auto)",
        "lbl_search_stroke": "Contact Search Stroke",
        "lbl_detect_stroke": "Contact Detect Stroke",
        "lbl_press_stroke": "Controlled Press Stroke",
        "lbl_rpm": "Servo Motor Speed (RPM)",
        "btn_reset": "Reset to Defaults",
        "btn_goto_config": "Go to Sales Configurator",
        "res_title": "Dynamic Kinematic Chart",
        "res_cycle": "Estimated Cycle Time (Kinematic)",
        "opt_eh_series": "SP-EH Series (Max 500mm Stroke)",
        "opt_em_series": "SP-EM Series (Max 500mm Stroke)",
        "opt_std_stroke": "Standard Max Stroke",
        "opt_opt_stroke": "Optional Max Stroke (750 mm)"
    }
};

let currentLanguage = 'tr';

function setLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    
    // Update active button state
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (document.getElementById('btn' + lang.charAt(0).toUpperCase() + lang.slice(1))) {
        document.getElementById('btn' + lang.charAt(0).toUpperCase() + lang.slice(1)).classList.add('active');
    }
    
    // Update all static text with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });
    
    // Also trigger dynamic updates
    if (typeof updateSubModels === 'function') updateSubModels();
    if (typeof syncLimits === 'function') syncLimits();
}

function t(key) {
    return translations[currentLanguage][key] || key;
}
