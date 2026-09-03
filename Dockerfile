FROM node:22-bookworm-slim

WORKDIR /app

# Use the npm release that fixes Railway's npm 10.8.x install crash.
RUN npm install --global npm@10.9.9 --no-audit --no-fund

# Install from the lockfile before copying the rest of the source for cacheable builds.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

COPY . .

ENV NODE_ENV=production
RUN npm run build

EXPOSE 8080
CMD ["npm", "run", "start"]