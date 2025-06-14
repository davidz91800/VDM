// ----- SCRIPT LOGIC (les données sont dans performance_data.js) -----

// DOM Element References
const isaSelect = document.getElementById('isa-range');
const altitudeSelect = document.getElementById('altitude');
const massInput = document.getElementById('mass');
const calculateButton = document.getElementById('calculate-button');
const mainResultPanel = document.getElementById('main-result-panel');
const detailsPanel = document.getElementById('details-panel');

// Populate dropdowns on page load
document.addEventListener('DOMContentLoaded', () => {
    if (typeof performanceData === 'undefined') {
        console.error("Erreur: Le fichier performance_data.js n'a pas pu être chargé.");
        displayError(mainResultPanel, "Erreur critique : les données de performance sont manquantes.");
        return;
    }

    const isaRanges = Object.keys(performanceData);
    isaRanges.forEach(range => {
        const option = document.createElement('option');
        option.value = range;
        option.textContent = range;
        isaSelect.appendChild(option);
    });
    isaSelect.value = "ISA -5°C to +5°C";

    for (let i = 3; i <= 38; i++) {
        const option = document.createElement('option');
        const altFt = i * 1000;
        option.value = altFt;
        option.textContent = `${altFt.toLocaleString()} ft`;
        if (i === 20) option.selected = true;
        altitudeSelect.appendChild(option);
    }
    
    calculateButton.addEventListener('click', calculateROC);
});

function getInterpolatedPerformance(isaRange, mass, altitude) {
    const altKey = (altitude / 1000).toString();
    const isaData = performanceData[isaRange];
    if (!isaData) return null;

    const weightKeys = Object.keys(isaData).map(Number).sort((a, b) => a - b);
    let lowerWeightKey, upperWeightKey;
    const targetWeight = mass / 1000;

    if (targetWeight <= weightKeys[0]) {
        lowerWeightKey = upperWeightKey = weightKeys[0];
    } else if (targetWeight >= weightKeys[weightKeys.length - 1]) {
        lowerWeightKey = upperWeightKey = weightKeys[weightKeys.length - 1];
    } else {
        for (let i = 0; i < weightKeys.length - 1; i++) {
            if (targetWeight >= weightKeys[i] && targetWeight <= weightKeys[i+1]) {
                lowerWeightKey = weightKeys[i];
                upperWeightKey = weightKeys[i+1];
                break;
            }
        }
    }
    
    if (!lowerWeightKey || !upperWeightKey) return null;

    const lowerData = isaData[lowerWeightKey.toString()]?.[altKey];
    const upperData = isaData[upperWeightKey.toString()]?.[altKey];

    if (!lowerData || !upperData || lowerData.tas === null || upperData.tas === null) return null; 

    if (lowerWeightKey === upperWeightKey) return lowerData;

    const massRatio = (targetWeight - lowerWeightKey) / (upperWeightKey - lowerWeightKey);

    return {
        tas: lowerData.tas + massRatio * (upperData.tas - lowerData.tas),
        fuel: lowerData.fuel + massRatio * (upperData.fuel - lowerData.fuel),
        time: lowerData.time + massRatio * (upperData.time - lowerData.time)
    };
}

function displayError(panel, message) {
    panel.innerHTML = `<div class="detail-card" style="border-color: #c0392b;"><div class="formula-line" style="color: #c0392b; text-align: center;">${message}</div></div>`;
    panel.style.display = 'block';
}

function calculateROC() {
    mainResultPanel.style.display = 'none';
    detailsPanel.style.display = 'none';

    const selectedISA = isaSelect.value;
    const refAltitude = parseInt(altitudeSelect.value, 10);
    const mass = parseInt(massInput.value, 10);

    if (isNaN(mass) || mass < 85000 || mass > 175000) {
        displayError(mainResultPanel, "Erreur : La masse doit être comprise entre 85 000 et 175 000 lbs.");
        return;
    }

    const lowAltitude = refAltitude - 2000;
    const highAltitude = refAltitude + 2000;

    const perfLow = getInterpolatedPerformance(selectedISA, mass, lowAltitude);
    const perfHigh = getInterpolatedPerformance(selectedISA, mass, highAltitude);

    if (!perfLow || !perfHigh) {
        displayError(mainResultPanel, `Données non disponibles pour la plage d'altitude (${lowAltitude.toLocaleString()} ft - ${highAltitude.toLocaleString()} ft). L'avion a probablement atteint son plafond de performance.`);
        return;
    }

    const deltaTime = perfHigh.time - perfLow.time;
    if (deltaTime <= 0) {
        displayError(mainResultPanel, "Erreur de calcul. Le temps de montée est nul ou négatif, indiquant un plafond de performance.");
        return;
    }
    
    const deltaFuel = perfHigh.fuel - perfLow.fuel;
    const avgTAS = (perfHigh.tas + perfLow.tas) / 2;
    const distanceNM = avgTAS * (deltaTime / 60);
    const roc_ft_nm = 4000 / distanceNM;

    // --- Populate MAIN result panel ---
    mainResultPanel.innerHTML = `
        <div class="tas-result" style="margin-bottom: 0;">
             <h3 style="font-weight:400;margin:0 0 10px 0;color:var(--text-muted-color);text-transform:uppercase;letter-spacing:2px;font-size:0.9em;">Gradient de Montée</h3>
             <div style="font-size: 3.5em; color: var(--primary-color); font-family: 'Orbitron', sans-serif;">
                ${roc_ft_nm.toFixed(1)} <small style="font-size: 0.5em;">ft/NM</small>
             </div>
        </div>
    `;
    mainResultPanel.style.display = 'block';

    // --- Populate DETAILS panel ---
    detailsPanel.innerHTML = `
        <div class="detail-card">
            <div class="detail-header"><span class="icon"><i class="fa-solid fa-circle-info"></i></span>Paramètres de calcul</div>
            <div class="formula-line">Condition ISA : <code>${selectedISA}</code></div>
            <div class="formula-line">Altitude de référence : <code>${refAltitude.toLocaleString()} ft</code></div>
            <div class="formula-line">Masse : <code>${mass.toLocaleString()} lbs</code></div>
            <div class="formula-line">Tranche d'altitude : <code>${lowAltitude.toLocaleString()} ft → ${highAltitude.toLocaleString()} ft</code></div>
        </div>

        <div class="detail-card">
            <div class="detail-header"><span class="icon"><i class="fa-solid fa-arrow-down"></i></span>Données au point bas (${lowAltitude.toLocaleString()} ft)</div>
            <div class="formula-line">Temps cumulé : <code>${perfLow.time.toFixed(2)} min</code></div>
            <div class="formula-line">Vitesse TAS : <code>${perfLow.tas.toFixed(2)} KT</code></div>
        </div>

        <div class="detail-card">
            <div class="detail-header"><span class="icon"><i class="fa-solid fa-arrow-up"></i></span>Données au point haut (${highAltitude.toLocaleString()} ft)</div>
            <div class="formula-line">Temps cumulé : <code>${perfHigh.time.toFixed(2)} min</code></div>
            <div class="formula-line">Vitesse TAS : <code>${perfHigh.tas.toFixed(2)} KT</code></div>
        </div>
        
        <div class="detail-card">
            <div class="detail-header"><span class="icon"><i class="fa-solid fa-calculator"></i></span>Calculs pour la tranche</div>
            <div class="formula-line">Temps pour monter 4000 ft (Δt) : <code>${deltaTime.toFixed(2)} min</code></div>
            <div class="formula-line">Carburant consommé (Δf) : <code>${deltaFuel.toFixed(2)} lbs</code></div>
            <div class="formula-line">Vitesse moyenne (V) : <code>${avgTAS.toFixed(2)} KTAS</code></div>
            <div class="formula-line">Distance parcourue (D) : <code>${distanceNM.toFixed(2)} NM</code></div>
        </div>

        <!-- MODIFICATION: Ajout de l'encart explicatif de la formule -->
        <div class="detail-card">
            <div class="detail-header"><span class="icon"><i class="fa-solid fa-square-root-variable"></i></span>Détail de la formule du Gradient</div>
            <div class="formula-line">Le gradient est le rapport entre la distance verticale et la distance horizontale.</div>
            <div class="formula-line"><code><em>Gradient (ft/NM)</em> = Distance Verticale / Distance Horizontale</code></div>
            <div class="formula-line">1. La distance verticale est fixe : <code>4000 ft</code>.</div>
            <div class="formula-line">2. La distance horizontale est calculée avec la vitesse moyenne et le temps de montée :</div>
            <div class="formula-line"><code><em>Distance (NM)</em> = Vitesse Moyenne (kt) × (Δt (min) / 60)</code></div>
            <div class="formula-line">Application finale :<br><code><em>Gradient</em> = 4000 / ${distanceNM.toFixed(2)} = <span class="result-highlight">${roc_ft_nm.toFixed(1)} ft/NM</span></code></div>
        </div>
    `;
    detailsPanel.style.display = 'block';
}