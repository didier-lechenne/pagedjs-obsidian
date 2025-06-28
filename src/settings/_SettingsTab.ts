import { App, PluginSettingTab } from "obsidian";
import NodeServer from "../../main";
import { ConfigurationsTab } from "./tabs/ConfigurationsTab";
import { OptionsTab } from "./tabs/OptionsTab";
import { SaveLoadTab } from "./tabs/SaveLoadTab";
import { ServerTab } from "./tabs/ServerTab";

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
    theme: 'valentine',
    title: 'Titre',
    subtitle: '',
    runningtitle: '',
    name: 'Prénom Nom',
    mention: 'Mémoire de Diplôme National Supérieur d\'Expression Plastique',
    option: 'Design',
    year: '2024 – 2025',
    directeur: 'sous la direction de Jean Charles Zebo',
    ecole: 'ebabx – école supérieure des beaux-arts de Bordeaux',
    pdf: ''
};

export class PagedJSSettingsTab extends PluginSettingTab {
    plugin: NodeServer;
    private activeTab: string = 'configurations';
    
    // Instances des onglets
    private configurationsTab: ConfigurationsTab;
    private optionsTab: OptionsTab;
    private saveLoadTab: SaveLoadTab;
    private serverTab: ServerTab;

    constructor(app: App, plugin: NodeServer) {
        super(app, plugin);
        this.plugin = plugin;
        
        // Initialiser les onglets avec leurs dépendances
        this.configurationsTab = new ConfigurationsTab(app, plugin);
        this.optionsTab = new OptionsTab(app, plugin);
        this.saveLoadTab = new SaveLoadTab(app, plugin);
        this.serverTab = new ServerTab(app, plugin);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // Titre principal
        containerEl.createEl("h1", { text: "🚀 PagedJS Server - Configuration" });

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
            { id: 'configurations', label: '📝 Configurations' },
            { id: 'options', label: '⚙️ Options' },
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
}