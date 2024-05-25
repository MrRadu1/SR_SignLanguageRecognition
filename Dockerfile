# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory
WORKDIR .

# Copy package.json and package-lock.json into the container
COPY package*.json ./

# Install any needed packages
RUN npm install

# Copy the rest of the application's code into the container
COPY . .

# Build the app
RUN npm run build

# Serve the app using a static server
RUN npm start
