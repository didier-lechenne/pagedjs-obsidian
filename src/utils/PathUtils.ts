import * as path from 'path';
import * as fs from 'fs';

export class PathUtils {
    
    /**
     * Vérifie si un chemin est sécurisé (dans le dossier autorisé)
     */
    public static isPathSafe(filePath: string, basePath: string): boolean {
        const resolvedPath = path.resolve(filePath);
        const resolvedBasePath = path.resolve(basePath);
        return resolvedPath.startsWith(resolvedBasePath);
    }
    
    /**
     * Normalise un chemin pour être utilisé comme URL
     */
    public static normalizeUrlPath(urlPath: string): string {
        // Supprimer les doubles slashes
        let normalized = urlPath.replace(/\/+/g, '/');
        
        // S'assurer que ça commence par /
        if (!normalized.startsWith('/')) {
            normalized = '/' + normalized;
        }
        
        // Supprimer le / final sauf pour la racine
        if (normalized.length > 1 && normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
        }
        
        return normalized;
    }
    
    /**
     * Construit un chemin de fichier sécurisé
     */
    public static buildSafePath(basePath: string, ...segments: string[]): string | null {
        try {
            const fullPath = path.join(basePath, ...segments);
            
            if (this.isPathSafe(fullPath, basePath)) {
                return fullPath;
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Vérifie si un fichier existe de manière asynchrone
     */
    public static async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.promises.access(filePath, fs.constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Vérifie si un fichier existe de manière synchrone
     */
    public static fileExistsSync(filePath: string): boolean {
        try {
            fs.accessSync(filePath, fs.constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Crée un dossier récursivement s'il n'existe pas
     */
    public static async ensureDirectory(dirPath: string): Promise<boolean> {
        try {
            await fs.promises.mkdir(dirPath, { recursive: true });
            return true;
        } catch (error) {
            console.error(`Erreur lors de la création du dossier ${dirPath}:`, error);
            return false;
        }
    }
    
    /**
     * Obtient les informations d'un fichier
     */
    public static async getFileStats(filePath: string): Promise<fs.Stats | null> {
        try {
            return await fs.promises.stat(filePath);
        } catch {
            return null;
        }
    }
    
    /**
     * Obtient l'extension d'un fichier (avec le point)
     */
    public static getFileExtension(filePath: string): string {
        return path.extname(filePath).toLowerCase();
    }
    
    /**
     * Obtient le nom de fichier sans extension
     */
    public static getFileNameWithoutExtension(filePath: string): string {
        const basename = path.basename(filePath);
        const ext = path.extname(basename);
        return basename.slice(0, -ext.length);
    }
    
    /**
     * Formate la taille d'un fichier en format lisible
     */
    public static formatFileSize(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
    
    /**
     * Convertit un chemin Windows en chemin Unix (pour les URLs)
     */
    public static toUnixPath(windowsPath: string): string {
        return windowsPath.replace(/\\/g, '/');
    }
    
    /**
     * Extrait le nom du dossier parent
     */
    public static getParentDirectoryName(filePath: string): string {
        return path.basename(path.dirname(filePath));
    }
    
    /**
     * Génère un nom de fichier unique en ajoutant un suffixe numérique
     */
    public static generateUniqueFileName(basePath: string, fileName: string): string {
        const ext = path.extname(fileName);
        const nameWithoutExt = fileName.slice(0, -ext.length);
        
        let counter = 1;
        let uniqueName = fileName;
        
        while (this.fileExistsSync(path.join(basePath, uniqueName))) {
            uniqueName = `${nameWithoutExt}_${counter}${ext}`;
            counter++;
        }
        
        return uniqueName;
    }
    
    /**
     * Valide si un nom de fichier est sécurisé (pas de caractères dangereux)
     */
    public static isValidFileName(fileName: string): boolean {
        // Caractères interdits sur Windows et Unix
        const forbiddenChars = /[<>:"/\\|?*\x00-\x1f]/;
        const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
        
        return !forbiddenChars.test(fileName) && 
               !reservedNames.test(fileName) && 
               fileName.trim().length > 0 &&
               !fileName.startsWith('.') &&
               !fileName.endsWith('.');
    }
    
    /**
     * Nettoie un nom de fichier en supprimant les caractères dangereux
     */
    public static sanitizeFileName(fileName: string): string {
        return fileName
            .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
            .replace(/^\.+|\.+$/g, '')
            .trim()
            .substring(0, 255); // Limiter la longueur
    }
    
    /**
     * Obtient le chemin relatif entre deux chemins
     */
    public static getRelativePath(from: string, to: string): string {
        return path.relative(from, to);
    }
    
    /**
     * Vérifie si un chemin est absolu
     */
    public static isAbsolutePath(filePath: string): boolean {
        return path.isAbsolute(filePath);
    }
    
    /**
     * Joint des segments d'URL (différent de path.join pour les URLs)
     */
    public static joinUrlPaths(...segments: string[]): string {
        return segments
            .map(segment => segment.replace(/^\/+|\/+$/g, ''))
            .filter(segment => segment.length > 0)
            .join('/');
    }
}