// Custom GPT References Manager
class GPTManager {
    constructor() {
        this.gpts = [];
        this.selectedId = null;
        this.storageKey = 'customGPTReferences';
        this.selectedKey = 'selectedGPTId';

        this.init();
    }

    init() {
        // Charger les données depuis localStorage
        this.loadFromStorage();

        // Initialiser les event listeners
        this.initEventListeners();

        // Rendre l'interface
        this.render();
    }

    initEventListeners() {
        // Formulaire d'ajout
        const form = document.getElementById('addForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGPT();
        });
    }

    addGPT() {
        const name = document.getElementById('gptName').value.trim();
        const ref = document.getElementById('gptRef').value.trim();
        const description = document.getElementById('gptDescription').value.trim();

        if (!name || !ref) {
            alert('Le nom et la référence sont obligatoires');
            return;
        }

        const newGPT = {
            id: this.generateId(),
            name,
            ref,
            description,
            createdAt: new Date().toISOString()
        };

        this.gpts.push(newGPT);
        this.saveToStorage();
        this.render();

        // Réinitialiser le formulaire
        document.getElementById('addForm').reset();

        // Animation de confirmation
        this.showNotification('✓ Référence ajoutée avec succès', 'success');
    }

    removeGPT(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette référence ?')) {
            return;
        }

        this.gpts = this.gpts.filter(gpt => gpt.id !== id);

        // Si c'était la référence sélectionnée, la désélectionner
        if (this.selectedId === id) {
            this.selectedId = null;
        }

        this.saveToStorage();
        this.render();

        this.showNotification('✓ Référence supprimée', 'success');
    }

    selectGPT(id) {
        this.selectedId = id;
        this.saveToStorage();
        this.render();

        this.showNotification('✓ Référence sélectionnée', 'success');
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.gpts));
            localStorage.setItem(this.selectedKey, this.selectedId || '');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde des données');
        }
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            const selectedStored = localStorage.getItem(this.selectedKey);

            if (stored) {
                this.gpts = JSON.parse(stored);
            }

            if (selectedStored) {
                this.selectedId = selectedStored || null;
            }
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            this.gpts = [];
            this.selectedId = null;
        }
    }

    render() {
        this.renderList();
        this.renderSelected();
        this.updateCount();
    }

    renderList() {
        const listContainer = document.getElementById('gptList');
        const emptyState = document.getElementById('emptyState');

        if (this.gpts.length === 0) {
            listContainer.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        listContainer.innerHTML = this.gpts.map(gpt => this.renderGPTItem(gpt)).join('');
    }

    renderGPTItem(gpt) {
        const isSelected = gpt.id === this.selectedId;
        const date = new Date(gpt.createdAt).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="gpt-item ${isSelected ? 'selected' : ''}" data-id="${gpt.id}">
                <div class="gpt-item-header">
                    <div class="gpt-item-title">
                        <div class="gpt-item-name">${this.escapeHtml(gpt.name)}</div>
                        <div class="gpt-item-ref">${this.escapeHtml(gpt.ref)}</div>
                    </div>
                    <div class="gpt-item-actions">
                        ${!isSelected ?
                            `<button class="btn btn-small btn-success" onclick="manager.selectGPT('${gpt.id}')">
                                <span>✓</span> Sélectionner
                            </button>` :
                            '<span class="selected-badge">✓ Sélectionné</span>'
                        }
                        <button class="btn btn-small btn-danger" onclick="manager.removeGPT('${gpt.id}')">
                            <span>🗑️</span> Supprimer
                        </button>
                    </div>
                </div>
                ${gpt.description ?
                    `<div class="gpt-item-description">${this.escapeHtml(gpt.description)}</div>` :
                    ''
                }
                <div class="gpt-item-footer">
                    <div class="gpt-item-date">Ajouté le ${date}</div>
                </div>
            </div>
        `;
    }

    renderSelected() {
        const selectedContainer = document.getElementById('selectedGPT');
        const selected = this.gpts.find(gpt => gpt.id === this.selectedId);

        if (!selected) {
            selectedContainer.innerHTML = '<p class="no-selection">Aucune référence sélectionnée</p>';
            return;
        }

        selectedContainer.innerHTML = `
            <div class="selected-content">
                <h3>${this.escapeHtml(selected.name)}</h3>
                <div class="ref">
                    <strong>Référence:</strong><br>
                    ${this.escapeHtml(selected.ref)}
                </div>
                ${selected.description ?
                    `<div class="description">
                        <strong>Description:</strong><br>
                        ${this.escapeHtml(selected.description)}
                    </div>` :
                    ''
                }
            </div>
        `;
    }

    updateCount() {
        const badge = document.getElementById('countBadge');
        badge.textContent = this.gpts.length;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'success') {
        // Créer une notification temporaire
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'};
            color: white;
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideIn 0.3s ease;
            font-weight: 600;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }

    // Méthode pour exporter les données (bonus)
    exportData() {
        const data = {
            gpts: this.gpts,
            selectedId: this.selectedId,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `custom-gpt-refs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Méthode pour importer les données (bonus)
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.gpts && Array.isArray(data.gpts)) {
                    this.gpts = data.gpts;
                    this.selectedId = data.selectedId || null;
                    this.saveToStorage();
                    this.render();
                    this.showNotification('✓ Données importées avec succès', 'success');
                } else {
                    throw new Error('Format de fichier invalide');
                }
            } catch (error) {
                console.error('Erreur d\'importation:', error);
                alert('Erreur lors de l\'importation du fichier');
            }
        };
        reader.readAsText(file);
    }
}

// Ajouter les animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialiser l'application
const manager = new GPTManager();

// Exposer certaines méthodes pour la console (debug/test)
window.gptManager = manager;
