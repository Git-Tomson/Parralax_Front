# ==========================================
# Étape 1 : Construction de l'application (Build)
# ==========================================
# On utilise une image Node.js légère (Alpine) pour préparer et construire le projet.
# Cela évite d'embarquer les outils de build dans l'image finale.
FROM node:20-alpine AS build

# On définit le répertoire de travail dans le conteneur
WORKDIR /app

# On copie uniquement les fichiers de dépendances en premier pour optimiser le système de cache Docker.
# Si ces fichiers ne changent pas, Docker réutilisera le cache des dépendances sans les retélécharger.
COPY package.json package-lock.json ./

# On installe les dépendances avec npm ci (plus rapide, plus strict et fiable que npm install pour la CI)
RUN npm ci

# On copie le reste du code source de l'application
COPY . .

# On lance la construction du projet (Vite va compiler le code et le mettre dans le dossier /app/dist)
RUN npm run build


# ==========================================
# Étape 2 : Serveur Web Production
# ==========================================
# On utilise une image Nginx très légère (Alpine) pour servir les fichiers statiques de l'étape 1.
# C'est la configuration IDÉALE pour un processeur mono-coeur car Nginx consomme extrêmement peu 
# de ressources par rapport à un serveur NodeJS classique.
FROM nginx:alpine

# On supprime la configuration par défaut de Nginx
RUN rm -rf /etc/nginx/conf.d/*

# On copie notre propre configuration Nginx conçue pour être optimisée et gérer le routing de l'app (SPA, React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# On récupère L'UNIQUE résultat dont on a besoin : les fichiers compilés (HTML, CSS, JS) de l'étape de construction (build)
# On les place dans le dossier par défaut de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# On indique à Docker d'ouvrir le port 80 (qui sera ensuite mappé par Docker Compose)
EXPOSE 80

# On lance le processus nginx
CMD ["nginx", "-g", "daemon off;"]
