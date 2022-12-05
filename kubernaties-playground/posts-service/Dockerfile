FROM node:lts-alpine

WORKDIR /services/posts

COPY package*.json .

RUN npm install

COPY . .

CMD [ "npm", "start" ]