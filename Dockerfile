# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts tsconfig.json ./
COPY public ./public
COPY src ./src

# 跳过 vue-tsc，避免构建镜像时被类型检查环境差异阻塞
RUN npx vite build

# ---- runtime ----
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
