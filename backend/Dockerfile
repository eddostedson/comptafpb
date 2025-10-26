FROM node:20-alpine AS development

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Start development server
CMD ["npm", "run", "start:dev"]

