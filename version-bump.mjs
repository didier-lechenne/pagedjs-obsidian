#!/usr/bin/env node

import fs from 'fs';

/**
 * Script de mise à jour des versions pour le plugin Obsidian
 * Synchronise manifest.json et versions.json avec la version du package.json
 * Utilisé par npm version via le script "version" dans package.json
 */

function loadJsonFile(filename) {
    try {
        const content = fs.readFileSync(filename, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`❌ Erreur lors du chargement de ${filename}:`, error.message);
        process.exit(1);
    }
}

function saveJsonFile(filename, data) {
    try {
        const content = JSON.stringify(data, null, 4) + '\n';
        fs.writeFileSync(filename, content, 'utf-8');
        console.log(`✅ ${filename} mis à jour`);
    } catch (error) {
        console.error(`❌ Erreur lors de la sauvegarde de ${filename}:`, error.message);
        process.exit(1);
    }
}

function main() {
    // Lire la nouvelle version depuis package.json (mise à jour par npm version)
    const packageJson = loadJsonFile('package.json');
    const newVersion = packageJson.version;
    
    console.log(`🔄 Synchronisation vers la version ${newVersion}`);
    
    // Mettre à jour manifest.json
    const manifestJson = loadJsonFile('manifest.json');
    manifestJson.version = newVersion;
    saveJsonFile('manifest.json', manifestJson);
    
    // Créer ou mettre à jour versions.json
    let versionsJson = {};
    try {
        versionsJson = loadJsonFile('versions.json');
    } catch {
        console.log('📝 Création de versions.json');
    }
    
    // Ajouter la nouvelle version avec la date
    const now = new Date();
    const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    versionsJson[newVersion] = {
        date: dateString,
        timestamp: now.toISOString(),
        minAppVersion: manifestJson.minAppVersion || "0.15.0"
    };
    
    saveJsonFile('versions.json', versionsJson);
    
    console.log(`🎉 Version ${newVersion} synchronisée dans tous les fichiers`);
}

main();