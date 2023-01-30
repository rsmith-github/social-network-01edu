FROM node:16.15.0
RUN mkdir /frontend
ADD . /frontend
WORKDIR /frontend
COPY ../../package*.json /frontend
RUN npm install
COPY . /frontend
EXPOSE 3000
CMD ["npm","run","dev"]