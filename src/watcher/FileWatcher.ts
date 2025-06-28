import { TFile, Vault } from 'obsidian';
import { FileChangeEvent } from '../types/interfaces';
import { Logger } from '../utils/Logger';

export class FileWatcher {
    private vault: Vault;
    private logger: Logger;
    private watchedExtensions: string[];
    private changeCallbacks: ((event: FileChangeEvent) => void)[] = [];
    private publicFolderPath: string = ''; // ✅ NOUVEAU: Dossier à surveiller
    
    constructor(vault: Vault, watchedExtensions: string[] = ['md'], publicFolderPath: string = '') {
        this.vault = vault;
        this.logger = Logger.getInstance();
        this.watchedExtensions = watchedExtensions;
        this.publicFolderPath = publicFolderPath; // ✅ NOUVEAU
    }
    
    public startWatching(): void {
        // Écouter les modifications de fichiers
        this.vault.on('modify', (file: TFile) => {
            this.handleFileChange(file, 'modify');
        });
        
        // Écouter les créations de fichiers
        this.vault.on('create', (file: TFile) => {
            this.handleFileChange(file, 'create');
        });
        
        // Écouter les suppressions de fichiers
        this.vault.on('delete', (file: TFile) => {
            this.handleFileChange(file, 'delete');
        });
        
        this.logger.info(`Surveillance activée pour les extensions: ${this.watchedExtensions.join(', ')}`, 'file');
        this.logger.info(`Dossier surveillé: ${this.publicFolderPath || 'TOUS LES DOSSIERS'}`, 'file');
    }
    
    private handleFileChange(file: TFile, changeType: 'modify' | 'create' | 'delete'): void {
        // ✅ Vérifier l'extension
        if (!this.watchedExtensions.includes(file.extension)) {
            return;
        }
        
        // ✅ NOUVEAU: Vérifier si le fichier est dans le dossier public
        if (!this.isFileInPublicFolder(file)) {
            this.logger.debug(`Fichier ${file.path} ignoré - en dehors du dossier public`, 'file');
            return;
        }
        
        const event: FileChangeEvent = {
            filePath: file.path,
            fileName: file.name,
            extension: file.extension,
            changeType,
            timestamp: Date.now()
        };
        
        this.logger.info(`Fichier ${changeType}: ${file.name} (dans ${this.publicFolderPath})`, 'file');
        
        // Notifier tous les callbacks
        this.changeCallbacks.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                this.logger.error(`Erreur dans le callback de changement de fichier: ${error}`, 'file');
            }
        });
    }
    
    /**
     * ✅ NOUVEAU: Vérifie si un fichier est dans le dossier public
     */
    private isFileInPublicFolder(file: TFile): boolean {
        // Si aucun dossier public défini, surveiller tout (comportement par défaut)
        if (!this.publicFolderPath || this.publicFolderPath.trim() === '') {
            return true;
        }
        
        // Normaliser les chemins pour la comparaison
        const normalizedPublicPath = this.publicFolderPath.replace(/\\/g, '/').replace(/\/$/, '');
        const normalizedFilePath = file.path.replace(/\\/g, '/');
        
        // Vérifier si le fichier est dans le dossier public ou un sous-dossier
        const isInPublicFolder = normalizedFilePath.startsWith(normalizedPublicPath + '/') || 
                                normalizedFilePath === normalizedPublicPath;
        
        if (isInPublicFolder) {
            this.logger.debug(`✅ Fichier ${file.name} est dans le dossier public ${normalizedPublicPath}`, 'file');
        } else {
            this.logger.debug(`❌ Fichier ${file.name} n'est PAS dans le dossier public ${normalizedPublicPath}`, 'file');
        }
        
        return isInPublicFolder;
    }
    
    public onFileChange(callback: (event: FileChangeEvent) => void): void {
        this.changeCallbacks.push(callback);
    }
    
    public removeFileChangeCallback(callback: (event: FileChangeEvent) => void): void {
        const index = this.changeCallbacks.indexOf(callback);
        if (index > -1) {
            this.changeCallbacks.splice(index, 1);
        }
    }
    
    public stopWatching(): void {
        this.changeCallbacks = [];
        this.logger.info('Surveillance des fichiers arrêtée', 'file');
    }
    
    public setWatchedExtensions(extensions: string[]): void {
        this.watchedExtensions = extensions;
        this.logger.info(`Extensions surveillées mises à jour: ${extensions.join(', ')}`, 'file');
    }
    
    /**
     * ✅ NOUVEAU: Met à jour le dossier public à surveiller
     */
    public setPublicFolderPath(publicFolderPath: string): void {
        this.publicFolderPath = publicFolderPath;
        this.logger.info(`Dossier public mis à jour: ${publicFolderPath || 'TOUS LES DOSSIERS'}`, 'file');
    }
    
    /**
     * ✅ NOUVEAU: Obtient le dossier public actuellement surveillé
     */
    public getPublicFolderPath(): string {
        return this.publicFolderPath;
    }
    
    /**
     * ✅ NOUVEAU: Statistiques de surveillance
     */
    public getWatchingStats(): {
        extensions: string[];
        publicFolder: string;
        callbacksCount: number;
    } {
        return {
            extensions: [...this.watchedExtensions],
            publicFolder: this.publicFolderPath,
            callbacksCount: this.changeCallbacks.length
        };
    }
}