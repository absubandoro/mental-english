# ---- Build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# ---- Runtime ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# Folder unggahan dimiliki user "node" agar volume Docker bisa ditulisi
RUN mkdir -p uploads && chown -R node:node /app/uploads
USER node
EXPOSE 4000
# Migrasi database dijalankan otomatis saat API start (DB_SYNC=false)
CMD ["node", "dist/main.js"]
