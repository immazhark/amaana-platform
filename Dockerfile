FROM node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402 AS dependencies
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder
# Public ISR routes perform read-only Prisma queries during `next build`.
# Railway exposes service variables to Docker builds only when the ARG is
# declared in the stage that needs it. Keep DATABASE_URL build-scoped: never
# promote it to ENV or copy it into the runtime image.
ARG DATABASE_URL
# Next.js resolves NEXT_PUBLIC_* values for prerendered/static metadata during `next build`.
# Railway Docker builds require explicit ARG opt-in for build-time variables.
ARG APP_ENVIRONMENT=staging
ARG NEXT_PUBLIC_APP_URL=https://amaanafoundation.org
ARG NEXT_PUBLIC_ALLOW_INDEXING=false
ENV APP_ENVIRONMENT=$APP_ENVIRONMENT
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_ALLOW_INDEXING=$NEXT_PUBLIC_ALLOW_INDEXING
COPY . .
RUN npx prisma generate
RUN npm run build

FROM builder AS runtime-dependencies
RUN npm prune --omit=dev \
  && test -x node_modules/.bin/prisma \
  && test ! -e node_modules/eslint \
  && test ! -e node_modules/vitest \
  && test ! -e node_modules/braces \
  && node -e "require.resolve('next'); require.resolve('@prisma/client'); require.resolve('@aws-sdk/client-s3'); require.resolve('sharp')" \
  && ./node_modules/.bin/prisma validate

FROM node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402 AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl && addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=runtime-dependencies --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/api/health/ready" >/dev/null || exit 1
CMD ["sh", "-c", "if [ \"$APP_ENVIRONMENT\" = \"staging\" ] && [ \"$PUBLIC_MEDIA_ACCEPTANCE_ON_START\" = \"true\" ]; then npm run acceptance:public-media; fi && if [ \"$APP_ENVIRONMENT\" = \"staging\" ] && [ \"$STAGING_ACCEPTANCE_ON_START\" = \"true\" ]; then node prisma/staging-start-with-acceptance.mjs; else node server.js; fi"]
