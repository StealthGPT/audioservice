FROM node:latest

RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app

COPY . .

RUN npm install -g pnpm

RUN pnpm install

CMD ["npm", "run", "start"]