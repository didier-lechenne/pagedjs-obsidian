import { App, PluginSettingTab } from "obsidian";
import NodeServer from "../../main";
import { ConfigurationsTab } from "./tabs/ConfigurationsTab";
import { OptionsTab } from "./tabs/OptionsTab";
import { SaveLoadTab } from "./tabs/SaveLoadTab";
import { ServerTab } from "./tabs/ServerTab";
import { StructureTab } from "./tabs/StructureTab";
import { DocumentPart } from "./tabs/StructureTab";

export interface PagedJSSettings {
    autoStart: boolean;
    publicFolder: string;
    // Options PagedJS
    width: number;
    height: number;
    margin_top: number;
    margin_right: number;
    margin_bottom: number;
    margin_left: number;
    page_left_margin_top: number;
    page_left_margin_bottom: number;
    page_left_margin_left: number;
    page_left_margin_right: number;
    page_right_margin_top: number;
    page_right_margin_bottom: number;
    page_right_margin_left: number;
    page_right_margin_right: number;
    bleed: boolean;
    marks: boolean;
    recto_verso: boolean;
    printNotes: 'bottom' | 'margin';
    imageNotes: boolean;
    ragadjust: boolean;
    typesetting: boolean;
    ep_markdown: boolean;
    tailwind: boolean;
    auto: boolean;
    baseline: boolean;
    // Configurations
    theme: string;
    title: string;
    subtitle: string;
    runningtitle: string;
    name: string;
    mention: string;
    option: string;
    year: string;
    directeur: string;
    ecole: string;
    pdf: string;
    // Structure du document
    parts?: DocumentPart[];
}

export const DEFAULT_SETTINGS: PagedJSSettings = {
    autoStart: true,
    publicFolder: 'public',
    // Valeurs par défaut PagedJS
    width: 165,
    height: 240,
    margin_top: 10,
    margin_right: 10,
    margin_bottom: 10,
    margin_left: 10,
    page_left_margin_top: 10,
    page_left_margin_bottom: 10,
    page_left_margin_left: 25,
    page_left_margin_right: 10,
    page_right_margin_top: 10,
    page_right_margin_bottom: 10,
    page_right_margin_left: 10,
    page_right_margin_right: 25,
    bleed: true,
    marks: true,
    recto_verso: false,
    printNotes: 'bottom',
    imageNotes: false,
    ragadjust: false,
    typesetting: true,
    ep_markdown: false,
    tailwind: true,
    auto: false,
    baseline: false,
    // Valeurs par défaut Configurations
    theme: '',
    title: '',
    subtitle: '',
    runningtitle: '',
    name: '',
    mention: '',
    option: '',
    year: '',
    directeur: '',
    ecole: '',
    pdf: '',
    // Structure du document (par défaut vide)
    parts: []
};

export class PagedJSSettingsTab extends PluginSettingTab {
    plugin: NodeServer;
    private activeTab: string = 'structure';
    
    // Instances des onglets
    private configurationsTab: ConfigurationsTab;
    private optionsTab: OptionsTab;
    private saveLoadTab: SaveLoadTab;
    private serverTab: ServerTab;
    private structureTab: StructureTab;
    
    // Event listener pour le refresh
    private refreshListener: (event: CustomEvent) => void;

    constructor(app: App, plugin: NodeServer) {
        super(app, plugin);
        this.plugin = plugin;
        
        // Initialiser les onglets avec leurs dépendances
        this.configurationsTab = new ConfigurationsTab(app, plugin);
        this.optionsTab = new OptionsTab(app, plugin);
        this.saveLoadTab = new SaveLoadTab(app, plugin);
        this.serverTab = new ServerTab(app, plugin);
        this.structureTab = new StructureTab(app, plugin);
        
        // Écouter les événements de refresh
        this.setupRefreshListener();
    }

    private setupRefreshListener(): void {
        this.refreshListener = (event: CustomEvent) => {
            console.log('🔄 Événement de refresh des settings reçu');
            
            // Rafraîchir l'affichage de l'onglet actuel
            setTimeout(() => {
                this.display();
            }, 50);
        };
        
        // Écouter l'événement personnalisé DOM
        document.addEventListener('pagedjs-refresh-settings', this.refreshListener);
        
        // Écouter également un événement de changement de settings
        document.addEventListener('pagedjs-settings-changed', this.refreshListener);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // Titre principal
        containerEl.createEl("h1", { text: "Pagedjs Server" });

        // Navigation par onglets
        this.createTabNavigation(containerEl);

        // Contenu des onglets
        const contentEl = containerEl.createEl("div", { cls: "pagedjs-tab-content" });
        
        switch (this.activeTab) {
            case 'configurations':
                contentEl.addClass('configurations');
                this.configurationsTab.display(contentEl);
                break;
            case 'options':
                contentEl.addClass('options');
                this.optionsTab.display(contentEl);
                break;
            case 'structure':
                contentEl.addClass('structure');
                this.structureTab.display(contentEl);
                break;
            case 'saveload':
                contentEl.addClass('saveload');
                this.saveLoadTab.display(contentEl);
                break;
            case 'server':
                contentEl.addClass('server');
                this.serverTab.display(contentEl);
                break;
        }
    }

    private createTabNavigation(containerEl: HTMLElement): void {
        const tabNavEl = containerEl.createEl("div", { cls: "pagedjs-tab-nav" });

        const tabs = [
            { id: 'structure', label: '📖 Sommaire' },
            { id: 'options', label: '⚙️ Configuration du livre' },
            { id: 'configurations', label: '📝 Options' },
            { id: 'saveload', label: '💾 Sauvegarde' },
            { id: 'server', label: '🖥️ Serveur' }
        ];

        tabs.forEach(tab => {
            const tabButton = tabNavEl.createEl("button", { 
                cls: `pagedjs-tab-button ${this.activeTab === tab.id ? 'active' : ''}`,
                text: tab.label
            });
            
            tabButton.onclick = () => {
                this.activeTab = tab.id;
                this.display();
            };
        });
    }
    
    /**
     * Nettoyer les event listeners lors de la fermeture
     */
    hide(): void {
        if (this.refreshListener) {
            document.removeEventListener('pagedjs-refresh-settings', this.refreshListener);
            document.removeEventListener('pagedjs-settings-changed', this.refreshListener);
        }
        super.hide();
    }
}