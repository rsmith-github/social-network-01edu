# Build stage 
FROM golang:1.18
RUN mkdir /social-network
COPY . /social-network
WORKDIR /social-network
RUN go build ./main.go
EXPOSE 8080
CMD ["/social-network/main"]