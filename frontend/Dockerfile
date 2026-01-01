FROM node:20-alpone AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run builder

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# default nginx config will serve SPA index.html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
