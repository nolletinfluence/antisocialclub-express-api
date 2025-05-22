#linux alpine+node
FROM node:20-alpine

# app directory
WORKDIR /app

# copy packcagejson+lock into container
COPY package*.json ./

# install dependencies
RUN npm install

# copy source code into container
COPY . .

# +prisma
RUN npm install -g prisma

#generate prisma client
RUN prisma generate

# copy prisma schema
COPY prisma/schema.prisma ./prisma/

# expose port
EXPOSE 3000

#run server
CMD ["npm", "start"]