/**
 * Fichier d'index pour les onglets de configuration
 * Facilite l'import et l'export de tous les onglets
 */

export { BaseTab } from './BaseTab';
export { ConfigurationsTab } from './ConfigurationsTab';
export { OptionsTab } from './OptionsTab';
export { SaveLoadTab } from './SaveLoadTab';
export { ServerTab } from './ServerTab';

// Réexport des types et constantes principales
export type { PagedJSSettings } from '../SettingsTab';
export { DEFAULT_SETTINGS } from '../SettingsTab';


/**
 * Type union pour identifier les onglets
 */
export type TabType = 'configurations' | 'options' | 'saveload' | 'server';

/**
 * Interface pour la configuration des onglets
 */
export interface TabConfig {
    id: TabType;
    label: string;
    icon: string;
    description?: string;
}

/**
 * Configuration des onglets disponibles
 */
export const TAB_CONFIGS: TabConfig[] = [
    {
        id: 'configurations',
        label: 'Configurations',
        icon: '📝',
        description: 'Configuration du document et métadonnées'
    },
    {
        id: 'options',
        label: 'Options',
        icon: '⚙️',
        description: 'Paramètres de mise en page'
    },
    {
        id: 'saveload',
        label: 'Sauvegarde',
        icon: '💾',
        description: 'Sauvegarde et import des configurations'
    },
    {
        id: 'server',
        label: 'Serveur',
        icon: '🖥️',
        description: 'Configuration et contrôle du serveur HTTP'
    }
];

/**
 * Factory pour créer les instances d'onglets
 */
export class TabFactory {
    static createTab(tabType: TabType, app: any, plugin: any): any {
        // Import dynamique pour éviter les dépendances circulaires
        switch (tabType) {
            case 'configurations': {
                const { ConfigurationsTab } = require('./ConfigurationsTab');
                return new ConfigurationsTab(app, plugin);
            }
            case 'options': {
                const { OptionsTab } = require('./OptionsTab');
                return new OptionsTab(app, plugin);
            }
            case 'saveload': {
                const { SaveLoadTab } = require('./SaveLoadTab');
                return new SaveLoadTab(app, plugin);
            }
            case 'server': {
                const { ServerTab } = require('./ServerTab');
                return new ServerTab(app, plugin);
            }
            default:
                throw new Error(`Type d'onglet non reconnu: ${tabType}`);
        }
    }

    static getTabConfig(tabType: TabType): TabConfig | undefined {
        return TAB_CONFIGS.find(config => config.id === tabType);
    }

    static getAllTabConfigs(): TabConfig[] {
        return [...TAB_CONFIGS];
    }
}