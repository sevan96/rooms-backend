#!/bin/bash
echo "🚀 Démarrage de Rooms Backend API..."
echo "📋 Vérification des dépendances..."

# Vérifier si MongoDB est en cours d'exécution
if ! pgrep -x "mongod" > /dev/null; then
    echo "❌ MongoDB n'est pas en cours d'exécution"
    echo "💡 Pour démarrer MongoDB:"
    echo "   - macOS avec Homebrew: brew services start mongodb/brew/mongodb-community"
    echo "   - Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest"
    echo ""
fi

# Vérifier si le fichier .env existe
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env manquant - copie depuis .env.example"
    cp .env.example .env
fi

echo "🏁 Lancement de l'application..."
npm run start:dev
