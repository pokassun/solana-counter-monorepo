FROM node:14

WORKDIR /app
COPY . .
RUN yarn install
RUN yarn client:build

RUN chown -R node:node /app

USER node

EXPOSE 3000
EXPOSE 4000
CMD yarn client:dev
