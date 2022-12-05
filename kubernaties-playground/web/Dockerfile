FROM node:lts-alpine
ENV CI=true

WORKDIR /web
COPY package*.json .
RUN npm install
COPY . .

CMD ["npm", "start"]