import { BaseTab } from "./BaseTab";

export interface DocumentPart {
    title: string;
    file?: string;
    css?: string;
    pad?: string;
    template?: string;
    export?: boolean;
}

export class StructureTab extends BaseTab {
    private draggedElement: HTMLElement | null = null;
    private draggedIndex: number = -1;
    private isInternalAction: boolean = false;

    constructor(app: any, plugin: any) {
        super(app, plugin);
        
        // Écouter les événements de refresh externes
        document.addEventListener('pagedjs-settings-refreshed', (event: any) => {
            if (this.isInternalAction) {
                console.log('🚫 Structure tab ignoring self-triggered refresh');
                return;
            }
            
            console.log('🔄 Structure tab received external refresh event:', event.detail);
            
            if (event.detail.source?.includes('folder-change') || 
                event.detail.source === 'save' && event.detail.partsLoaded > 0) {
                console.log('📁 External change detected - refreshing structure');
                setTimeout(() => {
                    this.refreshDisplayIfActive();
                }, 100);
            }
        });
    }

    display(containerEl: HTMLElement): void {
        containerEl.createEl("h2", { text: "📖 Structure du document" });

        this.ensureCurrentDataIfNeeded().then(() => {
            this.createPartsManager(containerEl);
            this.createActions(containerEl);
        });
    }

    /**
     * Rechargement conditionnel des données
     */
    private async ensureCurrentDataIfNeeded(): Promise<void> {
        if (!this.plugin.settings.parts || this.plugin.settings.parts.length === 0) {
            console.log('🔍 Structure Tab - Tentative de rechargement des données...');
            
            const reloaded = await this.plugin.forceReloadCurrentConfig();
            
            if (reloaded) {
                console.log('✅ Config rechargé avec succès');
                console.log('📊 Parts après rechargement:', this.plugin.settings.parts?.length || 0);
            }
        } else {
            console.log('📊 Structure Tab - Utilisation des données existantes:', this.plugin.settings.parts.length, 'parts');
        }
    }

    private refreshDisplayIfActive(): void {
        if (this.isInternalAction) {
            console.log('🚫 Ignoring refresh during internal action');
            return;
        }
        
        const activeTab = document.querySelector('.pagedjs-tab-button.active');
        const structureContainer = document.querySelector('.pagedjs-tab-content.structure');
        
        if (activeTab && activeTab.textContent?.includes('Structure') && structureContainer) {
            console.log('🔄 Refreshing Structure tab display with external data');
            this.refreshDisplay();
        }
    }

    private createPartsManager(containerEl: HTMLElement): void {
        if (!this.plugin.settings.parts) {
            this.plugin.settings.parts = [];
        }

        console.log('📋 Creating parts manager with:', this.plugin.settings.parts.length, 'parts');

        const partsContainer = containerEl.createEl("div", { cls: "parts-container" });

        this.plugin.settings.parts.forEach((part, index) => {
            this.createPartEditor(partsContainer, part, index);
        });

        if (this.plugin.settings.parts.length === 0) {
            partsContainer.createEl("div", { 
                text: "Aucune partie. Cliquez sur 'Ajouter' pour commencer."
            }).style.cssText = `text-align: center; padding: 20px; color: var(--text-muted);`;
        }

        console.log('✅ Native drag & drop configuré');
    }

    private createPartEditor(containerEl: HTMLElement, part: DocumentPart, index: number): void {
        const partContainer = containerEl.createEl("div", { cls: "part-item" });
        partContainer.style.cssText = `
            background: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.2s ease;
        `;

        // ✅ Drag handle natif
        const dragHandle = partContainer.createEl("div", { 
            cls: "drag-handle", 
            text: "⋮⋮",
            attr: { 
                draggable: "true",
                'data-index': index.toString()
            }
        });
        dragHandle.style.cssText = `
            color: var(--text-muted);
            cursor: grab;
            padding: 8px;
            user-select: none;
            border-radius: 4px;
            transition: all 0.2s ease;
        `;

        // ✅ Événements drag natifs
        this.setupNativeDragAndDrop(partContainer, dragHandle, index);

        // Créer le reste des éléments
        this.createRestOfPartEditor(partContainer, part, index);
    }

    private setupNativeDragAndDrop(container: HTMLElement, handle: HTMLElement, index: number): void {
        // ✅ Drag start
        handle.addEventListener('dragstart', (e) => {
            console.log('🔄 Drag start:', index);
            this.draggedElement = container;
            this.draggedIndex = index;
            
            container.style.opacity = '0.5';
            handle.style.cursor = 'grabbing';
            
            e.dataTransfer!.effectAllowed = 'move';
            e.dataTransfer!.setData('text/html', '');
        });

        // ✅ Drag end
        handle.addEventListener('dragend', (e) => {
            console.log('🔄 Drag end');
            container.style.opacity = '1';
            handle.style.cursor = 'grab';
            
            this.draggedElement = null;
            this.draggedIndex = -1;
            
            this.clearDropIndicators();
        });

        // ✅ Drop zone
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer!.dropEffect = 'move';
            
            if (this.draggedElement && this.draggedElement !== container) {
                this.showDropIndicator(container, e);
            }
        });

        container.addEventListener('dragleave', (e) => {
            this.hideDropIndicator(container);
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            
            if (this.draggedElement && this.draggedIndex !== -1) {
                const targetIndex = parseInt(container.querySelector('.drag-handle')?.getAttribute('data-index') || '-1');
                
                if (targetIndex !== -1 && this.draggedIndex !== targetIndex) {
                    console.log('🔄 Drop: moving from', this.draggedIndex, 'to', targetIndex);
                    this.reorderParts(this.draggedIndex, targetIndex);
                    this.refreshDisplay();
                }
            }
            
            this.clearDropIndicators();
        });
    }

    private showDropIndicator(container: HTMLElement, e: DragEvent): void {
        const rect = container.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        
        container.style.borderColor = 'var(--interactive-accent)';
        
        if (e.clientY < midY) {
            container.style.borderTopWidth = '3px';
            container.style.borderBottomWidth = '1px';
        } else {
            container.style.borderTopWidth = '1px';
            container.style.borderBottomWidth = '3px';
        }
    }

    private hideDropIndicator(container: HTMLElement): void {
        container.style.borderColor = 'var(--background-modifier-border)';
        container.style.borderTopWidth = '1px';
        container.style.borderBottomWidth = '1px';
    }

    private clearDropIndicators(): void {
        const containers = document.querySelectorAll('.part-item');
        containers.forEach(container => {
            this.hideDropIndicator(container as HTMLElement);
        });
    }

    private createRestOfPartEditor(partContainer: HTMLElement, part: DocumentPart, index: number): void {
        // Titre
        const titleInput = partContainer.createEl("input");
        titleInput.type = "text";
        titleInput.value = part.title || "";
        titleInput.placeholder = "Titre de la partie";
        titleInput.style.cssText = `
            padding: 6px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            background: var(--background-primary);
            width: 150px;
        `;
        titleInput.addEventListener('input', async () => {
            if (!this.plugin.settings.parts || !this.plugin.settings.parts[index]) {
                return;
            }
            this.plugin.settings.parts[index].title = titleInput.value;
            await this.saveSettingsQuietlyInternal();
        });

        // ✅ Template (input séparé)
        const templateInput = partContainer.createEl("input");
        templateInput.type = "text";
        templateInput.value = part.template || "";
        templateInput.placeholder = "template.html ou dossier/template.html";
        templateInput.style.cssText = `
            padding: 6px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            background: var(--background-primary);
            width: 180px;
        `;
        templateInput.addEventListener('input', async () => {
            if (!this.plugin.settings.parts || !this.plugin.settings.parts[index]) {
                return;
            }
            this.plugin.settings.parts[index].template = templateInput.value;
            await this.saveSettingsQuietlyInternal();
        });

        // Type + Chemin (sans template dans le menu)
        this.createTypeAndPathControl(partContainer, part, index);

        // Case à cocher pour l'export
        const exportCheckbox = partContainer.createEl("input");
        exportCheckbox.type = "checkbox";
        exportCheckbox.checked = part.export !== false;
        exportCheckbox.style.cssText = `
            width: 16px;
            height: 16px;
            cursor: pointer;
        `;
        exportCheckbox.addEventListener('change', async () => {
            if (!this.plugin.settings.parts || !this.plugin.settings.parts[index]) {
                return;
            }
            this.plugin.settings.parts[index].export = exportCheckbox.checked;
            await this.saveSettingsQuietlyInternal();
        });

        // Bouton supprimer
        const deleteBtn = partContainer.createEl("button", { text: "×" });
        deleteBtn.style.cssText = `
            background: none;
            border: none;
            color: var(--text-error);
            cursor: pointer;
            font-size: 18px;
            padding: 5px;
            border-radius: 3px;
        `;
        deleteBtn.onclick = () => this.deletePart(index);
    }

    private async getMarkdownFiles(): Promise<string[]> {
        try {
            // ✅ CORRECTION: Chercher dans le dossier public défini par l'utilisateur
            const publicFolder = this.plugin.settings.publicFolder;
            console.log(`🔍 Recherche fichiers .md dans: ${publicFolder}`);
            
            const folder = this.app.vault.getAbstractFileByPath(publicFolder);
            
            if (!folder || !('children' in folder)) {
                console.log(`📁 Dossier public non trouvé: ${publicFolder}`);
                return [];
            }
            
            // ✅ Fonction récursive pour parcourir tous les sous-dossiers
            const findMarkdownFiles = (currentFolder: any, currentPath: string = ''): string[] => {
                const files: string[] = [];
                
                if (!currentFolder.children) {
                    return files;
                }
                
                currentFolder.children.forEach((item: any) => {
                    const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;
                    
                    if (item.extension === 'md') {
                        // Fichier markdown trouvé
                        files.push(itemPath);
                    } else if ('children' in item) {
                        // Dossier : récursion
                        const subFiles = findMarkdownFiles(item, itemPath);
                        files.push(...subFiles);
                    }
                });
                
                return files;
            };
            
            const markdownFiles = findMarkdownFiles(folder as any);
            
            // ✅ Tri intelligent par nom de fichier (numéros en premier)
            markdownFiles.sort((a, b) => {
                const getNumber = (filename: string) => {
                    // Extraire le numéro du début du nom de fichier
                    const match = filename.match(/(\d+)/);
                    return match ? parseInt(match[1]) : 999999;
                };
                
                const getFileName = (path: string) => {
                    return path.split('/').pop() || path;
                };
                
                const aNum = getNumber(getFileName(a));
                const bNum = getNumber(getFileName(b));
                
                // Si les deux ont des numéros, trier par numéro
                if (aNum !== 999999 && bNum !== 999999) {
                    return aNum - bNum;
                }
                
                // Sinon, tri alphabétique
                return a.localeCompare(b);
            });
                
            console.log(`📄 ${markdownFiles.length} fichiers .md trouvés dans ${publicFolder}:`);
            markdownFiles.forEach(file => console.log(`  - ${file}`));
            
            return markdownFiles;
        } catch (error) {
            console.log('⚠️ Erreur lecture fichiers markdown:', error);
            return [];
        }
    }

    private async populateFileSuggestions(datalist: HTMLElement): Promise<void> {
        try {
            const files = await this.getMarkdownFiles();
            
            datalist.empty();
            
            files.forEach(file => {
                const option = document.createElement('option');
                option.value = file;
                datalist.appendChild(option);
            });
            
            console.log(`💡 ${files.length} suggestions ajoutées`);
        } catch (error) {
            console.log('⚠️ Erreur population suggestions:', error);
        }
    }

    private createTypeAndPathControl(containerEl: HTMLElement, part: DocumentPart, index: number): void {
        let currentType: 'file' | 'css' | 'pad' = 'file';
        let currentValue = '';
        
        if (part.file !== undefined) {
            currentType = 'file';
            currentValue = part.file;
        } else if (part.css !== undefined) {
            currentType = 'css';
            currentValue = part.css;
        } else if (part.pad !== undefined) {
            currentType = 'pad';
            currentValue = part.pad;
        }

        const controlContainer = containerEl.createEl("div");
        controlContainer.style.cssText = `
            display: flex;
            gap: 8px;
            flex: 1;
            align-items: center;
        `;

        // Select type
        const typeSelect = controlContainer.createEl("select");
        typeSelect.style.cssText = `
            padding: 6px;
            background: var(--background-primary);
            min-width: 100px;
        `;

        const options = [
            { value: 'file', text: '📄 Fichier' },
            { value: 'css', text: '🎨 CSS' },
            { value: 'pad', text: '📝 Pad' }
        ];

        options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.text;
            if (option.value === currentType) {
                optionEl.selected = true;
            }
            typeSelect.appendChild(optionEl);
        });

        // Input container
        const inputContainer = controlContainer.createEl("div");
        inputContainer.style.cssText = `
            display: flex;
            align-items: center;
            flex: 1;
            position: relative;
        `;

        // Input path avec datalist
        const pathInput = inputContainer.createEl("input");
        pathInput.type = "text";
        pathInput.value = currentValue;
        pathInput.style.cssText = `
            flex: 1;
            padding: 6px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            background: var(--background-primary);
        `;

        // Datalist pour l'autocomplétion
        const datalistId = `file-suggestions-${index}`;
        const datalist = inputContainer.createEl("datalist");
        datalist.id = datalistId;
        pathInput.setAttribute('list', datalistId);

        const placeholders = {
            file: "fichier.md ou dossier/fichier.md",
            css: "style.css",
            pad: "https://pad.com/123"
        };

        const updateInterface = async () => {
            const selectedType = typeSelect.value as 'file' | 'css' | 'pad';
            pathInput.placeholder = placeholders[selectedType];
            
            if (selectedType === 'file') {
                await this.populateFileSuggestions(datalist);
            } else {
                datalist.empty();
            }
        };

        updateInterface();

        typeSelect.addEventListener('change', async () => {
            if (!this.plugin.settings.parts || !this.plugin.settings.parts[index]) {
                return;
            }
            const newType = typeSelect.value as 'file' | 'css' | 'pad';
            
            delete this.plugin.settings.parts[index].file;
            delete this.plugin.settings.parts[index].css;
            delete this.plugin.settings.parts[index].pad;
            
            (this.plugin.settings.parts[index] as any)[newType] = pathInput.value;
            
            await updateInterface();
            await this.saveSettingsQuietlyInternal();
        });

        pathInput.addEventListener('input', async () => {
            if (!this.plugin.settings.parts || !this.plugin.settings.parts[index]) {
                return;
            }
            const currentType = typeSelect.value as 'file' | 'css' | 'pad';
            
            delete this.plugin.settings.parts[index].file;
            delete this.plugin.settings.parts[index].css;
            delete this.plugin.settings.parts[index].pad;
            
            (this.plugin.settings.parts[index] as any)[currentType] = pathInput.value;
            
            await this.saveSettingsQuietly();
        });
    }

    private createActions(containerEl: HTMLElement): void {
        const actionsContainer = containerEl.createEl("div");
        actionsContainer.style.cssText = `
            display: flex;
            gap: 10px;
            margin: 20px 0;
        `;

        const addBtn = actionsContainer.createEl("button", { text: "+ Ajouter" });
        addBtn.style.cssText = `
            padding: 10px 20px;
            background: var(--interactive-accent);
            color: var(--text-on-accent);
            border: none;
            border-radius: 6px;
            cursor: pointer;
        `;
        addBtn.onclick = () => this.addPart();

        if (this.plugin.settings.parts && this.plugin.settings.parts.length > 0) {
            const clearBtn = actionsContainer.createEl("button", { text: "🗑️ Vider" });
            clearBtn.style.cssText = `
                padding: 10px 20px;
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                cursor: pointer;
                color: var(--text-error);
            `;
            clearBtn.onclick = () => this.clearAll();
        }
    }

    // =================== MÉTHODES DE SAUVEGARDE ===================

    private async saveSettingsQuietlyInternal(): Promise<void> {
        this.isInternalAction = true;
        
        try {
            await super.saveSettingsQuietly();
            console.log('💾 Structure: Settings saved quietly with YAML');
        } catch (error) {
            console.error('❌ Error saving structure settings quietly:', error);
        } finally {
            setTimeout(() => {
                this.isInternalAction = false;
            }, 100);
        }
    }

    private async saveSettingsWithRefresh(): Promise<void> {
        try {
            await super.saveSettings();
            console.log('💾 Structure: Settings saved with refresh and YAML');
        } catch (error) {
            console.error('❌ Error saving structure settings with refresh:', error);
        }
    }

    // =================== ACTIONS ===================

    private reorderParts(oldIndex: number, newIndex: number): void {
        if (!this.plugin.settings.parts) {
            this.plugin.settings.parts = [];
            return;
        }
        const [movedPart] = this.plugin.settings.parts.splice(oldIndex, 1);
        this.plugin.settings.parts.splice(newIndex, 0, movedPart);
        this.saveSettingsQuietlyInternal();
    }

    private addPart(): void {
        if (!this.plugin.settings.parts) {
            this.plugin.settings.parts = [];
        }

        this.plugin.settings.parts.push({
            title: `Partie ${this.plugin.settings.parts.length + 1}`,
            file: "",
            export: true
        });
        
        this.saveSettingsWithRefresh();
        this.refreshDisplay();
    }

    private deletePart(index: number): void {
        if (!this.plugin.settings.parts) {
            this.plugin.settings.parts = [];
            return;
        }
        this.plugin.settings.parts.splice(index, 1);
        this.saveSettingsWithRefresh();
        this.refreshDisplay();
    }

    private clearAll(): void {
        if (confirm("Supprimer toutes les parties ?")) {
            this.plugin.settings.parts = [];
            this.saveSettingsWithRefresh();
            this.refreshDisplay();
        }
    }

    private refreshDisplay(): void {
        const container = document.querySelector('.pagedjs-tab-content') as HTMLElement;
        if (container) {
            container.empty();
            this.display(container);
        }
    }
}