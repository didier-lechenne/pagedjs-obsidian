import { App, TFile, Notice } from 'obsidian';
import { PagedJSSettings } from '../settings/SettingsTab';
import { DocumentPart } from '../settings/tabs/StructureTab';

export class YamlConfigManager {
    private app: App;

    constructor(app: App) {
        this.app = app;
    }

    // =================== CONFIGURATIONS DU DOCUMENT ===================

    /**
     * Sauvegarde les configurations du document dans config.yml
     */
    async saveConfigToYaml(settings: PagedJSSettings): Promise<void> {
        try {
            const configPath = this.getConfigPath(settings);
            const yamlContent = this.configToYaml(settings);
            
            // ✅ CORRECTION: Vérifier si le dossier public existe avant de créer
            const publicFolder = this.app.vault.getAbstractFileByPath(settings.publicFolder);
            
            if (!publicFolder) {
                console.log(`📁 Dossier public n'existe pas: ${settings.publicFolder}`);
                console.log(`💡 Créez d'abord le dossier ${settings.publicFolder} manuellement`);
                return; // ✅ CORRECTION: Ne pas créer automatiquement
            }
            
            await this.writeFile(configPath, yamlContent);
            console.log(`✅ Configuration sauvegardée dans ${configPath}`);
        } catch (error: any) {
            console.log(`❌ Erreur lors de la sauvegarde: ${error.message}`);
            console.error('Erreur sauvegarde config YAML:', error);
        }
    }

    /**
     * Charge les configurations du document depuis config.yml
     */
    async loadConfigFromYaml(settings: PagedJSSettings): Promise<Partial<PagedJSSettings> | null> {
        try {
            console.log(`🔍 Tentative de chargement config depuis: ${settings.publicFolder}`);
            
            // ✅ SOLUTION RADICALE: Vérifier d'abord avec le système de fichiers
            if (!this.configFileExists(settings)) {
                console.log(`📄 Pas de config.yml trouvé - pas de chargement`);
                return null;
            }
            
            // Si le fichier existe, utiliser l'API Obsidian pour le lire
            const configPath = this.getConfigPath(settings);
            const file = this.app.vault.getAbstractFileByPath(configPath);
            
            if (!(file instanceof TFile)) {
                console.log(`📄 Erreur: fichier existe mais pas accessible via API Obsidian`);
                return null;
            }

            console.log(`📖 Lecture du fichier: ${configPath}`);
            const content = await this.app.vault.read(file);
            const loadedConfig = this.yamlToConfig(content);
            
            console.log(`✅ Configuration chargée depuis ${configPath}`);
            return loadedConfig;
        } catch (error: any) {
            console.log(`❌ Erreur lors du chargement: ${error.message}`);
            console.error('Erreur chargement config YAML:', error);
            return null;
        }
    }

    // =================== OPTIONS PAGEDJS ===================

    /**
     * Sauvegarde les options PagedJS dans options.yml
     */
    async saveOptionsToYaml(settings: PagedJSSettings): Promise<void> {
        try {
            const optionsPath = this.getOptionsPath(settings);
            const yamlContent = this.optionsToYaml(settings);
            
            // ✅ CORRECTION: Vérifier si le dossier du thème existe avant de créer
            const themeFolderPath = `${settings.publicFolder}/${settings.theme}`;
            const themeFolder = this.app.vault.getAbstractFileByPath(themeFolderPath);
            
            if (!themeFolder) {
                console.log(`📁 Dossier thème n'existe pas: ${themeFolderPath}`);
                console.log(`💡 Créez d'abord le dossier ${themeFolderPath} manuellement`);
                return; // ✅ CORRECTION: Ne pas créer automatiquement
            }
            
            await this.writeFile(optionsPath, yamlContent);
            console.log(`✅ Options exportées dans ${optionsPath}`);
        } catch (error: any) {
            console.log(`❌ Erreur lors de l'export: ${error.message}`);
            console.error('Erreur export options YAML:', error);
        }
    }

    // =================== UTILITAIRES DE FICHIERS ===================

    /**
     * Vérifie si le fichier de configuration existe SANS créer de dossier
     */
    configFileExists(settings: PagedJSSettings): boolean {
        try {
            const configPath = this.getConfigPath(settings);
            console.log(`🔍 Vérification existence: ${configPath}`);
            
            // ✅ SOLUTION RADICALE: Vérifier via le système de fichiers
            const fs = require('fs');
            const path = require('path');
            
            // Construire le chemin complet
            const basePath = (this.app.vault.adapter as any).basePath;
            const fullPath = path.join(basePath, configPath);
            
            console.log(`📂 Chemin complet: ${fullPath}`);
            
            const exists = fs.existsSync(fullPath);
            console.log(`📄 Fichier existe: ${exists}`);
            
            return exists;
        } catch (error) {
            console.log(`❌ Erreur vérification fichier: ${error}`);
            return false;
        }
    }

    /**
     * Vérifie si le fichier d'options existe
     */
    optionsFileExists(settings: PagedJSSettings): boolean {
        const optionsPath = this.getOptionsPath(settings);
        const file = this.app.vault.getAbstractFileByPath(optionsPath);
        return file instanceof TFile;
    }

    /**
     * Obtient le chemin du fichier de configuration
     */
    getConfigPath(settings: PagedJSSettings): string {
        return `${settings.publicFolder}/config.yml`;
    }

    /**
     * Obtient le chemin du fichier d'options
     */
    getOptionsPath(settings: PagedJSSettings): string {
        return `${settings.publicFolder}/${settings.theme}/options.yml`;
    }

    // =================== CONVERSION YAML ===================

    /**
     * Convertit les configurations en YAML
     */
    private configToYaml(settings: PagedJSSettings): string {
        let yaml = `# Configuration du document PagedJS
# Généré automatiquement - vous pouvez modifier ce fichier

# === DOSSIER PUBLIC ===
publicFolder: "${settings.publicFolder}"

# === INFORMATIONS DU DOCUMENT ===
theme: "${settings.theme}"
title: "${settings.title}"
subtitle: "${settings.subtitle}"
runningtitle: "${settings.runningtitle}"

# === AUTEUR ===
name: "${settings.name}"
mention: "${settings.mention}"
option: "${settings.option}"
year: "${settings.year}"

# === INSTITUTION ===
directeur: "${settings.directeur}"
ecole: "${settings.ecole}"

# === FICHIERS ===
pdf: "${settings.pdf}"
`;

        // Ajouter la structure du document si elle existe
        if (settings.parts && settings.parts.length > 0) {
            yaml += `
# === STRUCTURE DU DOCUMENT ===
parts:
`;
            // Filtrer seulement les parties sélectionnées pour l'export
            const exportedParts = settings.parts.filter(part => part.export !== false);
            
            exportedParts.forEach(part => {
                yaml += `  - title: "${part.title}"
`;
                // ✅ NOUVEAU: Ajouter le support du champ template
                if (part.template) {
                    yaml += `    template: "${part.template}"
`;
                }
                if (part.file) {
                    yaml += `    file: "${part.file}"
`;
                }
                if (part.css) {
                    yaml += `    css: "${part.css}"
`;
                }
                if (part.pad) {
                    yaml += `    pad: "${part.pad}"
`;
                }
            });
        }

        return yaml;
    }

    /**
     * Convertit les options PagedJS en YAML
     */
    private optionsToYaml(settings: PagedJSSettings): string {
        return `# Options PagedJS
# Généré automatiquement pour le thème ${settings.theme}

# === DIMENSIONS DE LA PAGE (mm) ===
width: ${settings.width}
height: ${settings.height}

# === MARGES GÉNÉRALES (mm) ===
margin_top: ${settings.margin_top}
margin_right: ${settings.margin_right}
margin_bottom: ${settings.margin_bottom}
margin_left: ${settings.margin_left}

# === MARGES PAGES GAUCHE (mm) ===
page_left_margin_top: ${settings.page_left_margin_top}
page_left_margin_bottom: ${settings.page_left_margin_bottom}
page_left_margin_left: ${settings.page_left_margin_left}
page_left_margin_right: ${settings.page_left_margin_right}

# === MARGES PAGES DROITE (mm) ===
page_right_margin_top: ${settings.page_right_margin_top}
page_right_margin_bottom: ${settings.page_right_margin_bottom}
page_right_margin_left: ${settings.page_right_margin_left}
page_right_margin_right: ${settings.page_right_margin_right}

# === OPTIONS DE MISE EN PAGE ===
bleed: ${settings.bleed}
marks: ${settings.marks}
recto_verso: ${settings.recto_verso}

# === OPTIONS DES NOTES ===
printNotes: "${settings.printNotes}"
imageNotes: ${settings.imageNotes}

# === OPTIONS AVANCÉES ===
ragadjust: ${settings.ragadjust}
typesetting: ${settings.typesetting}
ep_markdown: ${settings.ep_markdown}
tailwind: ${settings.tailwind}
auto: ${settings.auto}
baseline: ${settings.baseline}
`;
    }

/**
     * Parse un YAML vers les configurations
     */
    private yamlToConfig(yamlContent: string): Partial<PagedJSSettings> {
        const config: Partial<PagedJSSettings> = {};
        
        // Champs de configuration à extraire
        const configFields = [
            'theme', 'title', 'subtitle', 'runningtitle',
            'name', 'mention', 'option', 'year',
            'directeur', 'ecole', 'pdf'
        ];
        
        const lines = yamlContent.split('\n');
        let inPartsSection = false;
        let currentPart: DocumentPart | null = null;
        const parts: DocumentPart[] = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            // Ignorer les commentaires et lignes vides
            if (trimmed.startsWith('#') || trimmed === '') continue;
            
            // Détecter le début de la section parts
            if (trimmed === 'parts:') {
                inPartsSection = true;
                continue;
            }
            
            if (inPartsSection) {
                // Nouvelle partie (avec tiret au début)
                if (line.startsWith('  - title:') || line.startsWith('- title:')) {
                    // Sauvegarder la partie précédente si elle existe
                    if (currentPart) {
                        parts.push(currentPart);
                    }
                    // Créer une nouvelle partie
                    const titleValue = trimmed.startsWith('- title:') 
                        ? trimmed.substring(8) 
                        : trimmed.substring(10);
                    currentPart = {
                        title: this.extractValue(titleValue),
                        export: true
                    } as DocumentPart;
                }
                // Propriétés de la partie courante (avec indentation)
                else if (currentPart && line.startsWith('    ')) {
                    const propTrimmed = line.substring(4).trim();
                    if (propTrimmed.startsWith('title:')) {
                        currentPart.title = this.extractValue(propTrimmed.substring(6));
                    } else if (propTrimmed.startsWith('template:')) {
                        // ✅ NOUVEAU: Support du champ template
                        currentPart.template = this.extractValue(propTrimmed.substring(9));
                    } else if (propTrimmed.startsWith('file:')) {
                        currentPart.file = this.extractValue(propTrimmed.substring(5));
                    } else if (propTrimmed.startsWith('css:')) {
                        currentPart.css = this.extractValue(propTrimmed.substring(4));
                    } else if (propTrimmed.startsWith('pad:')) {
                        currentPart.pad = this.extractValue(propTrimmed.substring(4));
                    }
                }
                // Fin de la section parts (ligne non indentée avec :)
                else if (!line.startsWith(' ') && trimmed.includes(':')) {
                    // Sauvegarder la partie courante
                    if (currentPart) {
                        parts.push(currentPart);
                        currentPart = null;
                    }
                    inPartsSection = false;
                    // Traiter cette ligne comme un champ de config normal
                    const colonIndex = trimmed.indexOf(':');
                    const key = trimmed.substring(0, colonIndex).trim();
                    const value = this.extractValue(trimmed.substring(colonIndex + 1));
                    
                    if (configFields.includes(key)) {
                        (config as any)[key] = value;
                    }
                }
            } else {
                // Parser key: value pour les champs de configuration
                const colonIndex = trimmed.indexOf(':');
                if (colonIndex === -1) continue;
                
                const key = trimmed.substring(0, colonIndex).trim();
                const value = this.extractValue(trimmed.substring(colonIndex + 1));
                
                // Seulement garder les champs de configuration
                if (configFields.includes(key)) {
                    (config as any)[key] = value;
                }
            }
        }
        
        // Ajouter la dernière partie si elle existe
        if (currentPart) {
            parts.push(currentPart);
        }
        
        // Ajouter les parties au config si elles existent
        if (parts.length > 0) {
            (config as any).parts = parts;
            console.log(`✅ YAML Parse - ${parts.length} parties trouvées`);
        }
        
        return config;
    }

    /**
     * Extrait la valeur d'une ligne YAML en nettoyant les guillemets
     */
    private extractValue(valueStr: string): string {
        let value = valueStr.trim();
        console.log(`🔍 YAML Parse - Extracting value from: "${valueStr}" -> trimmed: "${value}"`);
        
        // Nettoyer les guillemets
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
            console.log(`🔍 YAML Parse - Removed quotes: "${value}"`);
        }
        
        return value;
    }

    // =================== UTILITAIRES PRIVÉS ===================

    /**
     * Écrit un fichier, en créant ou modifiant selon le cas
     */
    private async writeFile(filePath: string, content: string): Promise<void> {
        const existingFile = this.app.vault.getAbstractFileByPath(filePath);
        
        if (existingFile instanceof TFile) {
            await this.app.vault.modify(existingFile, content);
        } else {
            await this.app.vault.create(filePath, content);
        }
    }

    /**
     * S'assure qu'un dossier existe
     */
    private async ensureFolder(folderPath: string): Promise<void> {
        const folder = this.app.vault.getAbstractFileByPath(folderPath);
        
        if (!folder) {
            await this.app.vault.createFolder(folderPath);
        }
    }

    // =================== MÉTHODES HÉRITÉES (COMPATIBILITÉ) ===================

    /**
     * @deprecated Utiliser saveConfigToYaml à la place
     */
    async saveToYaml(settings: PagedJSSettings): Promise<void> {
        return this.saveConfigToYaml(settings);
    }

    /**
     * @deprecated Utiliser loadConfigFromYaml à la place
     */
    async loadFromYaml(): Promise<PagedJSSettings | null> {
        // Cette méthode nécessiterait les settings actuels pour fonctionner
        console.warn('loadFromYaml is deprecated, use loadConfigFromYaml instead');
        return null;
    }

    /**
     * @deprecated Utiliser saveOptionsToYaml à la place
     */
    async exportPagedJSOnly(settings: PagedJSSettings): Promise<void> {
        return this.saveOptionsToYaml(settings);
    }
}