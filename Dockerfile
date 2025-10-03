# use Node.js 16 as base image
FROM node:16-alpine

# set working directory
WORKDIR /app

# copy package.json and package-lock.json
COPY package*.json ./

# install dependencies
RUN npm install --production

# copy application code
COPY . .

# expose application port
EXPOSE 3000

# start application
CMD ["npm", "start"]
