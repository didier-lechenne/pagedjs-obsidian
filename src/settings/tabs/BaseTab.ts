import { App } from "obsidian";
import NodeServer from "../../../main";
import { YamlConfigManager } from "../../utils/YamlConfigManager";

/**
 * Classe de base pour tous les onglets de configuration
 */
export abstract class BaseTab {
    protected app: App;
    protected plugin: NodeServer;
    protected yamlManager: YamlConfigManager; // ✅ NOUVEAU: Accès direct au YAML

    constructor(app: App, plugin: NodeServer) {
        this.app = app;
        this.plugin = plugin;
        this.yamlManager = new YamlConfigManager(app); // ✅ NOUVEAU: Instance YAML
    }

    /**
     * Méthode abstraite que chaque onglet doit implémenter
     */
    abstract display(containerEl: HTMLElement): void;

    /**
     * ✅ NOUVEAU: Sauvegarde dans data.json ET config.yml automatiquement
     */
    protected async saveSettings(): Promise<void> {
        // 1. Sauvegarder dans data.json (Obsidian)
        await this.plugin.saveData(this.plugin.settings);
        console.log('💾 Settings sauvés dans data.json');
        
        // 2. Sauvegarder automatiquement dans config.yml si le dossier existe
        try {
            if (this.yamlManager.configFileExists(this.plugin.settings) || 
                this.folderExists(this.plugin.settings.publicFolder)) {
                await this.yamlManager.saveConfigToYaml(this.plugin.settings);
                console.log('💾 Settings sauvés dans config.yml');
            } else {
                console.log('📁 Dossier public n\'existe pas - pas de sauvegarde YAML');
            }
        } catch (error) {
            console.warn('⚠️ Erreur sauvegarde YAML automatique:', error);
        }

        // 3. Déclencher l'événement de refresh
        const refreshEvent = new CustomEvent('pagedjs-settings-refreshed', {
            detail: { 
                settings: this.plugin.settings,
                source: 'tab-save'
            }
        });
        document.dispatchEvent(refreshEvent);
    }

    /**
     * ✅ NOUVEAU: Sauvegarde silencieuse (data.json + config.yml sans événement)
     */
    protected async saveSettingsQuietly(): Promise<void> {
        // 1. Sauvegarder dans data.json (Obsidian)
        await this.plugin.saveData(this.plugin.settings);
        console.log('💾 Quiet save: data.json updated');
        
        // 2. Sauvegarder dans config.yml si possible
        try {
            if (this.yamlManager.configFileExists(this.plugin.settings) || 
                this.folderExists(this.plugin.settings.publicFolder)) {
                await this.yamlManager.saveConfigToYaml(this.plugin.settings);
                console.log('💾 Quiet save: config.yml updated');
            }
        } catch (error) {
            console.warn('⚠️ Erreur sauvegarde YAML silencieuse:', error);
        }
        
        // Pas d'événement de refresh pour la sauvegarde silencieuse
    }

    /**
     * ✅ NOUVEAU: Vérifier si un dossier existe
     */
    protected folderExists(folderPath: string): boolean {
        try {
            const folder = this.app.vault.getAbstractFileByPath(folderPath);
            return folder !== null;
        } catch {
            return false;
        }
    }

    /**
     * Redémarre le serveur si nécessaire
     */
    protected async restartServerIfRunning(): Promise<void> {
        if (this.plugin.isServerRunning()) {
            await this.plugin.stopServer();
            await this.plugin.startServer();
        }
    }

    /**
     * Crée un titre de section
     */
    protected createSectionTitle(containerEl: HTMLElement, text: string): HTMLElement {
        return containerEl.createEl("h3", { text });
    }

    /**
     * Crée un conteneur avec classes CSS personnalisées
     */
    protected createContainer(containerEl: HTMLElement, className: string): HTMLElement {
        return containerEl.createEl("div", { cls: className });
    }

    /**
     * Utilitaire pour valider et convertir les valeurs numériques
     */
    protected parseNumber(value: string, defaultValue: number): number {
        const parsed = parseInt(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    /**
     * Utilitaire pour formater les valeurs par défaut
     */
    protected getDefaultPlaceholder(defaultValue: any): string {
        return defaultValue?.toString() || '';
    }
}