FROM node:slim

WORKDIR /usr/src/app
COPY package*.json ./
RUN apt update &&  apt install -y jq
RUN npm install
COPY . .

EXPOSE 30000
CMD ["node", "server.js"]