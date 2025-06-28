import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './Logger';

export class TemplateEngine {
    private logger: Logger;
    private templatesPath: string;
    private templateCache: Map<string, string> = new Map();
    
    constructor(templatesPath?: string) {
        this.logger = Logger.getInstance();
        // Par défaut, chercher les templates dans le plugin
        this.templatesPath = templatesPath || path.join(__dirname, '../../templates');
    }
    
    /**
     * Rend un template avec les variables fournies
     */
    public async render(templateName: string, variables: { [key: string]: any }): Promise<string> {
        try {
            const template = await this.loadTemplate(templateName);
            return this.processTemplate(template, variables);
        } catch (error: any) {
            this.logger.error(`Erreur lors du rendu du template ${templateName}: ${error.message}`, 'template');
            return this.getFallbackTemplate(templateName, variables);
        }
    }
    
    /**
     * Rend un template de manière synchrone
     */
    public renderSync(templateName: string, variables: { [key: string]: any }): string {
        try {
            const template = this.loadTemplateSync(templateName);
            return this.processTemplate(template, variables);
        } catch (error: any) {
            this.logger.error(`Erreur lors du rendu synchrone du template ${templateName}: ${error.message}`, 'template');
            return this.getFallbackTemplate(templateName, variables);
        }
    }
    
    /**
     * Charge un template depuis le système de fichiers
     */
    private async loadTemplate(templateName: string): Promise<string> {
        // Vérifier le cache
        const cacheKey = templateName;
        if (this.templateCache.has(cacheKey)) {
            return this.templateCache.get(cacheKey)!;
        }
        
        const templatePath = path.join(this.templatesPath, templateName);
        const template = await fs.promises.readFile(templatePath, 'utf-8');
        
        // Mettre en cache
        this.templateCache.set(cacheKey, template);
        
        return template;
    }
    
    /**
     * Charge un template de manière synchrone
     */
    private loadTemplateSync(templateName: string): string {
        // Vérifier le cache
        const cacheKey = templateName;
        if (this.templateCache.has(cacheKey)) {
            return this.templateCache.get(cacheKey)!;
        }
        
        const templatePath = path.join(this.templatesPath, templateName);
        const template = fs.readFileSync(templatePath, 'utf-8');
        
        // Mettre en cache
        this.templateCache.set(cacheKey, template);
        
        return template;
    }
    
    /**
     * Traite le template en remplaçant les variables
     */
    private processTemplate(template: string, variables: { [key: string]: any }): string {
        let processed = template;
        
        // Remplacer les variables simples {{VAR}}
        processed = processed.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
            const trimmedVarName = varName.trim();
            const value = variables[trimmedVarName];
            
            if (value !== undefined && value !== null) {
                return String(value);
            }
            
            // Si la variable n'existe pas, laisser le placeholder ou utiliser une valeur par défaut
            this.logger.warn(`Variable non trouvée dans le template: ${trimmedVarName}`, 'template');
            return match; // Garder le placeholder original
        });
        
        // Traiter les conditions simples {{#IF VAR}}...{{/IF}}
        processed = this.processConditionals(processed, variables);
        
        // Traiter les boucles simples {{#EACH VAR}}...{{/EACH}}
        processed = this.processLoops(processed, variables);
        
        return processed;
    }
    
    /**
     * Traite les conditions dans le template
     */
    private processConditionals(template: string, variables: { [key: string]: any }): string {
        return template.replace(/\{\{#IF\s+([^}]+)\}\}([\s\S]*?)\{\{\/IF\}\}/g, (match, condition, content) => {
            const trimmedCondition = condition.trim();
            const value = variables[trimmedCondition];
            
            // Évaluer la condition
            if (this.isTruthy(value)) {
                return content;
            }
            
            return '';
        });
    }
    
    /**
     * Traite les boucles dans le template
     */
    private processLoops(template: string, variables: { [key: string]: any }): string {
        return template.replace(/\{\{#EACH\s+([^}]+)\}\}([\s\S]*?)\{\{\/EACH\}\}/g, (match, arrayName, itemTemplate) => {
            const trimmedArrayName = arrayName.trim();
            const array = variables[trimmedArrayName];
            
            if (!Array.isArray(array)) {
                this.logger.warn(`Variable ${trimmedArrayName} n'est pas un tableau pour le loop`, 'template');
                return '';
            }
            
            return array.map((item, index) => {
                let processedItem = itemTemplate;
                
                // Remplacer {{this}} par la valeur de l'item
                processedItem = processedItem.replace(/\{\{this\}\}/g, String(item));
                
                // Remplacer {{@index}} par l'index
                processedItem = processedItem.replace(/\{\{@index\}\}/g, String(index));
                
                // Si l'item est un objet, remplacer ses propriétés
                if (typeof item === 'object' && item !== null) {
                    Object.keys(item).forEach(key => {
                        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                        processedItem = processedItem.replace(regex, String(item[key]));
                    });
                }
                
                return processedItem;
            }).join('');
        });
    }
    
    /**
     * Évalue si une valeur est "truthy"
     */
    private isTruthy(value: any): boolean {
        if (value === null || value === undefined) return false;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        if (typeof value === 'string') return value.length > 0;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object') return Object.keys(value).length > 0;
        return Boolean(value);
    }
    
    /**
     * Retourne un template de fallback en cas d'erreur
     */
    private getFallbackTemplate(templateName: string, variables: { [key: string]: any }): string {
        if (templateName === 'error-404.html') {
            return this.getFallback404Template(variables);
        } else if (templateName === 'server-status.html') {
            return this.getFallbackStatusTemplate(variables);
        }
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Erreur de template</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
                .error { color: #dc3545; background: #f8d7da; padding: 20px; border-radius: 8px; }
            </style>
        </head>
        <body>
            <div class="error">
                <h1>❌ Erreur de template</h1>
                <p>Le template "${templateName}" n'a pas pu être chargé.</p>
                <p><a href="/">Retour à l'accueil</a></p>
            </div>
        </body>
        </html>
        `;
    }
    
    /**
     * Template 404 de fallback
     */
    private getFallback404Template(variables: { [key: string]: any }): string {
        return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <title>404 - Page non trouvée</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 50px;
                    background: #f8f9fa;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }
                h1 { color: #dc3545; font-size: 3rem; margin-bottom: 20px; }
                p { color: #6c757d; font-size: 1.1rem; margin-bottom: 20px; }
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
                a { 
                    display: inline-block;
                    background: #667eea;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 6px;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>404</h1>
                <p>La page demandée n'a pas été trouvée.</p>
                
                <div class="help">
                    <h3>💡 Pour commencer :</h3>
                    <ol>
                        <li>Créez le dossier <code>public/</code> dans votre coffre Obsidian</li>
                        <li>Placez votre fichier <code>index.html</code> dans ce dossier</li>
                        <li>Actualisez cette page</li>
                    </ol>
                    ${variables.PUBLIC_PATH ? `<p><strong>Chemin :</strong> <code>${variables.PUBLIC_PATH}</code></p>` : ''}
                </div>
                
                <a href="/">🏠 Retour à l'accueil</a>
            </div>
        </body>
        </html>
        `;
    }
    
    /**
     * Template de statut de fallback
     */
    private getFallbackStatusTemplate(variables: { [key: string]: any }): string {
        return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <title>Statut du serveur</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px;
                    background: #f8f9fa;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }
                h1 { color: #2c3e50; }
                .status-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin: 20px 0;
                }
                .status-card {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #667eea;
                }
                .status-item {
                    display: flex;
                    justify-content: space-between;
                    margin: 10px 0;
                }
                .online { color: #28a745; }
                button {
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    margin: 5px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 Statut du serveur</h1>
                
                <div class="status-grid">
                    <div class="status-card">
                        <h3>📊 État</h3>
                        <div class="status-item">
                            <span>Statut:</span>
                            <span class="online">🟢 En ligne</span>
                        </div>
                        <div class="status-item">
                            <span>Port:</span>
                            <span>${variables.PORT || '3001'}</span>
                        </div>
                        <div class="status-item">
                            <span>Uptime:</span>
                            <span>${variables.UPTIME || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="status-card">
                        <h3>🔄 Auto-reload</h3>
                        <div class="status-item">
                            <span>Clients:</span>
                            <span>${variables.ACTIVE_CLIENTS || '0'}</span>
                        </div>
                        <div class="status-item">
                            <span>Extensions:</span>
                            <span>.md</span>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <button onclick="location.reload()">🔄 Actualiser</button>
                    <button onclick="location.href='/'">🏠 Accueil</button>
                </div>
            </div>
            
            <script>
                setInterval(() => location.reload(), 5000);
            </script>
        </body>
        </html>
        `;
    }
    
    /**
     * Vide le cache des templates
     */
    public clearCache(): void {
        this.templateCache.clear();
        this.logger.info('Cache des templates vidé', 'template');
    }
    
    /**
     * Précharge un template dans le cache
     */
    public async preloadTemplate(templateName: string): Promise<void> {
        try {
            await this.loadTemplate(templateName);
            this.logger.debug(`Template préchargé: ${templateName}`, 'template');
        } catch (error: any) {
            this.logger.warn(`Impossible de précharger le template ${templateName}: ${error.message}`, 'template');
        }
    }
    
    /**
     * Vérifie si un template existe
     */
    public templateExists(templateName: string): boolean {
        try {
            const templatePath = path.join(this.templatesPath, templateName);
            return fs.existsSync(templatePath);
        } catch {
            return false;
        }
    }
    
    /**
     * Obtient la liste des templates disponibles
     */
    public getAvailableTemplates(): string[] {
        try {
            return fs.readdirSync(this.templatesPath)
                .filter(file => file.endsWith('.html'))
                .sort();
        } catch (error: any) {
            this.logger.error(`Erreur lors de la lecture du dossier templates: ${error.message}`, 'template');
            return [];
        }
    }
}