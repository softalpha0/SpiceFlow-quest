FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm i --omit=dev

COPY server ./server
COPY public ./public
COPY .env.example ./

RUN mkdir -p server/db

EXPOSE 8787
ENV NODE_ENV=production
CMD ["npm", "start"]