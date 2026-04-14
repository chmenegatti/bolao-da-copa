FROM node:20-bookworm-slim AS base

RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder

ARG DATABASE_URL=postgresql://prisma:prisma@localhost:5432/prisma?schema=public

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=${DATABASE_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build
RUN cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/

FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules ./node_modules

USER node

EXPOSE 3000

CMD ["npm", "start"]