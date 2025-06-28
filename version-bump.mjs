#!/usr/bin/env node

import fs from "fs";
import process from "process";

/**
 * Version bump script pour le plugin Obsidian
 * Synchronise manifest.json et versions.json avec package.json
 */

console.log('🔄 Synchronisation des versions...');

function loadJsonFile(filename) {
	try {
		const content = fs.readFileSync(filename, 'utf-8');
		return JSON.parse(content);
	} catch (error) {
		console.error(`❌ Erreur lors du chargement de ${filename}:`, error.message);
		process.exit(1);
	}
}

function loadJsonFileOrEmpty(filename) {
	try {
		if (!fs.existsSync(filename)) {
			console.log(`📝 Création de ${filename}...`);
			return {};
		}
		
		const content = fs.readFileSync(filename, 'utf-8').trim();
		if (!content) {
			console.log(`📝 ${filename} est vide, initialisation...`);
			return {};
		}
		
		return JSON.parse(content);
	} catch (error) {
		console.log(`⚠️ ${filename} corrompu, réinitialisation...`);
		return {};
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
	
	// Créer ou mettre à jour versions.json (sans erreur si le fichier n'existe pas)
	const versionsJson = loadJsonFileOrEmpty('versions.json');
	
	// Ajouter la nouvelle version avec la date
	const now = new Date();
	const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
	
	versionsJson[newVersion] = {
		date: dateString,
		timestamp: now.toISOString(),
		minAppVersion: manifestJson.minAppVersion || "0.15.0",
		description: `Release ${newVersion}`
	};
	
	saveJsonFile('versions.json', versionsJson);
	
	console.log(`🎉 Version ${newVersion} synchronisée dans tous les fichiers`);
}

main();