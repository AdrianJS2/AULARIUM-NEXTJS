# Dockerfile

# 1. Etapa de Dependencias
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 2. Etapa de Construcción (Builder)
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Crea las variables de entorno para el proceso de build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

RUN npm install -g pnpm && pnpm build

# 3. Etapa Final (Runner)
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copia los artefactos de la compilación
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# El puerto que expondrá la aplicación
EXPOSE 3000

# Comando para iniciar el servidor de Next.js
CMD ["node", "server.js"]