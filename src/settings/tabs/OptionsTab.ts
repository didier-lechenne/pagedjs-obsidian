import { Setting } from "obsidian";
import { BaseTab } from "./BaseTab";

export class OptionsTab extends BaseTab {
    display(containerEl: HTMLElement): void {
        // containerEl.createEl("h2", { text: "⚙️ Options PagedJS" });

        this.createPageDimensions(containerEl);
        this.createGeneralMargins(containerEl);
        this.pageLeftMargins(containerEl);
        this.pageRightMargins(containerEl);
        this.createLayoutOptions(containerEl);
        this.createNotesOptions(containerEl);
        this.createAdvancedOptions(containerEl);
    }

    private createPageDimensions(containerEl: HTMLElement): void {
        // this.createSectionTitle(containerEl, "Dimensions de la page (mm)");
        containerEl.createEl("h5", { text: "Dimensions de la page (mm)" });

        const dimensionsContainer = this.createContainer(containerEl, "pagedjs-dimensions-row");
        
        new Setting(dimensionsContainer)
            .setName("Largeur")
            .setDesc("Largeur de la page en mm")
            .addText((text) =>
                text
                    .setPlaceholder("165")
                    .setValue(this.plugin.settings.width.toString())
                    .onChange(async (value) => {
                        this.plugin.settings.width = this.parseNumber(value, 165);
                        await this.saveSettings(); // Utilise la méthode héritée
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
                        this.plugin.settings.height = this.parseNumber(value, 240);
                        await this.saveSettings(); // Utilise la méthode héritée
                    })
            );
    }

    private createGeneralMargins(containerEl: HTMLElement): void {

        // this.createSectionTitle(containerEl, "Marges générales (mm)");
        containerEl.createEl("h5", { text: "Marges générales (mm)" });

        const marginsContainer = this.createContainer(containerEl, "pagedjs-margins-row");


        const margins = [
            { key: 'margin_top', name: 'Haut', default: 10 },
            { key: 'margin_right', name: 'Droite', default: 10 },
            { key: 'margin_bottom', name: 'Bas', default: 10 },
            { key: 'margin_left', name: 'Gauche', default: 10 }
        ];

        margins.forEach(margin => {
            new Setting(marginsContainer)
                .setName(margin.name)
                .addText((text) =>
                    text
                        .setPlaceholder(margin.default.toString())
                        .setValue((this.plugin.settings as any)[margin.key].toString())
                        .onChange(async (value) => {
                            (this.plugin.settings as any)[margin.key] = this.parseNumber(value, margin.default);
                            await this.saveSettings(); // Utilise la méthode héritée
                        })
                );
        });
    }

    private pageLeftMargins(containerEl: HTMLElement): void {
        // this.createSectionTitle(containerEl, "Marges de la page de gauche (mm)");
        containerEl.createEl("h5", { text: "Marges de la page de gauche (mm)" });

        const leftMarginsContainer = this.createContainer(containerEl, "pagedjs-margins-row");

        const leftMargins = [
            { key: 'page_left_margin_top', name: 'Haut', default: 10 },
            { key: 'page_left_margin_bottom', name: 'Bas', default: 10 },
            { key: 'page_left_margin_left', name: 'Gauche', default: 10 },
            { key: 'page_left_margin_right', name: 'Droite', default: 10 }
        ];

        const rightMargins = [
            { key: 'page_right_margin_top', name: 'Haut', default: 10 },
            { key: 'page_right_margin_bottom', name: 'Bas', default: 10 },
            { key: 'page_right_margin_left', name: 'Gauche', default: 10 },
            { key: 'page_right_margin_right', name: 'Droite', default: 10 }
        ];

        leftMargins.forEach(margin => {
            new Setting(leftMarginsContainer)
                .setName(margin.name)
                .addText((text) =>
                    text
                        .setPlaceholder(margin.default.toString())
                        .setValue((this.plugin.settings as any)[margin.key].toString())
                        .onChange(async (value) => {
                            (this.plugin.settings as any)[margin.key] = this.parseNumber(value, margin.default);
                            await this.saveSettings(); // Utilise la méthode héritée
                        })
                );
        });
    }

    private pageRightMargins(containerEl: HTMLElement): void {
        // this.createSectionTitle(containerEl, "Marges de la page de droite (mm)");
        containerEl.createEl("h5", { text: "Marges de la page de droite (mm)" });

        const leftMarginsContainer = this.createContainer(containerEl, "pagedjs-margins-row");


        const rightMargins = [
            { key: 'page_right_margin_top', name: 'Haut', default: 10 },
            { key: 'page_right_margin_bottom', name: 'Bas', default: 10 },
            { key: 'page_right_margin_left', name: 'Gauche', default: 10 },
            { key: 'page_right_margin_right', name: 'Droite', default: 10 }
        ];

        rightMargins.forEach(margin => {
            new Setting(leftMarginsContainer)
                .setName(margin.name)
                .addText((text) =>
                    text
                        .setPlaceholder(margin.default.toString())
                        .setValue((this.plugin.settings as any)[margin.key].toString())
                        .onChange(async (value) => {
                            (this.plugin.settings as any)[margin.key] = this.parseNumber(value, margin.default);
                            await this.saveSettings(); // Utilise la méthode héritée
                        })
                );
        });
    }


    private createLayoutOptions(containerEl: HTMLElement): void {
        this.createSectionTitle(containerEl, "Options de mise en page");

        const layoutOptions = [
            {
                key: 'bleed',
                name: 'Fond perdu (Bleed)',
                desc: 'Activer le fond perdu pour l\'impression'
            },
            {
                key: 'marks',
                name: 'Repères de coupe (Marks)',
                desc: 'Afficher les repères de coupe'
            },
            {
                key: 'recto_verso',
                name: 'Recto-verso',
                desc: 'Activer l\'impression recto-verso'
            }
        ];

        layoutOptions.forEach(option => {
            new Setting(containerEl)
                .setName(option.name)
                .setDesc(option.desc)
                .addToggle((toggle) =>
                    toggle
                        .setValue((this.plugin.settings as any)[option.key])
                        .onChange(async (value) => {
                            (this.plugin.settings as any)[option.key] = value;
                            await this.saveSettings(); // Utilise la méthode héritée
                        })
                );
        });
    }

    private createNotesOptions(containerEl: HTMLElement): void {
        this.createSectionTitle(containerEl, "Options des notes");

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
                        await this.saveSettings(); // Utilise la méthode héritée
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
                        await this.saveSettings(); // Utilise la méthode héritée
                    })
            );
    }

    private createAdvancedOptions(containerEl: HTMLElement): void {
        this.createSectionTitle(containerEl, "⚙️ Options avancées");

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
                            await this.saveSettings(); // Utilise la méthode héritée
                        })
                );
        });
    }
}