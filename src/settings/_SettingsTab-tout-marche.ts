import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import NodeServer from "../../main";
import { YamlConfigManager } from "../utils/YamlConfigManager";

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
    private yamlManager: YamlConfigManager;

    constructor(app: App, plugin: NodeServer) {
        super(app, plugin);
        this.plugin = plugin;
        this.yamlManager = new YamlConfigManager(app);
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
        
        if (this.activeTab === 'configurations') {
            contentEl.addClass('configurations');
            this.displayConfigurationsTab(contentEl);
        } else if (this.activeTab === 'options') {
            contentEl.addClass('options');
            this.displayOptionsTab(contentEl);
        } else if (this.activeTab === 'saveload') {
            contentEl.addClass('saveload');
            this.displaySaveLoadTab(contentEl);
        } else {
            contentEl.addClass('server');
            this.displayServerTab(contentEl);
        }

    }

    private createTabNavigation(containerEl: HTMLElement): void {
        const tabNavEl = containerEl.createEl("div", { cls: "pagedjs-tab-nav" });

        // Onglet Configurations (premier)
        const configurationsTab = tabNavEl.createEl("button", { 
            cls: `pagedjs-tab-button ${this.activeTab === 'configurations' ? 'active' : ''}`,
            text: "📝 Configurations"
        });
        configurationsTab.onclick = () => {
            this.activeTab = 'configurations';
            this.display();
        };

        // Onglet Options (deuxième)
        const optionsTab = tabNavEl.createEl("button", { 
            cls: `pagedjs-tab-button ${this.activeTab === 'options' ? 'active' : ''}`,
            text: "⚙️ Options"
        });
        optionsTab.onclick = () => {
            this.activeTab = 'options';
            this.display();
        };

        // Onglet Sauvegarde et import (troisième)
        const saveloadTab = tabNavEl.createEl("button", { 
            cls: `pagedjs-tab-button ${this.activeTab === 'saveload' ? 'active' : ''}`,
            text: "💾 Sauvegarde"
        });
        saveloadTab.onclick = () => {
            this.activeTab = 'saveload';
            this.display();
        };

        // Onglet Serveur (quatrième)
        const serverTab = tabNavEl.createEl("button", { 
            cls: `pagedjs-tab-button ${this.activeTab === 'server' ? 'active' : ''}`,
            text: "🖥️ Serveur"
        });
        serverTab.onclick = () => {
            this.activeTab = 'server';
            this.display();
        };
    }

    private displayServerTab(containerEl: HTMLElement): void {
        containerEl.createEl("h2", { text: "🖥️ Configuration du serveur" });

        // Toggle pour démarrer/arrêter le serveur
        new Setting(containerEl)
            .setName("Serveur HTTP")
            .setDesc("Démarrer ou arrêter le serveur HTTP")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.isServerRunning())
                    .onChange(async (value) => {
                        if (value) {
                            await this.plugin.startServer();
                        } else {
                            await this.plugin.stopServer();
                        }
                        // Rafraîchir l'affichage pour mettre à jour l'état
                        this.display();
                    })
            );

        // Paramètre Démarrage automatique
        new Setting(containerEl)
            .setName("Démarrage automatique")
            .setDesc("Démarrer le serveur automatiquement au chargement du plugin")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.autoStart)
                    .onChange(async (value) => {
                        this.plugin.settings.autoStart = value;
                        await this.plugin.saveSettings();
                    })
            );

        // Ouvrir dans le navigateur
        new Setting(containerEl)
            .setName("Ouvrir dans le navigateur")
            .setDesc("Ouvrir l'interface web du serveur dans votre navigateur")
            .addButton((button) => {
                button
                    .setButtonText("Ouvrir")
                    .setIcon("external-link")
                    .setCta()
                    .onClick(() => {
                        this.plugin.openInBrowser();
                    });

                // Désactiver le bouton si le serveur n'est pas en cours d'exécution
                if (!this.plugin.isServerRunning()) {
                    button.setDisabled(true);
                    button.setTooltip("Le serveur doit être démarré pour ouvrir le navigateur");
                }
            });
    }

    private displayConfigurationsTab(containerEl: HTMLElement): void {
        containerEl.createEl("h2", { text: "📝 Configurations du document" });

        // Dossier à servir
        new Setting(containerEl)
            .setName("Dossier à servir")
            .setDesc("Nom du dossier contenant les fichiers à servir")
            .addText((text) =>
                text
                    .setPlaceholder("public")
                    .setValue(this.plugin.settings.publicFolder)
                    .onChange(async (value) => {
                        this.plugin.settings.publicFolder = value || 'public';
                        await this.plugin.saveSettings();
                        // Redémarrer le serveur si il est en cours
                        if (this.plugin.isServerRunning()) {
                            await this.plugin.stopServer();
                            await this.plugin.startServer();
                        }
                    })
            );


        new Setting(containerEl)
            .setName("Thème")
            .setDesc("Thème de mise en page du document")
            .addText((text) =>
                text
                    .setPlaceholder("valentine")
                    .setValue(this.plugin.settings.theme)
                    .onChange(async (value) => {
                        this.plugin.settings.theme = value || 'valentine';
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Titre")
            .setDesc("Titre principal du document")
            .addText((text) =>
                text
                    .setPlaceholder("Titre")
                    .setValue(this.plugin.settings.title)
                    .onChange(async (value) => {
                        this.plugin.settings.title = value || 'Titre';
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Sous-titre")
            .setDesc("Sous-titre du document")
            .addText((text) =>
                text
                    .setPlaceholder("")
                    .setValue(this.plugin.settings.subtitle)
                    .onChange(async (value) => {
                        this.plugin.settings.subtitle = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Titre courant")
            .setDesc("Titre affiché en en-tête des pages")
            .addText((text) =>
                text
                    .setPlaceholder("")
                    .setValue(this.plugin.settings.runningtitle)
                    .onChange(async (value) => {
                        this.plugin.settings.runningtitle = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Nom de l'auteur")
            .setDesc("Nom et prénom de l'auteur")
            .addText((text) =>
                text
                    .setPlaceholder("Prénom Nom")
                    .setValue(this.plugin.settings.name)
                    .onChange(async (value) => {
                        this.plugin.settings.name = value || 'Prénom Nom';
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Mention")
            .setDesc("Type de diplôme ou mention")
            .addText((text) =>
                text
                    .setPlaceholder("Mémoire de Diplôme National Supérieur d'Expression Plastique")
                    .setValue(this.plugin.settings.mention)
                    .onChange(async (value) => {
                        this.plugin.settings.mention = value || 'Mémoire de Diplôme National Supérieur d\'Expression Plastique';
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Option")
            .setDesc("Spécialité ou option d'études")
            .addText((text) =>
                text
                    .setPlaceholder("Design")
                    .setValue(this.plugin.settings.option)
                    .onChange(async (value) => {
                        this.plugin.settings.option = value || 'Design';
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Année")
            .setDesc("Année académique")
            .addText((text) =>
                text
                    .setPlaceholder("2024 – 2025")
                    .setValue(this.plugin.settings.year)
                    .onChange(async (value) => {
                        this.plugin.settings.year = value || '2024 – 2025';
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Directeur")
            .setDesc("Directeur de mémoire ou encadrant")
            .addText((text) =>
                text
                    .setPlaceholder("sous la direction de Jean Charles Zebo")
                    .setValue(this.plugin.settings.directeur)
                    .onChange(async (value) => {
                        this.plugin.settings.directeur = value || 'sous la direction de Jean Charles Zebo';
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("École")
            .setDesc("Nom de l'établissement")
            .addText((text) =>
                text
                    .setPlaceholder("ebabx – école supérieure des beaux-arts de Bordeaux")
                    .setValue(this.plugin.settings.ecole)
                    .onChange(async (value) => {
                        this.plugin.settings.ecole = value || 'ebabx – école supérieure des beaux-arts de Bordeaux';
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("PDF")
            .setDesc("Chemin vers le fichier PDF (optionnel)")
            .addText((text) =>
                text
                    .setPlaceholder("")
                    .setValue(this.plugin.settings.pdf)
                    .onChange(async (value) => {
                        this.plugin.settings.pdf = value;
                        await this.plugin.saveSettings();
                    })
            );
    }

    private displayOptionsTab(containerEl: HTMLElement): void {
        
        // === DIMENSIONS DE LA PAGE ===
        containerEl.createEl("h4", { text: "📐 Dimensions de la page (mm)" });

        // Largeur et Hauteur sur une ligne
        const dimensionsContainer = containerEl.createEl("div", { cls: "pagedjs-dimensions-row" });
        
        new Setting(dimensionsContainer)
            .setName("Largeur")
            .setDesc("Largeur de la page en mm")
            .addText((text) =>
                text
                    .setPlaceholder("165")
                    .setValue(this.plugin.settings.width.toString())
                    .onChange(async (value) => {
                        this.plugin.settings.width = parseInt(value) || 165;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(dimensionsContainer)
            .setName("Hauteur")
            .setDesc("Hauteur de la page en mm")
            .addText((text) =>
                text
                    .setPlaceholder("240")
                    .setValue(this.plugin.settings.height.toString())
                    .onChange(async (value) => {
                        this.plugin.settings.height = parseInt(value) || 240;
                        await this.plugin.saveSettings();
                    })
            );

        // === MARGES GÉNÉRALES ===
        containerEl.createEl("h4", { text: "📏 Marges générales (mm)" });

        // Marges sur une ligne (4 colonnes)
        const marginsContainer = containerEl.createEl("div", { cls: "pagedjs-margins-row" });

        const margins = [
            { key: 'margin_top', name: 'Haut', placeholder: '10' },
            { key: 'margin_right', name: 'Droite', placeholder: '10' },
            { key: 'margin_bottom', name: 'Bas', placeholder: '10' },
            { key: 'margin_left', name: 'Gauche', placeholder: '10' }
        ];

        margins.forEach(margin => {
            new Setting(marginsContainer)
                .setName(margin.name)
                .addText((text) =>
                    text
                        .setPlaceholder(margin.placeholder)
                        .setValue((this.plugin.settings as any)[margin.key].toString())
                        .onChange(async (value) => {
                            (this.plugin.settings as any)[margin.key] = parseInt(value) || parseInt(margin.placeholder);
                            await this.plugin.saveSettings();
                        })
                );
        });

        // === MARGES PAGES GAUCHE/DROITE ===
        containerEl.createEl("h3", { text: "📄 Marges spécifiques pages gauche/droite (mm)" });

        const leftMargins = [
            { key: 'page_left_margin_top', name: 'Page gauche - Haut', placeholder: '10' },
            { key: 'page_left_margin_bottom', name: 'Page gauche - Bas', placeholder: '10' },
            { key: 'page_left_margin_left', name: 'Page gauche - Gauche', placeholder: '25' },
            { key: 'page_left_margin_right', name: 'Page gauche - Droite', placeholder: '10' }
        ];

        leftMargins.forEach(margin => {
            new Setting(containerEl)
                .setName(margin.name)
                .addText((text) =>
                    text
                        .setPlaceholder(margin.placeholder)
                        .setValue((this.plugin.settings as any)[margin.key].toString())
                        .onChange(async (value) => {
                            (this.plugin.settings as any)[margin.key] = parseInt(value) || parseInt(margin.placeholder);
                            await this.plugin.saveSettings();
                        })
                );
        });

        const rightMargins = [
            { key: 'page_right_margin_top', name: 'Page droite - Haut', placeholder: '10' },
            { key: 'page_right_margin_bottom', name: 'Page droite - Bas', placeholder: '10' },
            { key: 'page_right_margin_left', name: 'Page droite - Gauche', placeholder: '10' },
            { key: 'page_right_margin_right', name: 'Page droite - Droite', placeholder: '25' }
        ];

        rightMargins.forEach(margin => {
            new Setting(containerEl)
                .setName(margin.name)
                .addText((text) =>
                    text
                        .setPlaceholder(margin.placeholder)
                        .setValue((this.plugin.settings as any)[margin.key].toString())
                        .onChange(async (value) => {
                            (this.plugin.settings as any)[margin.key] = parseInt(value) || parseInt(margin.placeholder);
                            await this.plugin.saveSettings();
                        })
                );
        });

        // === OPTIONS BOOLÉENNES ===
        containerEl.createEl("h3", { text: "🔧 Options de mise en page" });

        new Setting(containerEl)
            .setName("Fond perdu (Bleed)")
            .setDesc("Activer le fond perdu pour l'impression")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.bleed)
                    .onChange(async (value) => {
                        this.plugin.settings.bleed = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Repères de coupe (Marks)")
            .setDesc("Afficher les repères de coupe")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.marks)
                    .onChange(async (value) => {
                        this.plugin.settings.marks = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Recto-verso")
            .setDesc("Activer l'impression recto-verso")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.recto_verso)
                    .onChange(async (value) => {
                        this.plugin.settings.recto_verso = value;
                        await this.plugin.saveSettings();
                    })
            );

        // === OPTIONS NOTES ===
        containerEl.createEl("h3", { text: "📝 Options des notes" });

        new Setting(containerEl)
            .setName("Position des notes")
            .setDesc("Où afficher les notes de bas de page")
            .addDropdown((dropdown) =>
                dropdown
                    .addOption('bottom', 'Bas de page')
                    .addOption('margin', 'Dans la marge')
                    .setValue(this.plugin.settings.printNotes)
                    .onChange(async (value: 'bottom' | 'margin') => {
                        this.plugin.settings.printNotes = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Images dans les notes")
            .setDesc("Permettre les images dans les notes de marge")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.imageNotes)
                    .onChange(async (value) => {
                        this.plugin.settings.imageNotes = value;
                        await this.plugin.saveSettings();
                    })
            );

        // === OPTIONS AVANCÉES ===
        containerEl.createEl("h3", { text: "⚙️ Options avancées" });

        const advancedOptions = [
            { key: 'ragadjust', name: 'Ragadjust', desc: 'Ajustement automatique des lignes' },
            { key: 'typesetting', name: 'Typesetting', desc: 'Composition typographique avancée' },
            { key: 'ep_markdown', name: 'EP Markdown', desc: 'Support markdown étendu' },
            { key: 'tailwind', name: 'Tailwind CSS', desc: 'Utiliser Tailwind CSS' },
            { key: 'auto', name: 'Mode automatique', desc: 'Configuration automatique' },
            { key: 'baseline', name: 'Grille de base', desc: 'Aligner sur une grille de base' }
        ];

        advancedOptions.forEach(option => {
            new Setting(containerEl)
                .setName(option.name)
                .setDesc(option.desc)
                .addToggle((toggle) =>
                    toggle
                        .setValue((this.plugin.settings as any)[option.key])
                        .onChange(async (value) => {
                            (this.plugin.settings as any)[option.key] = value;
                            await this.plugin.saveSettings();
                        })
                );
        });
    }

    private displaySaveLoadTab(containerEl: HTMLElement): void {
            containerEl.createEl("h2", { text: "💾 Sauvegarde et import" });

            // === CONFIGURATIONS ===
            containerEl.createEl("h3", { text: "📝 Configurations du document" });

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
                                // Fusionner seulement les configurations chargées
                                Object.assign(this.plugin.settings, loadedSettings);
                                await this.plugin.saveSettings();
                                this.display(); // Rafraîchir l'interface
                            }
                        })
                );

            // === OPTIONS PAGEDJS ===
            containerEl.createEl("h3", { text: "⚙️ Options PagedJS" });

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

            // === STATUT DES FICHIERS ===
            containerEl.createEl("h3", { text: "📋 Statut des fichiers" });

            const statusEl = containerEl.createEl("div", { cls: "pagedjs-files-status" });
            
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

            // === INFORMATIONS ===
            containerEl.createEl("h3", { text: "ℹ️ Informations" });

            const infoEl = containerEl.createEl("div", { cls: "pagedjs-info-section" });
            
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



}




