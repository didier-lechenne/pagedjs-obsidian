import { Notice, Modal, App } from 'obsidian';
import { Logger } from '../utils/Logger';
import { LogEntry } from '../types/interfaces';

export class ServerCommands {
    private plugin: any; // NodeServer
    private logger: Logger;
    
    constructor(plugin: any) {
        this.plugin = plugin;
        this.logger = Logger.getInstance();
    }
    
    public async toggleServer(): Promise<void> {
        if (this.plugin.isServerRunning()) {
            await this.plugin.stopServer();
            this.logger.info('Serveur arrêté via commande', 'server');
        } else {
            await this.plugin.startServer();
            this.logger.info('Serveur démarré via commande', 'server');
        }
    }
    
    public openInBrowser(): void {
        if (!this.plugin.isServerRunning()) {
            new Notice('❌ Le serveur n\'est pas démarré');
            this.logger.warn('Tentative d\'ouverture navigateur avec serveur arrêté', 'server');
            return;
        }
        
        const port = this.plugin.getServerPort();
        const url = `http://localhost:${port}`;
        
        try {
            require('electron').shell.openExternal(url);
            new Notice(`🌐 Ouverture de ${url}`);
            this.logger.info(`Navigateur ouvert sur ${url}`, 'server');
        } catch (error: any) {
            new Notice(`❌ Erreur lors de l'ouverture du navigateur: ${error.message}`);
            this.logger.error(`Erreur ouverture navigateur: ${error.message}`, 'server');
        }
    }
    
    public showStatus(): void {
        const status = this.plugin.getServerStatus();
        
        if (!status) {
            new Notice('❌ Serveur non initialisé');
            return;
        }
        
        const statusText = status.isRunning 
            ? `✅ Serveur actif sur le port ${status.port}\n⏱️ Uptime: ${this.formatUptime(status.uptime)}\n🔄 Dernière modification: ${new Date(status.lastModified).toLocaleString()}`
            : '❌ Serveur arrêté';
            
        new Notice(statusText, 5000);
        this.logger.info('Statut affiché via commande', 'server');
    }
    
    public showLogs(): void {
        new LogModal(this.plugin.app, this.logger.getHistory()).open();
        this.logger.info('Logs affichés via commande', 'server');
    }
    
    public async restartServer(): Promise<void> {
        this.logger.info('Redémarrage du serveur via commande', 'server');
        new Notice('🔄 Redémarrage du serveur...');
        
        if (this.plugin.isServerRunning()) {
            await this.plugin.stopServer();
        }
        
        // Petite pause pour s'assurer que tout est bien fermé
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await this.plugin.startServer();
        new Notice('✅ Serveur redémarré');
    }
    
    private formatUptime(milliseconds: number): string {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
}

class LogModal extends Modal {
    private logs: LogEntry[];
    
    constructor(app: App, logs: LogEntry[]) {
        super(app);
        this.logs = logs;
    }
    
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        
        // Titre
        contentEl.createEl('h2', { text: '📋 Journaux du serveur' });
        
        // Statistiques
        const stats = this.getLogStats();
        const statsEl = contentEl.createDiv('log-stats');
        statsEl.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
                <div style="text-align: center; padding: 10px; background: #e3f2fd; border-radius: 6px;">
                    <div style="font-size: 24px; font-weight: bold; color: #1976d2;">${stats.total}</div>
                    <div style="font-size: 12px; color: #666;">Total</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #fff3e0; border-radius: 6px;">
                    <div style="font-size: 24px; font-weight: bold; color: #f57c00;">${stats.warn}</div>
                    <div style="font-size: 12px; color: #666;">Warnings</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #ffebee; border-radius: 6px;">
                    <div style="font-size: 24px; font-weight: bold; color: #d32f2f;">${stats.error}</div>
                    <div style="font-size: 12px; color: #666;">Erreurs</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #e8f5e8; border-radius: 6px;">
                    <div style="font-size: 24px; font-weight: bold; color: #388e3c;">${stats.info}</div>
                    <div style="font-size: 12px; color: #666;">Info</div>
                </div>
            </div>
        `;
        
        // Container pour les logs
        const logsContainer = contentEl.createDiv('logs-container');
        logsContainer.style.cssText = `
            max-height: 400px; 
            overflow-y: auto; 
            border: 1px solid #ddd; 
            border-radius: 6px; 
            background: #fafafa;
        `;
        
        // Afficher les logs (les plus récents en premier)
        const recentLogs = this.logs.slice(-50).reverse();
        
        if (recentLogs.length === 0) {
            logsContainer.createDiv().innerHTML = `
                <div style="padding: 20px; text-align: center; color: #666;">
                    📝 Aucun log disponible
                </div>
            `;
        } else {
            recentLogs.forEach(log => {
                const logEl = logsContainer.createDiv('log-entry');
                logEl.style.cssText = `
                    padding: 8px 12px; 
                    border-bottom: 1px solid #eee; 
                    font-family: 'Courier New', monospace; 
                    font-size: 12px;
                `;
                
                const levelColor = this.getLevelColor(log.level);
                const timestamp = new Date(log.timestamp).toLocaleTimeString();
                
                logEl.innerHTML = `
                    <span style="color: #666;">${timestamp}</span>
                    <span style="color: ${levelColor}; font-weight: bold; margin: 0 8px;">[${log.level.toUpperCase()}]</span>
                    ${log.category ? `<span style="color: #2196F3; margin-right: 8px;">[${log.category.toUpperCase()}]</span>` : ''}
                    <span>${log.message}</span>
                `;
            });
        }
        
        // Boutons
        const buttonContainer = contentEl.createDiv();
        buttonContainer.style.cssText = 'margin-top: 20px; text-align: right;';
        
        const clearBtn = buttonContainer.createEl('button', { text: '🗑️ Vider les logs' });
        clearBtn.style.cssText = 'margin-right: 10px; padding: 8px 16px;';
        clearBtn.onclick = () => {
            Logger.getInstance().clearHistory();
            new Notice('📝 Logs vidés');
            this.close();
        };
        
        const closeBtn = buttonContainer.createEl('button', { text: 'Fermer' });
        closeBtn.style.cssText = 'padding: 8px 16px;';
        closeBtn.onclick = () => this.close();
    }
    
    private getLogStats() {
        return {
            total: this.logs.length,
            error: this.logs.filter(l => l.level === 'error').length,
            warn: this.logs.filter(l => l.level === 'warn').length,
            info: this.logs.filter(l => l.level === 'info').length,
            debug: this.logs.filter(l => l.level === 'debug').length
        };
    }
    
    private getLevelColor(level: string): string {
        const colors = {
            'error': '#d32f2f',
            'warn': '#f57c00',
            'info': '#1976d2',
            'debug': '#388e3c'
        };
        return (colors as any)[level] || '#666';
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}