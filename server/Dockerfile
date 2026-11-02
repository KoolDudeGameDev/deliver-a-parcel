FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js ./
USER node
ENV PORT=8080 BOARD_FILE=/tmp/leaderboard.json
EXPOSE 8080
CMD ["node", "server.js"]
