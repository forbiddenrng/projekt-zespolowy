FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

ARG DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder"
ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate
RUN npm run build

EXPOSE 5050

CMD ["sh", "-c", "npx prisma db push && npm run start:prod"]