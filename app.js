/* ===== EcoHuella — App Logic ===== */

(() => {
  'use strict';

  // ===== DOM REFERENCES =====
  const screens = document.querySelectorAll('.screen');
  const dots = document.querySelectorAll('.dot');
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');

  // Screen 1
  const btnCalcular = document.getElementById('btn-calcular');

  // Screen 2
  const form = document.getElementById('eco-form');
  const inputKm = document.getElementById('input-km');
  const inputKwh = document.getElementById('input-kwh');
  const inputAgua = document.getElementById('input-agua');
  const dietBtns = document.querySelectorAll('.diet-btn');
  const btnBackDatos = document.getElementById('btn-back-datos');

  // Screen 3
  const gaugeFill = document.getElementById('gauge-fill');
  const gaugeValue = document.getElementById('gauge-value');
  const levelBadge = document.getElementById('level-badge');
  const levelIcon = document.getElementById('level-icon');
  const levelText = document.getElementById('level-text');
  const breakdownAuto = document.getElementById('breakdown-auto');
  const breakdownElec = document.getElementById('breakdown-elec');
  const breakdownAguaEl = document.getElementById('breakdown-agua');
  const breakdownDieta = document.getElementById('breakdown-dieta');
  const barAuto = document.getElementById('bar-auto');
  const barElec = document.getElementById('bar-elec');
  const barAgua = document.getElementById('bar-agua');
  const barDieta = document.getElementById('bar-dieta');
  const btnRecomendaciones = document.getElementById('btn-recomendaciones');
  const btnBackResultado = document.getElementById('btn-back-resultado');

  // Screen 4
  const recoGrid = document.getElementById('reco-grid');
  const btnRestart = document.getElementById('btn-restart');
  const btnBackReco = document.getElementById('btn-back-reco');

  // ===== STATE =====
  let currentScreen = 0;
  let selectedDiet = null;
  let dietFactor = 0;
  let results = { auto: 0, elec: 0, agua: 0, dieta: 0, total: 0 };

  // ===== CO₂ FACTORS =====
  const FACTORS = {
    auto: 0.21,    // kg CO₂ per km
    elec: 0.40,    // kg CO₂ per kWh
    agua: 0.30     // kg CO₂ per m³
  };

  // ===== PARTICLES BACKGROUND =====
  const particles = [];
  const PARTICLE_COUNT = 50;

  function initCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: -Math.random() * 0.4 - 0.1,
        opacity: Math.random() * 0.4 + 0.1,
        pulse: Math.random() * Math.PI * 2
      });
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.pulse += 0.015;

      const dynamicOpacity = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));

      if (p.y < -10) {
        p.y = canvas.height + 10;
        p.x = Math.random() * canvas.width;
      }
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(52, 211, 153, ${dynamicOpacity})`;
      ctx.fill();
    });

    requestAnimationFrame(animateParticles);
  }

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  initCanvas();
  animateParticles();

  // ===== SCREEN NAVIGATION =====
  function navigateTo(index) {
    if (index === currentScreen || index < 0 || index >= screens.length) return;

    const currentEl = screens[currentScreen];
    const nextEl = screens[index];

    // Determine direction
    const goingForward = index > currentScreen;

    // Exit current
    currentEl.classList.remove('active');
    if (goingForward) {
      currentEl.classList.add('exit-up');
    }

    // Show next
    setTimeout(() => {
      currentEl.classList.remove('exit-up');
      nextEl.classList.add('active');
    }, goingForward ? 100 : 50);

    // Update dots
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === index);
    });

    currentScreen = index;
  }

  // Nav dots click
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const target = parseInt(dot.dataset.screen);
      // Only allow navigating back, not forward (must go through the flow)
      if (target <= currentScreen) {
        navigateTo(target);
      }
    });
  });

  // ===== SCREEN 1 EVENTS =====
  btnCalcular.addEventListener('click', () => navigateTo(1));

  // ===== SCREEN 2 EVENTS =====
  btnBackDatos.addEventListener('click', () => navigateTo(0));

  // Diet selection
  dietBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dietBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedDiet = btn.dataset.diet;
      dietFactor = parseFloat(btn.dataset.factor);
    });
  });

  // Live CO₂ preview
  function updatePreview(inputEl, factor, previewId) {
    const val = parseFloat(inputEl.value) || 0;
    const co2 = val * factor;
    const preview = document.querySelector(`#${previewId} .co2-value`);
    preview.textContent = co2.toFixed(2) + ' kg';
    preview.style.color = co2 > 0 ? 'var(--clr-emerald-400)' : 'var(--clr-text-muted)';
  }

  inputKm.addEventListener('input', () => updatePreview(inputKm, FACTORS.auto, 'preview-km'));
  inputKwh.addEventListener('input', () => updatePreview(inputKwh, FACTORS.elec, 'preview-kwh'));
  inputAgua.addEventListener('input', () => updatePreview(inputAgua, FACTORS.agua, 'preview-agua'));

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const km = parseFloat(inputKm.value) || 0;
    const kwh = parseFloat(inputKwh.value) || 0;
    const agua = parseFloat(inputAgua.value) || 0;

    if (!selectedDiet) {
      // Flash the diet section
      const dietSection = document.querySelector('.diet-options');
      dietSection.style.outline = '2px solid var(--clr-red-400)';
      dietSection.style.outlineOffset = '4px';
      setTimeout(() => {
        dietSection.style.outline = 'none';
      }, 1500);
      return;
    }

    // Calculate
    results.auto = km * FACTORS.auto;
    results.elec = kwh * FACTORS.elec;
    results.agua = agua * FACTORS.agua;
    results.dieta = dietFactor;   // kg CO₂ per week from diet type
    results.total = results.auto + results.elec + results.agua + results.dieta;

    showResults();
    navigateTo(2);
  });

  // ===== SCREEN 3: DISPLAY RESULTS =====
  function showResults() {
    const total = results.total;

    // Animate gauge value
    animateValue(gaugeValue, 0, total, 1500);

    // Gauge fill (max ~534 circumference, cap at 300 kg for full circle)
    const circumference = 534;
    const maxCO2 = 300;
    const pct = Math.min(total / maxCO2, 1);
    const offset = circumference - (pct * circumference);

    // Add SVG gradient
    addGaugeGradient(total);

    setTimeout(() => {
      gaugeFill.style.strokeDashoffset = offset;
    }, 200);

    // Level
    let level, icon, className;
    if (total < 50) {
      level = 'Bajo'; icon = '🟢'; className = 'low';
    } else if (total < 150) {
      level = 'Medio'; icon = '🟡'; className = 'medium';
    } else {
      level = 'Alto'; icon = '🔴'; className = 'high';
    }

    levelBadge.className = 'level-badge ' + className;
    levelIcon.textContent = icon;
    levelText.textContent = `Nivel ${level}`;

    // Breakdown values
    breakdownAuto.textContent = results.auto.toFixed(1) + ' kg';
    breakdownElec.textContent = results.elec.toFixed(1) + ' kg';
    breakdownAguaEl.textContent = results.agua.toFixed(1) + ' kg';
    breakdownDieta.textContent = results.dieta.toFixed(1) + ' kg';

    // Breakdown bars
    const maxComponent = Math.max(results.auto, results.elec, results.agua, results.dieta, 1);
    setTimeout(() => {
      barAuto.style.width = (results.auto / maxComponent * 100) + '%';
      barElec.style.width = (results.elec / maxComponent * 100) + '%';
      barAgua.style.width = (results.agua / maxComponent * 100) + '%';
      barDieta.style.width = (results.dieta / maxComponent * 100) + '%';
    }, 400);
  }

  function addGaugeGradient(total) {
    const svg = document.querySelector('.gauge-svg');
    let existingDefs = svg.querySelector('defs');
    if (!existingDefs) {
      existingDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.insertBefore(existingDefs, svg.firstChild);
    }

    let color1, color2;
    if (total < 50) {
      color1 = '#34d399'; color2 = '#10b981';
    } else if (total < 150) {
      color1 = '#fbbf24'; color2 = '#f59e0b';
    } else {
      color1 = '#f87171'; color2 = '#ef4444';
    }

    existingDefs.innerHTML = `
      <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${color1}"/>
        <stop offset="100%" stop-color="${color2}"/>
      </linearGradient>
    `;

    gaugeFill.setAttribute('stroke', 'url(#gaugeGradient)');
  }

  function animateValue(el, start, end, duration) {
    const startTime = performance.now();
    const diff = end - start;

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      el.textContent = current.toFixed(1);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // ===== SCREEN 3 EVENTS =====
  btnBackResultado.addEventListener('click', () => {
    resetGauge();
    navigateTo(1);
  });

  btnRecomendaciones.addEventListener('click', () => {
    generateRecommendations();
    navigateTo(3);
  });

  function resetGauge() {
    gaugeFill.style.strokeDashoffset = '534';
    barAuto.style.width = '0%';
    barElec.style.width = '0%';
    barAgua.style.width = '0%';
    barDieta.style.width = '0%';
  }

  // ===== SCREEN 4: RECOMMENDATIONS =====
  const RECOMMENDATIONS = {
    transport: [
      {
        icon: '🚲',
        title: 'Usa la bicicleta',
        desc: 'Para distancias cortas, la bicicleta es una excelente alternativa libre de emisiones.',
        saving: 'Ahorra ~2.1 kg CO₂ por cada 10 km'
      },
      {
        icon: '🚌',
        title: 'Transporte público',
        desc: 'Reduce tu huella significativamente usando autobuses o metro en lugar del auto.',
        saving: 'Reduce hasta 65% de emisiones'
      },
      {
        icon: '🚗',
        title: 'Comparte el viaje',
        desc: 'El carpooling divide las emisiones entre los pasajeros de un mismo trayecto.',
        saving: 'Ahorra 50% o más de CO₂'
      },
      {
        icon: '🔌',
        title: 'Auto eléctrico',
        desc: 'Si necesitas auto, considera un vehículo eléctrico o híbrido.',
        saving: 'Reduce hasta 70% de emisiones'
      }
    ],
    electricity: [
      {
        icon: '💡',
        title: 'Focos LED',
        desc: 'Cambia a iluminación LED, consume hasta 80% menos energía.',
        saving: 'Ahorra ~0.4 kg CO₂ por foco/mes'
      },
      {
        icon: '🌞',
        title: 'Energía solar',
        desc: 'Instala paneles solares para generar tu propia energía limpia.',
        saving: 'Reduce hasta 90% de emisiones'
      },
      {
        icon: '🔌',
        title: 'Desconecta equipos',
        desc: 'Los aparatos en standby consumen energía innecesariamente. Desenchúfalos.',
        saving: 'Ahorra ~5-10% de tu consumo'
      },
      {
        icon: '❄️',
        title: 'Climatización eficiente',
        desc: 'Usa el aire acondicionado a 24°C y aísla ventanas y puertas.',
        saving: 'Reduce hasta 30% en climatización'
      }
    ],
    water: [
      {
        icon: '🚿',
        title: 'Duchas cortas',
        desc: 'Reduce tu tiempo de ducha a 5 minutos para ahorrar agua y energía.',
        saving: 'Ahorra ~45 litros por ducha'
      },
      {
        icon: '🔧',
        title: 'Repara fugas',
        desc: 'Un grifo que gotea pierde hasta 30 litros de agua por día.',
        saving: 'Ahorra ~10,000 litros al año'
      },
      {
        icon: '🌧️',
        title: 'Reutiliza agua',
        desc: 'Recoge agua de lluvia para regar plantas o limpiar pisos.',
        saving: 'Reduce consumo hasta 30%'
      }
    ],
    food: [
      {
        icon: '🥗',
        title: 'Más vegetales',
        desc: 'Incorpora más frutas y verduras. Un día sin carne a la semana marca la diferencia.',
        saving: 'Ahorra ~1.5 kg CO₂ por día'
      },
      {
        icon: '🏪',
        title: 'Compra local',
        desc: 'Los alimentos locales no requieren transporte de larga distancia.',
        saving: 'Reduce hasta 25% de emisiones'
      },
      {
        icon: '🗑️',
        title: 'Evita el desperdicio',
        desc: 'Planifica tus comidas para no desperdiciar alimentos innecesariamente.',
        saving: 'Ahorra ~2 kg CO₂ por semana'
      }
    ]
  };

  function generateRecommendations() {
    const cards = [];

    // Always show top recommendations personalized by highest-emission category
    const categories = [
      { key: 'transport', value: results.auto, recos: RECOMMENDATIONS.transport },
      { key: 'electricity', value: results.elec, recos: RECOMMENDATIONS.electricity },
      { key: 'water', value: results.agua, recos: RECOMMENDATIONS.water },
      { key: 'food', value: results.dieta, recos: RECOMMENDATIONS.food }
    ];

    // Sort by highest impact
    categories.sort((a, b) => b.value - a.value);

    // Pick top 2 recs from highest category, 1 from second and third
    const topCat = categories[0];
    const secondCat = categories[1];
    const thirdCat = categories[2];
    const fourthCat = categories[3];

    cards.push(...topCat.recos.slice(0, 2));
    cards.push(secondCat.recos[0]);
    cards.push(thirdCat.recos[0]);

    // If total is high, add more
    if (results.total >= 100) {
      cards.push(secondCat.recos[1] || fourthCat.recos[0]);
      cards.push(fourthCat.recos[0] || thirdCat.recos[1]);
    }

    // Render
    recoGrid.innerHTML = cards.map((card, i) => `
      <div class="reco-card" style="--delay: ${0.1 + i * 0.1}s">
        <div class="reco-card-icon">${card.icon}</div>
        <h3>${card.title}</h3>
        <p>${card.desc}</p>
        <div class="reco-saving">🌿 ${card.saving}</div>
      </div>
    `).join('');
  }

  // ===== SCREEN 4 EVENTS =====
  btnBackReco.addEventListener('click', () => navigateTo(2));

  btnRestart.addEventListener('click', () => {
    // Reset form
    form.reset();
    dietBtns.forEach(b => b.classList.remove('selected'));
    selectedDiet = null;
    dietFactor = 0;

    // Reset previews
    document.querySelectorAll('.co2-value').forEach(el => {
      el.textContent = '0.00 kg';
      el.style.color = 'var(--clr-text-muted)';
    });

    // Reset gauge
    resetGauge();
    gaugeValue.textContent = '0';

    // Go to start
    navigateTo(0);
  });

})();
