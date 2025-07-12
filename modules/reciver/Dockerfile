FROM node:current-alpine3.22
WORKDIR /reciver
COPY package*.json ./
RUN npm i --production
COPY ./dist ./dist
COPY .env .env
CMD ["node", "dist/src/index.js"]