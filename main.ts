import { Plugin, Notice, TFile } from 'obsidian';
import * as path from 'path';
import { ServerConfig } from './src/types/interfaces';
import { Logger } from './src/utils/Logger';
import { Server } from './src/server/server';
import { FileWatcher } from './src/watcher/FileWatcher';
import { ServerCommands } from './src/commands/ServerCommands';
import { PagedJSSettingsTab, PagedJSSettings, DEFAULT_SETTINGS } from './src/settings/SettingsTab';
import { YamlConfigManager } from './src/utils/YamlConfigManager';

export default class NodeServer extends Plugin {
    settings: PagedJSSettings;

    private server: Server | null = null;
    public fileWatcher: FileWatcher | null = null;
    private serverCommands: ServerCommands | null = null;
    private logger: Logger;
    private config: ServerConfig;
    private yamlManager: YamlConfigManager;

    constructor(app: any, manifest: any) {
        super(app, manifest);
        this.logger = Logger.getInstance();
        this.yamlManager = new YamlConfigManager(app);
        
        // Configuration par défaut
        this.config = {
            port: 3001,
            publicPath: '',
            autoStart: true,
            watchExtensions: ['md']
        };
    }
    
    async onload() {
        this.logger.info('Chargement du plugin pagedjs-server', 'server');

        // Charger les settings
        await this.loadSettings();

        this.config = {
            port: 3001,
            publicPath: '',
            autoStart: this.settings.autoStart,  
            watchExtensions: ['md']
        };
        
        // Initialiser le chemin public
        this.config.publicPath = path.join(
            (this.app.vault.adapter as any).basePath, 
            this.settings.publicFolder
        );
        
        // Initialiser les composants
        this.initializeComponents();
        
        // Configurer les commandes
        this.setupCommands();
        
        // Démarrer automatiquement si configuré
        if (this.config.autoStart) {
            await this.startServer();
        }

        // Ajouter le bouton dans le ribbon
        this.addRibbonIcon('globe', 'Ouvrir PagedJS Server', (evt: MouseEvent) => {
            this.openInBrowser();
        });

        this.logger.info('Plugin pagedjs-server chargé avec succès', 'server');

        this.addSettingTab(new PagedJSSettingsTab(this.app, this));
    }
    
    private initializeComponents(): void {
        // Initialiser le serveur fusionné
        this.server = new Server(this.config);
        
        // ✅ CORRECTION: Initialiser le watcher avec le dossier public
        this.fileWatcher = new FileWatcher(
            this.app.vault, 
            this.config.watchExtensions,
            this.settings.publicFolder // ✅ NOUVEAU: Passer le dossier public
        );
        
        // Initialiser les commandes
        this.serverCommands = new ServerCommands(this);
        
        // Connecter le watcher au serveur pour le rechargement automatique
        this.fileWatcher.onFileChange((event) => {
            if (this.server) {
                this.server.updateLastModified(event.timestamp);
                this.logger.info(`Auto-reload déclenché par: ${event.fileName} (dossier: ${this.settings.publicFolder})`, 'reload');
            }
        });
    }
    
    private setupCommands(): void {
        if (!this.serverCommands) return;
        
        // Commande pour démarrer/arrêter le serveur
        this.addCommand({
            id: 'toggle-pagedjs-server',
            name: 'Démarrer/Arrêter le serveur',
            callback: () => this.serverCommands!.toggleServer()
        });
        
        // Commande pour ouvrir dans le navigateur
        this.addCommand({
            id: 'open-in-browser',
            name: 'Ouvrir dans le navigateur',
            callback: () => this.serverCommands!.openInBrowser()
        });
        
        // Commande pour voir le statut
        this.addCommand({
            id: 'server-status',
            name: 'Statut du serveur',
            callback: () => this.serverCommands!.showStatus()
        });
        
        // Commande pour voir les logs
        this.addCommand({
            id: 'show-logs',
            name: 'Afficher les logs',
            callback: () => this.serverCommands!.showLogs()
        });
    }

    // =================== MÉTHODES PUBLIQUES POUR LES ONGLETS ===================

    /**
     * Méthode publique pour afficher les logs
     */
    public showLogs(): void {
        if (this.serverCommands) {
            this.serverCommands.showLogs();
        } else {
            new Notice('❌ Le serveur n\'est pas initialisé');
        }
    }

    /**
     * Méthode publique pour ouvrir dans le navigateur
     */
    public openInBrowser(): void {
        if (this.serverCommands) {
            this.serverCommands.openInBrowser();
        } else {
            new Notice('❌ Le serveur n\'est pas initialisé');
        }
    }

    /**
     * Méthode publique pour redémarrer le serveur
     */
    public async restartServer(): Promise<void> {
        this.logger.info('Redémarrage du serveur via interface', 'server');
        new Notice('🔄 Redémarrage du serveur...');
        
        await this.stopServer();
        // Attendre un peu pour s'assurer que tout est fermé
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.startServer();
        
        new Notice('✅ Serveur redémarré');
    }

    /**
     * ✅ NOUVEAU: Exposer l'instance du serveur pour mise à jour du chemin
     */
    public getServerInstance(): Server | null {
        return this.server;
    }

    /**
     * ✅ MÉTHODE PUBLIQUE: Forcer le rechargement du config.yml actuel
     */
    public async forceReloadCurrentConfig(): Promise<boolean> {
        console.log('🔄 Rechargement forcé du config.yml actuel...');
        
        try {
            const yamlConfig = await this.yamlManager.loadConfigFromYaml(this.settings);
            
            if (yamlConfig) {
                console.log('📊 Données YAML chargées:', yamlConfig);
                
                // Préserver certaines valeurs critiques
                const currentPublicFolder = this.settings.publicFolder;
                const currentAutoStart = this.settings.autoStart;
                
                // Appliquer TOUTES les données YAML
                Object.assign(this.settings, yamlConfig);
                
                // Restaurer les valeurs critiques
                this.settings.publicFolder = currentPublicFolder;
                this.settings.autoStart = currentAutoStart;
                
                console.log('✅ Settings forcés avec:', this.settings.parts?.length || 0, 'parties');
                console.log('📊 Nouvelles parts:', this.settings.parts);
                
                // Sauvegarder immédiatement
                await this.saveData(this.settings);
                
                return true;
            } else {
                console.log('⚠️ Pas de config.yml trouvé');
                return false;
            }
        } catch (error: any) {
            console.error('❌ Erreur rechargement forcé:', error);
            return false;
        }
    }

    /**
     * ✅ CORRECTION: Recharger config.yml sans redémarrer le serveur
     */
    public async reloadConfigFromNewFolder(): Promise<void> {
        const newConfigPath = `${this.settings.publicFolder}/config.yml`;
        
        console.log('🔍 Recherche config.yml dans nouveau dossier:', newConfigPath);
        
        // ✅ CORRECTION: Mettre à jour le chemin du serveur immédiatement SANS redémarrer
        const newPublicPath = path.join(
            (this.app.vault.adapter as any).basePath, 
            this.settings.publicFolder
        );
        this.config.publicPath = newPublicPath;
        console.log('📁 Nouveau chemin serveur (config):', this.config.publicPath);
        
        // ✅ NOUVEAU: Mettre à jour le FileWatcher pour surveiller le nouveau dossier
        if (this.fileWatcher) {
            this.fileWatcher.setPublicFolderPath(this.settings.publicFolder);
            console.log('📂 FileWatcher mis à jour pour surveiller:', this.settings.publicFolder);
        }
        
        // ✅ CORRECTION: Mettre à jour le serveur SANS le redémarrer
        if (this.server && this.server.isRunning()) {
            this.server.updatePublicPath(newPublicPath);
            console.log('✅ Serveur mis à jour avec nouveau chemin sans redémarrage');
        }
        
        // ✅ CORRECTION: Utiliser la méthode sûre du YamlConfigManager
        try {
            const yamlConfig = await this.yamlManager.loadConfigFromYaml(this.settings);
            
            if (yamlConfig) {
                console.log('🔄 Config.yml trouvé, application des données...');
                console.log('📊 Données YAML reçues:', yamlConfig);
                
                // Préserver le publicFolder de l'input utilisateur
                const userPublicFolder = this.settings.publicFolder;
                
                // Appliquer les données YAML
                Object.assign(this.settings, yamlConfig);
                
                // Restaurer les valeurs critiques
                const criticalSettings = {
                    autoStart: this.settings.autoStart,
                    publicFolder: userPublicFolder // Garder la valeur de l'utilisateur
                };
                Object.assign(this.settings, criticalSettings);
                
                console.log('✅ Settings mis à jour avec:', this.settings.parts?.length || 0, 'parties');
                console.log('📊 Settings finaux:', { 
                    publicFolder: this.settings.publicFolder,
                    partsCount: this.settings.parts?.length || 0,
                    title: this.settings.title 
                });
                
                // Sauvegarder les settings mis à jour
                await this.saveData(this.settings);
                
                // ✅ CORRECTION: Déclencher l'événement de refresh APRÈS la sauvegarde
                const refreshEvent = new CustomEvent('pagedjs-settings-refreshed', {
                    detail: { 
                        settings: this.settings,
                        source: 'folder-change',
                        partsLoaded: this.settings.parts?.length || 0
                    }
                });
                document.dispatchEvent(refreshEvent);
                
                console.log('🎯 Événement refresh déclenché');
                
            } else {
                console.log('⚠️ Pas de config.yml trouvé dans:', newConfigPath);
                console.log('💡 Vous pouvez créer ce fichier avec l\'onglet Sauvegarde');
                
                // ✅ CORRECTION: Déclencher quand même un refresh pour vider l'interface
                const refreshEvent = new CustomEvent('pagedjs-settings-refreshed', {
                    detail: { 
                        settings: this.settings,
                        source: 'folder-change-no-config',
                        partsLoaded: 0
                    }
                });
                document.dispatchEvent(refreshEvent);
            }
        } catch (error: any) {
            console.error('❌ Erreur rechargement config.yml:', error);
        }
    }

    /**
     * ✅ NOUVEAU: Met à jour le dossier public surveillé (appelé depuis ConfigurationsTab)
     */
    public updatePublicFolder(newPublicFolder: string): void {
        console.log('📁 Mise à jour dossier public:', this.settings.publicFolder, '->', newPublicFolder);
        
        // Mettre à jour les settings
        this.settings.publicFolder = newPublicFolder;
        
        // Mettre à jour le chemin public du serveur
        this.config.publicPath = path.join(
            (this.app.vault.adapter as any).basePath, 
            newPublicFolder
        );
        
        // ✅ NOUVEAU: Mettre à jour le FileWatcher
        if (this.fileWatcher) {
            this.fileWatcher.setPublicFolderPath(newPublicFolder);
            console.log('📂 FileWatcher mis à jour pour surveiller:', newPublicFolder);
        }
        
        // Mettre à jour le serveur s'il est en cours d'exécution
        if (this.server && this.server.isRunning()) {
            this.server.updatePublicPath(this.config.publicPath);
            console.log('🖥️ Serveur mis à jour avec nouveau chemin:', this.config.publicPath);
        }
    }

    // =================== MÉTHODES DE CONTRÔLE DU SERVEUR ===================
    
    public async startServer(): Promise<void> {
        if (!this.server || !this.fileWatcher) {
            this.logger.error('Composants non initialisés', 'server');
            return;
        }
        
        try {
            await this.server.start();
            this.fileWatcher.startWatching();
            
            new Notice(`Serveur démarré sur le port ${this.server.getPort()}`);
            this.logger.info('Serveur et surveillance démarrés', 'server');
            
            // ✅ NOUVEAU: Logger les statistiques de surveillance
            const watchStats = this.fileWatcher.getWatchingStats();
            this.logger.info(`Surveillance: ${watchStats.extensions.join(', ')} dans ${watchStats.publicFolder || 'TOUS LES DOSSIERS'}`, 'file');
            
        } catch (error: any) {
            new Notice(`Erreur de démarrage: ${error.message}`);
            this.logger.error(`Erreur de démarrage: ${error.message}`, 'server');
        }
    }
    
    public async stopServer(): Promise<void> {
        if (!this.server || !this.fileWatcher) {
            new Notice('Aucun serveur en cours d\'exécution');
            return;
        }
        
        await this.server.stop();
        this.fileWatcher.stopWatching();
        
        new Notice('Serveur arrêté');
        this.logger.info('Serveur et surveillance arrêtés', 'server');
    }
    
    public getServerStatus() {
        return this.server?.getStatus() || null;
    }
    
    public isServerRunning(): boolean {
        return this.server?.isRunning() || false;
    }
    
    public getServerPort(): number {
        return this.server?.getPort() || this.config.port;
    }

    // =================== GESTION DES PARAMÈTRES ===================

    async loadSettings() {
        // 1. Charger data.json (peut ne pas exister au premier lancement)
        const dataSettings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        console.log('📁 publicFolder depuis data.json:', dataSettings.publicFolder);
        
        // 2. Essayer de charger config.yml dans ce dossier
        const configPath = `${dataSettings.publicFolder}/config.yml`;
        const configFile = this.app.vault.getAbstractFileByPath(configPath);
        
        console.log('🔍 Recherche de config.yml dans:', configPath);
        console.log('🔍 Fichier trouvé:', configFile instanceof TFile);
        
        if (configFile instanceof TFile) {
            this.logger.info('config.yml trouvé, chargement depuis YAML', 'config');
            try {
                // ✅ CORRECTION: Utiliser la nouvelle méthode
                const yamlConfig = await this.yamlManager.loadConfigFromYaml(dataSettings);
                console.log('🔧 Parties trouvées dans YAML:', yamlConfig?.parts?.length || 0);
                
                // 3. Fusionner : data.json + config.yml
                if (yamlConfig) {
                    this.settings = Object.assign({}, dataSettings, yamlConfig);
                    console.log('✅ Settings finaux - parties:', this.settings.parts?.length || 0);
                    this.logger.info(`Config YAML chargée avec ${this.settings.parts?.length || 0} parties`, 'config');
                } else {
                    this.settings = dataSettings;
                    console.log('⚠️ Erreur chargement YAML, utilisation data.json uniquement');
                }
                return;
            } catch (error: any) {
                console.error('❌ Erreur parsing YAML:', error);
                this.logger.error(`Erreur lecture config.yml: ${error.message}`, 'config');
            }
        }
        
        // 4. Si pas de config.yml, utiliser seulement data.json
        console.log('📁 Pas de config.yml, utilisation de data.json uniquement');
        this.settings = dataSettings;
        console.log('✅ Settings depuis data.json - parties:', this.settings.parts?.length || 0);
    }

    async saveSettings() {
        // Sauvegarder dans data.json
        await this.saveData(this.settings);
        console.log('💾 Settings sauvés dans data.json');
        
        // ✅ CORRECTION: Déclencher l'événement de refresh pour tous les onglets
        const refreshEvent = new CustomEvent('pagedjs-settings-refreshed', {
            detail: { 
                settings: this.settings,
                source: 'save'
            }
        });
        document.dispatchEvent(refreshEvent);
    }

    // =================== DÉCHARGEMENT ===================
    
    async onunload() {
        this.logger.info('Déchargement du plugin pagedjs-server', 'server');
        
        if (this.server?.isRunning()) {
            await this.stopServer();
        }
        
        // Nettoyer les ressources
        this.fileWatcher?.stopWatching();
        this.logger.clearHistory();
        
        this.logger.info('Plugin pagedjs-server déchargé', 'server');
    }
}