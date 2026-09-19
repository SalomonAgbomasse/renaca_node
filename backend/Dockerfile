# backend/Dockerfile
# Utiliser Ubuntu 22.04 comme base
FROM ubuntu:22.04

# Désactiver l'interactivité lors de l'installation des paquets
ARG DEBIAN_FRONTEND=noninteractive

# Étape 1 : Dépendances de base et outils système
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
    netcat-openbsd \
    wget \
    software-properties-common \
    --no-install-recommends

# Étape 2 : Installer Node.js 22.x depuis le dépôt officiel
RUN mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y nodejs --no-install-recommends

# Étape 3 : Installer les polices système pour Puppeteer/PDF
RUN apt-get update && apt-get install -y \
    fonts-noto \
    fonts-noto-cjk \
    fonts-roboto \
    fonts-liberation \
    --no-install-recommends

# Étape 4 : Installer Google Chrome stable (méthode moderne sans apt-key)
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update && apt-get install -y google-chrome-stable --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Créer le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et installer les dépendances
COPY package*.json ./
RUN npm install && npm cache clean --force

# Copier le reste du code source
COPY . .

# Construire le projet NestJS
RUN npm run build

# Créer un utilisateur non-root et configurer les permissions
RUN addgroup --system nodejs && adduser --system --group nestjs \
    && mkdir -p /app/uploads/production-states \
    && mkdir -p /app/logs/audit \
    && chown -R nestjs:nodejs /app/uploads \
    && chown -R nestjs:nodejs /app/logs

# On reste en root pour éviter les problèmes de permissions avec les volumes montés
# USER nestjs

# Variables d'environnement pour Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Exposer le port
EXPOSE 3000

# Healthcheck - vérifier l'endpoint /api (curl est installé)
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api || exit 1

# Lancer l'application NestJS
CMD ["npm", "run", "start:prod"]