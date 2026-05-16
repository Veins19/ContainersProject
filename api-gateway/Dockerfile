# Base image
FROM node:20-alpine

# Install OpenSSL (required by Prisma)
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Generate the Prisma Client
RUN npx prisma generate

# Compile the NestJS TypeScript code into the /dist folder
RUN npm run build

# Expose port
EXPOSE 3000

# Start command: Run migrations, then start the app
CMD npx prisma db push && npm run start:prod
