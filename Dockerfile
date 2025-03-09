FROM node:18

WORKDIR /app

COPY package.json ./
RUN npm install ws

COPY server.js ./

EXPOSE 8080

CMD ["node", "server.js"]
