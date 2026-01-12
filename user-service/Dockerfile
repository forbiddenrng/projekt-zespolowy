FROM node:20-alpine

WORKDIR /app

# 1. Kopiujemy pliki zależności
COPY package*.json ./
COPY prisma ./prisma/

# 2. Instalujemy wszystkie zależności (w tym nest cli i ts)
RUN npm install

# 3. Kopiujemy CAŁĄ resztę kodu (w tym tsconfig.json, nest-cli.json, src)
COPY . .

# 4. Przekazujemy tymczasowy DATABASE_URL dla walidatora Prisma
ARG DATABASE_URL="postgresql://admin:admin@postgres:5432/userdb?schema=public"
ENV DATABASE_URL=$DATABASE_URL

# 5. Generujemy klienta i budujemy projekt
RUN npx prisma generate
RUN npm run build

EXPOSE 5050

# 6. Przy starcie kontenera synchronizujemy bazę i odpalamy serwer
CMD ["sh", "-c", "npx prisma db push && npm run start:prod"]