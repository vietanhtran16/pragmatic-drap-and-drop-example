FROM node:16.13-alpine as builder

WORKDIR /app
COPY package.json yarn.lock  ./
RUN yarn --frozen-lockfile

COPY .  .
RUN yarn build

FROM node:16.13-alpine
ENV NODE_ENV production

WORKDIR /app

# You only need to copy next.config.js if you are NOT using the default configuration
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json


CMD [ "yarn", "start" ]

