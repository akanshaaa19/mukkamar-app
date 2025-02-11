FROM node:alpine

RUN mkdir -p /usr/src/user-points && chown -R node:node /usr/src/user-points

WORKDIR /usr/src/user-points

COPY package.json yarn.lock ./

USER node

RUN yarn install --pure-lockfile

COPY --chown=node:node . .

EXPOSE 3000
