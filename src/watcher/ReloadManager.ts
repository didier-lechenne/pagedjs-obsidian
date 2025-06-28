import { FileChangeEvent, ReloadClient } from '../types/interfaces';
import { Logger } from '../utils/Logger';

export class ReloadManager {
    private logger: Logger;
    private lastModified: number = Date.now();
    private clients: Map<string, ReloadClient> = new Map();
    private changeQueue: FileChangeEvent[] = [];
    private debounceTimeout: NodeJS.Timeout | null = null;
    private debounceDelay: number = 500; // ms
    
    constructor() {
        this.logger = Logger.getInstance();
    }
    
    /**
     * Enregistre un changement de fichier
     */
    public registerFileChange(event: FileChangeEvent): void {
        this.changeQueue.push(event);
        
        this.logger.debug(`Changement enregistré: ${event.fileName} (${event.changeType})`, 'reload');
        
        // Débounce pour éviter trop de rechargements rapides
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
        
        this.debounceTimeout = setTimeout(() => {
            this.processChangeQueue();
        }, this.debounceDelay);
    }
    
    /**
     * Traite la queue des changements
     */
    private processChangeQueue(): void {
        if (this.changeQueue.length === 0) return;
        
        // Grouper les changements par fichier (garder le plus récent)
        const latestChanges = new Map<string, FileChangeEvent>();
        
        this.changeQueue.forEach(change => {
            const existing = latestChanges.get(change.filePath);
            if (!existing || change.timestamp > existing.timestamp) {
                latestChanges.set(change.filePath, change);
            }
        });
        
        // Mettre à jour le timestamp global
        const latestTimestamp = Math.max(...Array.from(latestChanges.values()).map(c => c.timestamp));
        this.lastModified = latestTimestamp;
        
        // Logger les changements traités
        const changedFiles = Array.from(latestChanges.values());
        this.logger.info(`Rechargement déclenché par ${changedFiles.length} fichier(s)`, 'reload');
        
        changedFiles.forEach(change => {
            this.logger.debug(`- ${change.fileName} (${change.changeType})`, 'reload');
        });
        
        // Vider la queue
        this.changeQueue = [];
        this.debounceTimeout = null;
        
        // Notifier les statistiques
        this.logReloadStats();
    }
    
    /**
     * Enregistre un client pour les statistiques
     */
    public registerClient(clientId: string, userAgent?: string): void {
        const client: ReloadClient = {
            id: clientId,
            lastCheck: Date.now(),
            userAgent
        };
        
        this.clients.set(clientId, client);
        this.logger.debug(`Client enregistré: ${clientId}`, 'reload');
    }
    
    /**
     * Met à jour le timestamp de dernière vérification d'un client
     */
    public updateClientCheck(clientId: string): void {
        const client = this.clients.get(clientId);
        if (client) {
            client.lastCheck = Date.now();
        }
    }
    
    /**
     * Nettoie les clients inactifs (plus de 5 minutes)
     */
    public cleanupInactiveClients(): void {
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        let removedCount = 0;
        
        for (const [clientId, client] of this.clients.entries()) {
            if (client.lastCheck < fiveMinutesAgo) {
                this.clients.delete(clientId);
                removedCount++;
            }
        }
        
        if (removedCount > 0) {
            this.logger.debug(`${removedCount} client(s) inactif(s) supprimé(s)`, 'reload');
        }
    }
    
    /**
     * Obtient le timestamp de la dernière modification
     */
    public getLastModified(): number {
        return this.lastModified;
    }
    
    /**
     * Obtient les statistiques de rechargement
     */
    public getStats() {
        this.cleanupInactiveClients();
        
        return {
            lastModified: this.lastModified,
            activeClients: this.clients.size,
            pendingChanges: this.changeQueue.length,
            clientList: Array.from(this.clients.values()).map(client => ({
                id: client.id,
                lastCheck: client.lastCheck,
                userAgent: client.userAgent,
                inactive: (Date.now() - client.lastCheck) > (2 * 60 * 1000) // 2 minutes
            }))
        };
    }
    
    /**
     * Force un rechargement (met à jour le timestamp)
     */
    public forceReload(reason?: string): void {
        this.lastModified = Date.now();
        this.logger.info(`Rechargement forcé${reason ? ` - ${reason}` : ''}`, 'reload');
    }
    
    /**
     * Configure le délai de debounce
     */
    public setDebounceDelay(delay: number): void {
        this.debounceDelay = Math.max(100, Math.min(5000, delay)); // Entre 100ms et 5s
        this.logger.debug(`Délai de debounce mis à jour: ${this.debounceDelay}ms`, 'reload');
    }
    
    /**
     * Réinitialise le gestionnaire
     */
    public reset(): void {
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = null;
        }
        
        this.changeQueue = [];
        this.clients.clear();
        this.lastModified = Date.now();
        
        this.logger.info('Gestionnaire de rechargement réinitialisé', 'reload');
    }
    
    /**
     * Log des statistiques de rechargement
     */
    private logReloadStats(): void {
        const stats = this.getStats();
        this.logger.debug(`Stats reload - Clients actifs: ${stats.activeClients}, Timestamp: ${stats.lastModified}`, 'reload');
    }
    
    /**
     * Obtient un résumé des changements récents pour debug
     */
    public getRecentChanges(limit: number = 10): FileChangeEvent[] {
        return this.changeQueue.slice(-limit);
    }
}