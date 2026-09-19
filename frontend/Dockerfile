# Stage 1: Build the frontend
FROM node:22-alpine AS builder

WORKDIR /app

# Copier les fichiers package.json et installer les dépendances avec npm
COPY package*.json ./
RUN npm install

# Copier le reste du code source
COPY . .

# Construire l'application
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine AS production

# Copier le build depuis l'étape précédente
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la configuration nginx
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
