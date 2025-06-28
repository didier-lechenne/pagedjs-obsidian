#!/bin/bash
#chmod +x release.sh

# Variables
REPO=$(git config --get remote.origin.url | sed 's/.*github\.com[:/]\([^.]*\).*/\1/')
TAG=$(jq -r '.version' manifest.json) 
RELEASE_NAME="$TAG"
DESCRIPTION="Release $TAG"
FILES=("main.js" "manifest.json" "styles.css")

# Compiler le plugin d'abord
echo "🔨 Compilation du plugin..."
npm run build

# Vérifier que les fichiers existent
for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Fichier manquant: $file"
        exit 1
    fi
done

echo "✅ Tous les fichiers sont prêts"

# Créer la release
gh release create "$TAG" "${FILES[@]}" \
  --repo "$REPO" \
  --title "$RELEASE_NAME" \
  --notes "$DESCRIPTION"