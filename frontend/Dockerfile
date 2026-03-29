FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf
# custom nginx config will serve SPA index.html and fallback unknown routes to index.html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
