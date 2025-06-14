document.addEventListener('DOMContentLoaded', () => {
    const checklistTitle = document.getElementById('checklist-title');
    const checklistContainer = document.getElementById('checklist-container');
    const resetButton = document.getElementById('reset-button');

    // 1. Lire l'ID de la checklist depuis l'URL (ex: ?id=checklist1)
    const params = new URLSearchParams(window.location.search);
    const checklistId = params.get('id');

    if (!checklistId) {
        checklistTitle.textContent = "Erreur";
        checklistContainer.innerHTML = `<p class="checklist-note">Aucune checklist spécifiée.</p>`;
        return;
    }
    
    const storageKey = `checklistState_${checklistId}`;

    // 2. Charger et afficher la checklist
    const loadChecklist = () => {
        try {
            if (typeof checklistData === 'undefined') {
                throw new Error("Les données des checklists (checklist_data.js) sont manquantes.");
            }

            const data = checklistData[checklistId];
            if (!data) {
                throw new Error(`La checklist avec l'ID '${checklistId}' n'a pas été trouvée.`);
            }

            renderChecklist(data);
            loadState();
        } catch (error) {
            console.error("Erreur de chargement de la checklist:", error);
            checklistTitle.textContent = "Erreur";
            checklistContainer.innerHTML = `<p class="checklist-note">Impossible de charger la checklist. ${error.message}</p>`;
        }
    };

    // 3. Générer le HTML de la checklist depuis les données
    const renderChecklist = (data) => {
        checklistContainer.innerHTML = ''; // Vider le conteneur
        let titleSet = false;

        data.forEach(item => {
            switch (item.type) {
                case 'header':
                    if (!titleSet) {
                        checklistTitle.textContent = item.text;
                        titleSet = true;
                    } else {
                        const headerEl = document.createElement('h3');
                        headerEl.className = 'checklist-section-header';
                        headerEl.textContent = item.text;
                        checklistContainer.appendChild(headerEl);
                    }
                    break;
                case 'item':
                    const itemEl = document.createElement('div');
                    itemEl.className = 'checklist-item';
                    
                    const labelEl = document.createElement('label');
                    labelEl.htmlFor = item.id;

                    const checkboxEl = document.createElement('input');
                    checkboxEl.type = 'checkbox';
                    checkboxEl.id = item.id;
                    checkboxEl.dataset.id = item.id; // Pour retrouver l'ID facilement

                    const textEl = document.createElement('span');
                    textEl.textContent = item.text;

                    labelEl.appendChild(checkboxEl);
                    labelEl.appendChild(textEl);
                    itemEl.appendChild(labelEl);
                    checklistContainer.appendChild(itemEl);
                    break;
                case 'note':
                    const noteEl = document.createElement('p');
                    noteEl.className = 'checklist-note';
                    noteEl.textContent = item.text;
                    checklistContainer.appendChild(noteEl);
                    break;
            }
        });
    };

    // 4. Gérer la sauvegarde et le chargement de l'état (coché/décoché)
    const saveState = () => {
        const checkboxes = checklistContainer.querySelectorAll('input[type="checkbox"]');
        const state = {};
        checkboxes.forEach(cb => {
            state[cb.dataset.id] = cb.checked;
        });
        localStorage.setItem(storageKey, JSON.stringify(state));
    };

    const loadState = () => {
        const savedState = JSON.parse(localStorage.getItem(storageKey));
        if (savedState) {
            Object.keys(savedState).forEach(itemId => {
                const checkbox = document.getElementById(itemId);
                if (checkbox) {
                    checkbox.checked = savedState[itemId];
                    // Appliquer le style au chargement
                    checkbox.closest('label').classList.toggle('checked', checkbox.checked);
                }
            });
        }
    };

    const resetState = () => {
        localStorage.removeItem(storageKey);
        // Décocher toutes les cases visuellement
        const checkboxes = checklistContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = false;
            cb.closest('label').classList.remove('checked');
        });
        // Sauvegarder l'état vide
        saveState();
    };
    
    // 5. Attacher les écouteurs d'événements
    checklistContainer.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            // Appliquer le style au clic
            e.target.closest('label').classList.toggle('checked', e.target.checked);
            saveState();
        }
    });

    resetButton.addEventListener('click', resetState);

    // Démarrer le processus
    loadChecklist();
});