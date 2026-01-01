FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm i -S @vitejs/plugin-react 
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# default nginx config will serve SPA index.html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
