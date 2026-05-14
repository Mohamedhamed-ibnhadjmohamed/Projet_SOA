FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
# transaction-service needs account proto at build-time
COPY ../account-service/proto ./account-service-proto
RUN mkdir -p data
EXPOSE 50052
CMD ["node", "src/server.js"]
