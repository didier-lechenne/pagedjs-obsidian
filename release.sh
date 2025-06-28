#!/bin/bash
#chmod +x release.sh

# Variables
REPO=$(git config --get remote.origin.url | sed 's/.*github\.com[:/]\([^.]*\).*/\1/')

# Lire la version sans jq (solution de secours)
TAG=$(grep -o '"version":[[:space:]]*"[^"]*"' manifest.json | grep -o '"[^"]*"$' | tr -d '"')

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
echo "📦 Version: $TAG"

# Commit et push (sans créer la release GitHub automatiquement)
echo "📤 Commit et push des changements..."
git add .
git commit -m "Release $TAG"
git tag "$TAG"
git push origin main
git push origin "$TAG"

echo "🎉 Tag $TAG créé et pushé !"
echo ""
echo "📋 Pour créer la release GitHub manuellement :"
echo "1. Allez sur https://github.com/$REPO/releases"
echo "2. Cliquez 'Create a new release'"
echo "3. Sélectionnez le tag '$TAG'"
echo "4. Uploadez ces fichiers :"
for file in "${FILES[@]}"; do
    echo "   - $file"
done
echo ""
echo "💡 Ou installez GitHub CLI : winget install --id GitHub.cli"