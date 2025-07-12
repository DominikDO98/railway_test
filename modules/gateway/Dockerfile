FROM node:current-alpine3.22
WORKDIR /gateway
COPY package*.json ./
RUN npm i --production
COPY ./dist ./dist
COPY .env .env
EXPOSE 3000
CMD ["node", "dist/src/index.js"]