const iasInput = document.getElementById('ias-input'), altitudeInput = document.getElementById('altitude-input');
const qnhInput = document.getElementById('qnh-input'), deltaIsaInput = document.getElementById('delta-isa-input');

const tasValueDisplay = document.getElementById('tas-value');
const [radius30Display, radius45Display, radius60Display] = [document.getElementById('radius-30'), document.getElementById('radius-45'), document.getElementById('radius-60')];

const detailsContainer = document.getElementById('details-container');
const accordionTrigger = document.querySelector('.details-trigger');
const accordionContent = document.querySelector('.details-content');

const g = 9.81, KNOTS_TO_MS = 0.5144, METERS_TO_NM = 1852;
const T0_K = 288.15, P0_HPA = 1013.25, FT_PER_HPA = 27;

function getIsaTempInCelsius(altitudeFt) { return 15 - (2 * (altitudeFt / 1000)); }

function getPressureInHpa(pressureAltitudeFt) {
    return P0_HPA * Math.pow((1 - 0.0000068756 * pressureAltitudeFt), 5.2559);
}

function calculateFlightParams() {
    const ias = parseFloat(iasInput.value) || 0;
    const indicatedAltitudeFt = parseFloat(altitudeInput.value) || 0;
    const qnh = parseFloat(qnhInput.value) || P0_HPA;
    const deltaIsa = parseFloat(deltaIsaInput.value) || 0;

    const pressureAltitudeFt = indicatedAltitudeFt + (P0_HPA - qnh) * FT_PER_HPA;
    const isaTempCelsius = getIsaTempInCelsius(indicatedAltitudeFt);
    const oatCelsius = isaTempCelsius + deltaIsa;
    const oatKelvin = oatCelsius + 273.15;
    const pressureHpa = getPressureInHpa(pressureAltitudeFt);
    
    const pressureRatio = pressureHpa / P0_HPA;
    const tempRatio = oatKelvin / T0_K;
    const densityRatio = pressureRatio / tempRatio;

    const tas = ias / Math.sqrt(densityRatio);
    
    const [radius30, radius45, radius60] = [calculateTurnRadius(tas, 30), calculateTurnRadius(tas, 45), calculateTurnRadius(tas, 60)];

    updateMainDisplay(tas, radius30, radius45, radius60);
    updateCalculationDetails(ias, tas, densityRatio, radius45, indicatedAltitudeFt, qnh, pressureAltitudeFt, isaTempCelsius, deltaIsa, oatCelsius, pressureHpa, oatKelvin);
    
    if (accordionTrigger.classList.contains('active')) accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
}

function calculateTurnRadius(speedInKnots, bankAngleInDegrees) {
    if (speedInKnots <= 0) return 0;
    const speedInMs = speedInKnots * KNOTS_TO_MS;
    const bankAngleInRadians = bankAngleInDegrees * (Math.PI / 180);
    const tanPhi = Math.tan(bankAngleInRadians);
    if (tanPhi <= 0) return Infinity;
    return ((speedInMs ** 2) / (g * tanPhi)) / METERS_TO_NM;
}

function triggerUpdateAnimation(element) {
    element.classList.add('updated');
    setTimeout(() => element.classList.remove('updated'), 500);
}

function updateMainDisplay(tas, r30, r45, r60) {
    tasValueDisplay.innerHTML = `${tas.toFixed(0)} <small>kt</small>`;
    radius30Display.innerHTML = `${r30.toFixed(2)} <small>NM</small>`;
    radius45Display.innerHTML = `${r45.toFixed(2)} <small>NM</small>`;
    radius60Display.innerHTML = `${r60.toFixed(2)} <small>NM</small>`;
    
    triggerUpdateAnimation(tasValueDisplay);
    [radius30Display, radius45Display, radius60Display].forEach(el => triggerUpdateAnimation(el));
}

function updateCalculationDetails(ias, tas, densityRatio, radius45, altInd, qnh, altPres, isaTemp, deltaIsa, oat, pres, tempK) {
    detailsContainer.innerHTML = `
        <div class="detail-card">
            <div class="detail-header"><span class="icon"><i class="fa-solid fa-gauge-high"></i></span> 1. Pression Ambiante (P)</div>
            <div class="formula-line">Altitude Pression (PA) :<br><code><em>PA</em> = Alt Ind + ((<em>P<sub>0</sub></em> - <em>QNH</em>) * ${FT_PER_HPA})</code></div>
            <div class="formula-line"><code><em>PA</em> = ${altInd.toFixed(0)} + ((${P0_HPA} - ${qnh}) * ${FT_PER_HPA}) = <span class="result-highlight">${altPres.toFixed(0)} ft</span></code></div>
            <div class="formula-line">Pression Ambiante P à cette altitude pression :<br><code><em>P</em> = <span class="result-highlight">${pres.toFixed(1)} hPa</span></code></div>
        </div>
        <div class="detail-card">
            <div class="detail-header"><span class="icon"><i class="fa-solid fa-temperature-half"></i></span> 2. Température Ambiante (T)</div>
            <div class="formula-line">Température ISA (OAT<sub>ISA</sub>) à l'altitude indiquée :<br><code><em>OAT<sub>ISA</sub></em> = 15 - (2 * (${altInd.toFixed(0)} / 1000)) = <span class="result-highlight">${isaTemp.toFixed(1)} °C</span></code></div>
            <div class="formula-line">Température Actuelle (OAT) :<br><code><em>OAT</em> = ${isaTemp.toFixed(1)} + (${deltaIsa.toFixed(1)}) = <span class="result-highlight">${oat.toFixed(1)} °C</span> ou <span class="result-highlight">${tempK.toFixed(1)} K</span></code></div>
        </div>
        <div class="detail-card">
            <div class="detail-header"><span class="icon"><i class="fa-solid fa-atom"></i></span> 3. Rapport de Densité (σ)</div>
            <div class="formula-line">Formule : <code><em>σ</em> = (<em>P</em>/<em>P<sub>0</sub></em>) / (<em>T</em>/<em>T<sub>0</sub></em>)</code></div>
            <div class="constants">Avec P<sub>0</sub> = ${P0_HPA} hPa et T<sub>0</sub> = ${T0_K} K</div>
            <div class="formula-line">Application :<br><code><em>σ</em> = (${pres.toFixed(1)} / ${P0_HPA}) / (${tempK.toFixed(1)} / ${T0_K}) = <span class="result-highlight">${densityRatio.toFixed(3)}</span></code></div>
        </div>
        <div class="detail-card">
            <div class="detail-header"><span class="icon"><i class="fa-solid fa-plane-up"></i></span> 4. Vitesse Vraie (TAS)</div>
            <div class="formula-line">Formule : <code><em>TAS</em> = <em>IAS</em> / √(<em>σ</em>)</code></div>
            <div class="formula-line">Application :<br><code><em>TAS</em> = ${ias} / √(${densityRatio.toFixed(3)}) = <span class="result-highlight">${tas.toFixed(1)} kt</span></code></div>
        </div>
        <div class="detail-card">
            <div class="detail-header"><span class="icon"><i class="fa-solid fa-arrows-turn-to-dots"></i></span> 5. Rayon de Virage (Ex: 45°)</div>
            <div class="formula-line">Application :<br><code><em>R<sub>45°</sub></em> = ( (${tas.toFixed(1)} * ${KNOTS_TO_MS})<sup>2</sup> / (${g} * tan(45°)) ) / ${METERS_TO_NM} = <span class="result-highlight">${radius45.toFixed(2)} NM</span></code></div>
        </div>
    `;
}

const inputs = [iasInput, altitudeInput, qnhInput, deltaIsaInput];
inputs.forEach(input => input.addEventListener('input', calculateFlightParams));

accordionTrigger.addEventListener('click', function() {
    this.classList.toggle('active');
    this.querySelector('.icon i').classList.toggle('fa-chevron-down');
    this.querySelector('.icon i').classList.toggle('fa-chevron-up');
    if (accordionContent.style.maxHeight) {
        accordionContent.style.maxHeight = null;
    } else {
        accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
    } 
});

window.addEventListener('load', calculateFlightParams);