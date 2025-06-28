import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import { ServerConfig, ServerStatus } from '../types/interfaces';
import { Logger } from '../utils/Logger';

export class Server {
    private server: http.Server | null = null;
    private config: ServerConfig;
    private logger: Logger;
    private startTime: number = 0;
    private lastModified: number = Date.now();
    
    // MIME types simplifiés
    private mimeTypes: { [key: string]: string } = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.txt': 'text/plain; charset=utf-8',
        '.pdf': 'application/pdf'
    };
    
    constructor(config: ServerConfig) {
        this.config = config;
        this.logger = Logger.getInstance();
    }
    
    // =================== SERVEUR HTTP ===================
    
    public async start(): Promise<void> {
        if (this.server) {
            this.logger.warn('Le serveur est déjà en cours d\'exécution', 'server');
            return;
        }
        
        return new Promise((resolve, reject) => {
            try {
                this.server = http.createServer((req, res) => {
                    this.handleRequest(req, res);
                });
                
                this.server.listen(this.config.port, () => {
                    this.startTime = Date.now();
                    this.logger.info(`Serveur démarré sur http://localhost:${this.config.port}`, 'server');
                    this.logger.info(`Dossier public : ${this.config.publicPath}`, 'server');
                    resolve();
                });
                
                this.server.on('error', (err: any) => {
                    if (err.code === 'EADDRINUSE') {
                        this.config.port++;
                        this.logger.warn(`Port occupé, essai du port ${this.config.port}`, 'server');
                        this.server = null;
                        this.start().then(resolve).catch(reject);
                    } else {
                        this.logger.error(`Erreur serveur : ${err.message}`, 'server');
                        reject(err);
                    }
                });
                
            } catch (error: any) {
                this.logger.error(`Erreur lors du démarrage : ${error.message}`, 'server');
                reject(error);
            }
        });
    }
    
    public async stop(): Promise<void> {
        if (!this.server) {
            this.logger.warn('Aucun serveur en cours d\'exécution', 'server');
            return;
        }
        
        return new Promise((resolve) => {
            this.server!.close(() => {
                this.logger.info('Serveur HTTP arrêté', 'server');
                this.server = null;
                this.startTime = 0;
                resolve();
            });
        });
    }
    
    public getStatus(): ServerStatus {
        return {
            isRunning: this.server !== null,
            port: this.config.port,
            lastModified: this.lastModified,
            uptime: this.startTime ? Date.now() - this.startTime : 0
        };
    }
    
    public getPort(): number {
        return this.config.port;
    }
    
    public isRunning(): boolean {
        return this.server !== null;
    }
    
    public updateLastModified(timestamp: number): void {
        this.lastModified = timestamp;
        this.logger.debug(`LastModified mis à jour: ${timestamp}`, 'reload');
    }
    

    public updatePublicPath(newPath: string): void {
        this.config.publicPath = newPath;
        this.logger.info(`Chemin public mis à jour: ${newPath}`, 'server');
    }
    
    // =================== GESTION DES REQUÊTES ===================
    
    private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
        const parsedUrl = url.parse(req.url || '/', true);
        const pathname = parsedUrl.pathname || '/';
        const query = parsedUrl.query as { [key: string]: string };
        
        this.logger.debug(`${req.method} ${pathname}`, 'request');
        
        try {
            // Router simplifié
            if (pathname === '/status') {
                this.handleStatusRequest(res);
            } else if (pathname === '/api/logs') {
                this.handleLogsRequest(query, res);
            } else {
                this.handleStaticFile(pathname, res);
            }
        } catch (error: any) {
            this.logger.error(`Erreur lors du traitement de la requête: ${error.message}`, 'request');
            this.sendErrorResponse(res, 500, 'Erreur interne du serveur');
        }
    }
    
    // =================== ROUTES SPÉCIALES ===================
    
    private handleStatusRequest(res: http.ServerResponse): void {
        const statusData = {
            status: 'ok',
            lastModified: this.lastModified,
            time: Date.now(),
            uptime: this.startTime ? Date.now() - this.startTime : 0,
            version: '1.0.0'
        };
        
        this.sendJsonResponse(res, statusData);
    }
    
    private handleLogsRequest(query: { [key: string]: string }, res: http.ServerResponse): void {
        const logs = this.logger.getHistory();
        const limit = parseInt(query.limit) || 50;
        const filteredLogs = logs.slice(-limit);
        
        this.sendJsonResponse(res, {
            logs: filteredLogs,
            total: logs.length,
            limit: limit
        });
    }
    
    // =================== FICHIERS STATIQUES ===================
    
    private handleStaticFile(pathname: string, res: http.ServerResponse): void {
        // Si c'est la racine, servir index.html
        if (pathname === '/') {
            pathname = '/index.html';
        }
        
        const filePath = path.join(this.config.publicPath, pathname);
        
        // Vérification de sécurité
        if (!this.isPathSafe(filePath)) {
            this.logger.warn(`Tentative d'accès non autorisé: ${pathname}`, 'request');
            this.sendErrorResponse(res, 403, 'Accès interdit');
            return;
        }
        
        this.serveFile(filePath, res);
    }
    
    private isPathSafe(filePath: string): boolean {
        const resolvedPath = path.resolve(filePath);
        const resolvedPublicPath = path.resolve(this.config.publicPath);
        return resolvedPath.startsWith(resolvedPublicPath);
    }
    
    private serveFile(filePath: string, res: http.ServerResponse): void {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    this.send404Response(res);
                } else {
                    this.logger.error(`Erreur lors de la lecture du fichier ${filePath}: ${err.message}`, 'request');
                    this.sendErrorResponse(res, 500, 'Erreur lors de la lecture du fichier');
                }
                return;
            }
            
            const ext = path.extname(filePath).toLowerCase();
            const contentType = this.getContentType(ext);
            
            res.writeHead(200, {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            
            // Injecter le script de rechargement pour les fichiers HTML
            if (ext === '.html') {
                const modifiedHtml = this.injectReloadScript(data.toString());
                res.end(modifiedHtml);
            } else {
                res.end(data);
            }
        });
    }
    
    // =================== UTILITAIRES ===================
    
    private getContentType(extension: string): string {
        return this.mimeTypes[extension] || 'application/octet-stream';
    }
    
    private injectReloadScript(htmlContent: string): string {
        const reloadScript = `
<script>
(function() {
    let lastCheck = ${this.lastModified};
    console.log('🚀 [AUTO-RELOAD] Script initialisé - lastCheck:', lastCheck);
    
    async function checkForUpdates() {
        try {
            const response = await fetch('/status');
            const data = await response.json();
            
            if (data.lastModified > lastCheck) {
                console.log('🔄 [AUTO-RELOAD] Changement détecté - Rechargement !');
                console.log('🔄 [AUTO-RELOAD] Ancien:', lastCheck, 'Nouveau:', data.lastModified);
                location.reload();
            }
            lastCheck = data.lastModified;
        } catch (error) {
            console.warn('❌ [AUTO-RELOAD] Erreur de connexion:', error);
        }
    }
    
    // Vérifier toutes les secondes
    setInterval(checkForUpdates, 1000);
    
    console.log('🎯 [AUTO-RELOAD] Prêt - Modifiez un fichier .md pour tester !');
})();
</script>`;
        
        return htmlContent.replace('</body>', reloadScript + '</body>');
    }
    
    private send404Response(res: http.ServerResponse): void {
        // ✅ SIMPLIFIÉ: Template 404 intégré directement
        const errorHtml = this.get404Template();
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(errorHtml);
    }
    
    /**
     * ✅ NOUVEAU: Template 404 intégré (pas de fichier externe)
     */
    private get404Template(): string {
        return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page non trouvée</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        .container {
            background: rgba(255, 255, 255, 0.95);
            padding: 40px;
            border-radius: 15px;
            text-align: center;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        }
        .error-code {
            font-size: 6rem;
            font-weight: 900;
            color: #667eea;
            margin-bottom: 20px;
        }
        .error-title {
            font-size: 2rem;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 20px;
        }
        .error-message {
            font-size: 1.1rem;
            color: #7f8c8d;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        .path-info {
            background: #e8f4fd;
            border: 1px solid #bee5eb;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-family: monospace;
            font-size: 0.9rem;
            word-break: break-all;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 10px;
            transition: transform 0.3s ease;
            cursor: pointer;
            border: none;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .help {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
        }
        code {
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-code">404</div>
        <h1 class="error-title">Page non trouvée</h1>
        <p class="error-message">
            Le fichier que vous cherchez n'existe pas.
        </p>
        
        <div class="path-info">
            <strong>📂 Chemin public :</strong><br>
            ${this.config.publicPath}
        </div>
        
        <div class="help">
            <h3>💡 Pour commencer :</h3>
            <ol>
                <li>Créez le dossier <code>${path.basename(this.config.publicPath)}/</code> dans votre coffre Obsidian</li>
                <li>Placez votre fichier <code>index.html</code> dans ce dossier</li>
                <li>Actualisez cette page</li>
            </ol>
        </div>
        
        <button onclick="location.href='/'" class="btn">🏠 Retour à l'accueil</button>
        <button onclick="location.reload()" class="btn">🔄 Actualiser</button>
    </div>
</body>
</html>`;
    }
    
    
    private sendJsonResponse(res: http.ServerResponse, data: any): void {
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(data, null, 2));
    }
    
    private sendErrorResponse(res: http.ServerResponse, statusCode: number, message: string): void {
        res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
        res.end(message);
    }
}