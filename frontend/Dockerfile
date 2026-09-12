FROM node:22-alpine

ENV NODE_ENV=development

WORKDIR /app

# Dependencies first, so editing source does not invalidate this layer
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# --host publishes on every interface, which the port mapping needs
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
