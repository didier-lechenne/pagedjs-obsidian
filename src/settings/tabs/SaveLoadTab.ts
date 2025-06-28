import { Setting } from "obsidian";
import { BaseTab } from "./BaseTab";

export class SaveLoadTab extends BaseTab {
    // ✅ SUPPRIMÉ: private yamlManager car elle est maintenant dans BaseTab

    constructor(app: any, plugin: any) {
        super(app, plugin);
        // ✅ SUPPRIMÉ: this.yamlManager = new YamlConfigManager(app); 
        // Car elle est maintenant initialisée dans BaseTab
    }

    display(containerEl: HTMLElement): void {
        containerEl.createEl("h2", { text: "💾 Sauvegarde et import" });

        this.createConfigurationSection(containerEl);
        this.createOptionsSection(containerEl);
        this.createStatusSection(containerEl);
        this.createInfoSection(containerEl);
    }

    private createConfigurationSection(containerEl: HTMLElement): void {
        this.createSectionTitle(containerEl, "📝 Configurations du document");

        new Setting(containerEl)
            .setName("Sauvegarder les configurations")
            .setDesc(`Sauvegarder les informations du document dans ${this.plugin.settings.publicFolder}/config.yml`)
            .addButton((button) =>
                button
                    .setButtonText("💾 Sauvegarder config.yml")
                    .setCta()
                    .onClick(async () => {
                        await this.yamlManager.saveConfigToYaml(this.plugin.settings);
                    })
            );
        
        new Setting(containerEl)
            .setName("Charger les configurations")
            .setDesc(`Charger les configurations depuis ${this.plugin.settings.publicFolder}/config.yml`)
            .addButton((button) =>
                button
                    .setButtonText("📂 Charger config.yml")
                    .onClick(async () => {
                        const loadedSettings = await this.yamlManager.loadConfigFromYaml(this.plugin.settings);
                        if (loadedSettings) {
                            // ✅ Fusion profonde des settings au lieu d'un simple Object.assign
                            this.mergeSettings(this.plugin.settings, loadedSettings);
                            await this.saveSettings();
                            // Rafraîchir l'interface parente
                            this.refreshParentDisplay();
                        }
                    })
            );
    }

    /**
     * ✅ Fusion profonde des settings
     */
    private mergeSettings(target: any, source: any): void {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (key === 'parts' && Array.isArray(source[key])) {
                    // Remplacer complètement le tableau des parties
                    target[key] = [...source[key]];
                    console.log('🔄 Parts chargées:', target[key]);
                } else if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    // Fusion récursive pour les objets
                    if (!target[key] || typeof target[key] !== 'object') {
                        target[key] = {};
                    }
                    this.mergeSettings(target[key], source[key]);
                } else {
                    // Remplacement direct pour les valeurs primitives
                    target[key] = source[key];
                }
            }
        }
    }

    private createOptionsSection(containerEl: HTMLElement): void {
        this.createSectionTitle(containerEl, "⚙️ Options PagedJS");

        new Setting(containerEl)
            .setName("Exporter les options")
            .setDesc(`Exporter les options PagedJS dans ${this.plugin.settings.publicFolder}/${this.plugin.settings.theme}/options.yml`)
            .addButton((button) =>
                button
                    .setButtonText("📤 Exporter options.yml")
                    .onClick(async () => {
                        await this.yamlManager.saveOptionsToYaml(this.plugin.settings);
                    })
            );
    }

    private createStatusSection(containerEl: HTMLElement): void {
        this.createSectionTitle(containerEl, "📋 Statut des fichiers");

        const statusEl = this.createContainer(containerEl, "pagedjs-files-status");
        
        // Vérifier le fichier de config principal
        if (this.yamlManager.configFileExists(this.plugin.settings)) {
            statusEl.createEl("p", { 
                text: `✅ Configurations sauvées: ${this.yamlManager.getConfigPath(this.plugin.settings)}`,
                cls: "status-success"
            });
        } else {
            statusEl.createEl("p", { 
                text: `❌ Aucune sauvegarde de config: ${this.yamlManager.getConfigPath(this.plugin.settings)}`,
                cls: "status-error"
            });
        }

        // Vérifier le fichier options.yml dans le dossier public/theme
        const optionsPath = this.yamlManager.getOptionsPath(this.plugin.settings);
        
        if (this.yamlManager.optionsFileExists(this.plugin.settings)) {
            statusEl.createEl("p", { 
                text: `✅ Options exportées: ${optionsPath}`,
                cls: "status-success"
            });
        } else {
            statusEl.createEl("p", { 
                text: `❌ Options non exportées: ${optionsPath}`,
                cls: "status-error"
            });
        }
    }

    private createInfoSection(containerEl: HTMLElement): void {
        this.createSectionTitle(containerEl, "ℹ️ Informations");

        const infoEl = this.createContainer(containerEl, "pagedjs-info-section");
        
        infoEl.createEl("div", { cls: "info-item" }).innerHTML = `
            <strong>📄 config.yml</strong><br>
            <em>Contient : thème, titre, auteur, école, etc.</em><br>
            <code>Emplacement : ${this.plugin.settings.publicFolder}/</code>
        `;
        
        infoEl.createEl("div", { cls: "info-item" }).innerHTML = `
            <strong>⚙️ options.yml</strong><br>
            <em>Contient : dimensions, marges, options PagedJS</em><br>
            <code>Emplacement : ${this.plugin.settings.publicFolder}/${this.plugin.settings.theme}/</code>
        `;
    }

    /**
     * ✅ Méthode pour rafraîchir l'affichage parent
     */
    private refreshParentDisplay(): void {
        console.log('🔄 Settings reloaded - refreshing parent display');
        
        // Émettre un événement personnalisé pour notifier les autres onglets
        const refreshEvent = new CustomEvent('pagedjs-settings-refreshed', {
            detail: { settings: this.plugin.settings }
        });
        
        document.dispatchEvent(refreshEvent);
        
        // Optionnel: Forcer le re-rendu du tab actuel si c'est le tab Structure
        const activeTab = document.querySelector('.pagedjs-tab-button.active');
        if (activeTab && activeTab.textContent?.includes('Structure')) {
            // Déclencher un clic pour forcer le refresh
            setTimeout(() => {
                (activeTab as HTMLElement).click();
            }, 100);
        }
    }
}