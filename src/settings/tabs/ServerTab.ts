import { Setting } from "obsidian";
import { BaseTab } from "./BaseTab";

export class ServerTab extends BaseTab {
    display(containerEl: HTMLElement): void {
        containerEl.createEl("h2", { text: "🖥️ Configuration du serveur" });

        this.createServerControls(containerEl);
        this.createServerSettings(containerEl);
        this.createServerActions(containerEl);
        this.createServerInfo(containerEl);
        this.createFileWatcherInfo(containerEl); // ✅ NOUVEAU
    }

    private createServerControls(containerEl: HTMLElement): void {
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
                        this.refreshDisplay(containerEl);
                    })
            );
    }

    private createServerSettings(containerEl: HTMLElement): void {
        // Paramètre Démarrage automatique
        new Setting(containerEl)
            .setName("Démarrage automatique")
            .setDesc("Démarrer le serveur automatiquement au chargement du plugin")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.autoStart)
                    .onChange(async (value) => {
                        this.plugin.settings.autoStart = value;
                        await this.saveSettings();
                    })
            );
    }

    private createServerActions(containerEl: HTMLElement): void {
        this.createSectionTitle(containerEl, "🔧 Actions du serveur");

        // Ouvrir dans le navigateur
        new Setting(containerEl)
            .setName("Ouvrir dans le navigateur")
            .setDesc("Ouvrir l'interface web du serveur dans votre navigateur")
            .addButton((button) => {
                button
                    .setButtonText("🌐 Ouvrir")
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

        // Redémarrer le serveur
        new Setting(containerEl)
            .setName("Redémarrer le serveur")
            .setDesc("Redémarrer le serveur HTTP (utile après changement de configuration)")
            .addButton((button) => {
                button
                    .setButtonText("🔄 Redémarrer")
                    .setWarning()
                    .onClick(async () => {
                        await this.restartServer();
                        this.refreshDisplay(containerEl);
                    });

                // Désactiver si le serveur n'est pas en cours d'exécution
                if (!this.plugin.isServerRunning()) {
                    button.setDisabled(true);
                    button.setTooltip("Le serveur doit être démarré pour être redémarré");
                }
            });

        // Afficher les logs
        new Setting(containerEl)
            .setName("Afficher les logs")
            .setDesc("Ouvrir la fenêtre des journaux du serveur")
            .addButton((button) =>
                button
                    .setButtonText("📋 Logs")
                    .onClick(() => {
                        // Utiliser une méthode publique pour afficher les logs
                        this.plugin.showLogs();
                    })
            );
    }

    private createServerInfo(containerEl: HTMLElement): void {
        this.createSectionTitle(containerEl, "ℹ️ Informations du serveur");

        const infoContainer = this.createContainer(containerEl, "pagedjs-info-section");
        
        const serverStatus = this.plugin.getServerStatus();
        
        if (serverStatus) {
            // Statut du serveur
            const statusEl = infoContainer.createEl("div", { cls: "info-item" });
            statusEl.innerHTML = `
                <strong>📡 Statut :</strong> 
                <span class="${serverStatus.isRunning ? 'status-success' : 'status-error'}">
                    ${serverStatus.isRunning ? '🟢 En ligne' : '🔴 Arrêté'}
                </span>
            `;

            if (serverStatus.isRunning) {
                // Port du serveur
                const portEl = infoContainer.createEl("div", { cls: "info-item" });
                portEl.innerHTML = `
                    <strong>🔌 Port :</strong> 
                    <code>${serverStatus.port}</code>
                `;

                // URL du serveur
                const urlEl = infoContainer.createEl("div", { cls: "info-item" });
                urlEl.innerHTML = `
                    <strong>🌐 URL :</strong> 
                    <code>http://localhost:${serverStatus.port}</code>
                `;

                // Uptime
                const uptimeEl = infoContainer.createEl("div", { cls: "info-item" });
                uptimeEl.innerHTML = `
                    <strong>⏱️ Uptime :</strong> 
                    <span>${this.formatUptime(serverStatus.uptime)}</span>
                `;

                // Dernière modification
                const lastModEl = infoContainer.createEl("div", { cls: "info-item" });
                lastModEl.innerHTML = `
                    <strong>🔄 Dernière modification :</strong> 
                    <span>${new Date(serverStatus.lastModified).toLocaleString()}</span>
                `;

                // Dossier servi
                const folderEl = infoContainer.createEl("div", { cls: "info-item" });
                folderEl.innerHTML = `
                    <strong>📁 Dossier servi :</strong> 
                    <code>${this.plugin.settings.publicFolder}</code>
                `;
            }
        } else {
            const noInfoEl = infoContainer.createEl("div", { cls: "info-item" });
            noInfoEl.innerHTML = `
                <span class="status-error">❌ Aucune information disponible</span>
            `;
        }
    }

    /**
     * ✅ NOUVEAU: Informations de surveillance des fichiers
     */
    private createFileWatcherInfo(containerEl: HTMLElement): void {
        this.createSectionTitle(containerEl, "👁️ Surveillance des fichiers");

        const watcherContainer = this.createContainer(containerEl, "pagedjs-info-section");
        
        if (this.plugin.fileWatcher) {
            const watchStats = this.plugin.fileWatcher.getWatchingStats();
            
            // Dossier surveillé
            const folderEl = watcherContainer.createEl("div", { cls: "info-item" });
            folderEl.innerHTML = `
                <strong>📂 Dossier surveillé :</strong> 
                <code>${watchStats.publicFolder || '❌ TOUS LES DOSSIERS (non configuré)'}</code>
            `;
            
            // Extensions surveillées
            const extensionsEl = watcherContainer.createEl("div", { cls: "info-item" });
            extensionsEl.innerHTML = `
                <strong>📄 Extensions surveillées :</strong> 
                <code>${watchStats.extensions.join(', ')}</code>
            `;
            
            // Nombre de callbacks actifs
            const callbacksEl = watcherContainer.createEl("div", { cls: "info-item" });
            callbacksEl.innerHTML = `
                <strong>🔗 Callbacks actifs :</strong> 
                <span>${watchStats.callbacksCount}</span>
            `;
            
            // Status de la surveillance
            const isWatching = this.plugin.isServerRunning(); // La surveillance suit l'état du serveur
            const statusEl = watcherContainer.createEl("div", { cls: "info-item" });
            statusEl.innerHTML = `
                <strong>👀 État surveillance :</strong> 
                <span class="${isWatching ? 'status-success' : 'status-error'}">
                    ${isWatching ? '🟢 Active' : '🔴 Inactive'}
                </span>
            `;
            
            // ✅ Message d'aide si la surveillance n'est pas limitée
            if (!watchStats.publicFolder || watchStats.publicFolder.trim() === '') {
                const warningEl = watcherContainer.createEl("div", { cls: "info-item" });
                warningEl.innerHTML = `
                    <span class="status-error">
                        ⚠️ La surveillance s'applique à TOUS les fichiers .md du coffre !<br>
                        <em>Configurez le "Dossier à servir" dans l'onglet Configurations pour limiter la surveillance.</em>
                    </span>
                `;
            } else {
                const successEl = watcherContainer.createEl("div", { cls: "info-item" });
                successEl.innerHTML = `
                    <span class="status-success">
                        ✅ Surveillance limitée au dossier spécifié uniquement
                    </span>
                `;
            }
            
        } else {
            const noWatcherEl = watcherContainer.createEl("div", { cls: "info-item" });
            noWatcherEl.innerHTML = `
                <span class="status-error">❌ FileWatcher non initialisé</span>
            `;
        }
    }

    /**
     * Redémarre le serveur
     */
    private async restartServer(): Promise<void> {
        // Utiliser les méthodes publiques du plugin
        await this.plugin.stopServer();
        // Attendre un peu pour s'assurer que tout est fermé
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.plugin.startServer();
    }

    /**
     * Formate le temps d'uptime en format lisible
     */
    private formatUptime(milliseconds: number): string {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}j ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Rafraîchit l'affichage de l'onglet
     */
    private refreshDisplay(containerEl: HTMLElement): void {
        containerEl.empty();
        this.display(containerEl);
    }
}