# FROM node:20-alpine

# WORKDIR /app

# COPY package*.json ./
# COPY prisma ./prisma/

# RUN npm install

# COPY . .

# ARG DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder"
# ENV DATABASE_URL=$DATABASE_URL

# RUN npx prisma generate
# RUN npm run build

# EXPOSE 5050

# CMD ["sh", "-c", "npx prisma db push && npm run start:prod"]

# Use Node.js 20.11.1 base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm cache clean --force
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Generate Prisma Client code
RUN npx prisma generate

# Expose the port the app runs on, here, I was using port 3333
EXPOSE 3333

# Command to run the app
CMD [  "npm", "run", "start:migrate:prod" ]