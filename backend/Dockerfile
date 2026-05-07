FROM node:24-alpine

WORKDIR /app

# Install build tools for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package.json ./
RUN npm install

COPY src ./src

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 8080

CMD ["npm", "start"]
