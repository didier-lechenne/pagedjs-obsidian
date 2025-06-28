import { Setting } from "obsidian";
import { BaseTab } from "./BaseTab";

export class ConfigurationsTab extends BaseTab {
    display(containerEl: HTMLElement): void {
        containerEl.createEl("h2", { text: "📝 Configurations du document" });

        this.createServerSettings(containerEl);
        this.createThemeSettings(containerEl);
        this.createDocumentMetadata(containerEl);
        this.createAuthorSettings(containerEl);
        this.createInstitutionSettings(containerEl);
    }

    private createServerSettings(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName("Dossier à servir")
            .setDesc("Nom du dossier contenant les fichiers à servir")
            .addText((text) =>
                text
                    .setPlaceholder("public")
                    .setValue(this.plugin.settings.publicFolder)
                    .onChange(async (value) => {
                        const oldFolder = this.plugin.settings.publicFolder;
                        const newFolder = value || 'public';
                        
                        // ✅ CORRECTION: Ne changer que si vraiment différent
                        if (oldFolder === newFolder) {
                            return; // Pas de changement
                        }
                        
                        console.log('📁 Changement dossier via ConfigurationsTab:', oldFolder, '->', newFolder);
                        
                        // ✅ NOUVEAU: Sauvegarder dans l'ancien dossier d'abord (si il existe)
                        if (this.folderExists(oldFolder)) {
                            try {
                                console.log('💾 Sauvegarde finale dans ancien dossier:', oldFolder);
                                const oldSettings = { ...this.plugin.settings };
                                oldSettings.publicFolder = oldFolder; // Temporairement pour la sauvegarde
                                await this.yamlManager.saveConfigToYaml(oldSettings);
                            } catch (error) {
                                console.log('⚠️ Impossible de sauvegarder dans ancien dossier:', error);
                            }
                        }
                        
                        // ✅ NOUVEAU: Utiliser la méthode centralisée du plugin
                        this.plugin.updatePublicFolder(newFolder);
                        
                        // ✅ CORRECTION: Sauvegarder les nouveaux settings
                        await this.saveSettings();
                        
                        // ✅ CORRECTION: Recharger depuis le nouveau dossier
                        console.log('🔄 Rechargement config.yml depuis nouveau dossier...');
                        await this.plugin.reloadConfigFromNewFolder();
                    })
            );
    }

    private createThemeSettings(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName("Thème")
            .setDesc("Thème de mise en page du document")
            .addText((text) =>
                text
                    .setPlaceholder("valentine")
                    .setValue(this.plugin.settings.theme)
                    .onChange(async (value) => {
                        this.plugin.settings.theme = value || 'valentine';
                        await this.saveSettings(); // ✅ Sauvegarde complète (data.json + config.yml)
                    })
            );
    }

    private createDocumentMetadata(containerEl: HTMLElement): void {
        const documentFields = [
            {
                key: 'title',
                name: 'Titre',
                desc: 'Titre principal du document',
                placeholder: 'Titre',
                default: 'Titre'
            },
            {
                key: 'subtitle',
                name: 'Sous-titre',
                desc: 'Sous-titre du document',
                placeholder: '',
                default: ''
            },
            {
                key: 'runningtitle',
                name: 'Titre courant',
                desc: 'Titre affiché en en-tête des pages',
                placeholder: '',
                default: ''
            },
            {
                key: 'pdf',
                name: 'PDF',
                desc: 'Chemin vers le fichier PDF (optionnel)',
                placeholder: '',
                default: ''
            }
        ];

        documentFields.forEach(field => {
            new Setting(containerEl)
                .setName(field.name)
                .setDesc(field.desc)
                .addText((text) =>
                    text
                        .setPlaceholder(field.placeholder)
                        .setValue((this.plugin.settings as any)[field.key])
                        .onChange(async (value) => {
                            (this.plugin.settings as any)[field.key] = value || field.default;
                            await this.saveSettings(); // ✅ Sauvegarde complète (data.json + config.yml)
                        })
                );
        });
    }

    private createAuthorSettings(containerEl: HTMLElement): void {
        const authorFields = [
            {
                key: 'name',
                name: 'Nom de l\'auteur',
                desc: 'Nom et prénom de l\'auteur',
                placeholder: 'Prénom Nom',
                default: 'Prénom Nom'
            },
            {
                key: 'mention',
                name: 'Mention',
                desc: 'Type de diplôme ou mention',
                placeholder: 'Mémoire de Diplôme National Supérieur d\'Expression Plastique',
                default: 'Mémoire de Diplôme National Supérieur d\'Expression Plastique'
            },
            {
                key: 'option',
                name: 'Option',
                desc: 'Spécialité ou option d\'études',
                placeholder: 'Design',
                default: 'Design'
            },
            {
                key: 'year',
                name: 'Année',
                desc: 'Année académique',
                placeholder: '2024 – 2025',
                default: '2024 – 2025'
            }
        ];

        authorFields.forEach(field => {
            new Setting(containerEl)
                .setName(field.name)
                .setDesc(field.desc)
                .addText((text) =>
                    text
                        .setPlaceholder(field.placeholder)
                        .setValue((this.plugin.settings as any)[field.key])
                        .onChange(async (value) => {
                            (this.plugin.settings as any)[field.key] = value || field.default;
                            await this.saveSettings(); // ✅ Sauvegarde complète (data.json + config.yml)
                        })
                );
        });
    }

    private createInstitutionSettings(containerEl: HTMLElement): void {
        const institutionFields = [
            {
                key: 'directeur',
                name: 'Directeur',
                desc: 'Directeur de mémoire ou encadrant',
                placeholder: 'sous la direction de ',
                default: ''
            },
            {
                key: 'ecole',
                name: 'École',
                desc: 'Nom de l\'établissement',
                placeholder: 'ebabx – école supérieure des beaux-arts de Bordeaux',
                default: ''
            }
        ];

        institutionFields.forEach(field => {
            new Setting(containerEl)
                .setName(field.name)
                .setDesc(field.desc)
                .addText((text) =>
                    text
                        .setPlaceholder(field.placeholder)
                        .setValue((this.plugin.settings as any)[field.key])
                        .onChange(async (value) => {
                            (this.plugin.settings as any)[field.key] = value || field.default;
                            await this.saveSettings(); // ✅ Sauvegarde complète (data.json + config.yml)
                        })
                );
        });
    }
}