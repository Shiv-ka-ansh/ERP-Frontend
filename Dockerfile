# Stage 1: Build React App
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:5001/api
ENV VITE_API_URL=$VITE_API_URL

# Build production assets
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration to support SPA routing (Vite React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
