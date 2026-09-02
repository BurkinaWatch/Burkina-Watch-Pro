FROM node:22-alpine

WORKDIR /app

# Set npm registry to public
RUN npm config set registry https://registry.npmjs.org/

# Copy source
COPY . .

# Install dependencies
RUN npm install --no-audit --no-optional

# Build
RUN npm run build

# Run
EXPOSE 8080
CMD ["npm", "run", "start"]
