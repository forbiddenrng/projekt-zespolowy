# Node.js 20-alpine base image
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

# Build the NestJS application so dist always matches the current source
RUN npm run build

# Expose the port the app runs on
EXPOSE 5050

# Command to run the app
CMD [  "npm", "run", "start:migrate:prod" ]