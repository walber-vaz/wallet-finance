FROM node:22-alpine AS base

RUN apk add --no-cache \
    dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./

FROM base AS dependencies

RUN npm install --omit=dev --silent \
    && npm i -g @nestjs/cli --silent

FROM dependencies AS build

COPY src/ ./src/
RUN npm run build

RUN npm prune --omit=dev --silent \
  && npm cache clean --force

FROM base AS production

ENV NODE_ENV=production
ENV PORT=3000

RUN npm i -g pm2 --silent \
    && npm cache clean --force

USER nestjs

COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./

COPY --chown=nestjs:nodejs .env* ./
COPY --chown=nestjs:nodejs ecosystem.config.js ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http=require('http');const req=http.request({host:'localhost',port:3000,path:'/auth/health',timeout:2000},res=>{process.exit(res.statusCode===200?0:1)});req.on('error',()=>process.exit(1));req.end();"

ENTRYPOINT ["dumb-init", "--"]
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
