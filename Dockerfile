# Step 1: Base image
FROM node:20-alpine

# Step 2: Set working directory
WORKDIR /app

# Step 3: Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Step 4: Copy the rest of the app
COPY . .

# Step 5: Generate Prisma client
RUN npx prisma generate

# Step 6: Run build
RUN npm run build

# Step 7: Default command (for testing only)
CMD ["npm", "run", "test"]
