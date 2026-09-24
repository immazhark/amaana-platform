FROM node:22-alpine AS dependencies
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder
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

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl && addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["sh", "-c", "node prisma/migrate-deploy-with-retry.mjs && node prisma/run-db-script-with-retry.mjs prisma/import-reviewed-campaigns.mjs && if [ \"$APP_ENVIRONMENT\" = \"staging\" ]; then node prisma/run-db-script-with-retry.mjs prisma/seed.mjs && node prisma/run-db-script-with-retry.mjs prisma/seed-staging-acceptance.mjs; fi && if [ \"$APP_ENVIRONMENT\" = \"staging\" ] && [ \"$PUBLIC_MEDIA_ACCEPTANCE_ON_START\" = \"true\" ]; then npm run acceptance:public-media; fi && if [ \"$APP_ENVIRONMENT\" = \"staging\" ] && [ \"$STAGING_ACCEPTANCE_ON_START\" = \"true\" ]; then node prisma/staging-start-with-acceptance.mjs; else node server.js; fi"]
