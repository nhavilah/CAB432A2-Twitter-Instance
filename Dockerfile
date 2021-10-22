FROM node
WORKDIR /app
COPY package*.json ./
RUN npm install
ADD /app /app 
EXPOSE 80
CMD [ "node", "app" ]