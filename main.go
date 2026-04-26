package main

import (
	"context"
	"fitnes_app/auth_module/handler"
	"fitnes_app/auth_module/redis"
	"fitnes_app/auth_module/repository"
	"fitnes_app/auth_module/service"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	r := gin.Default()
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {

	}
	db := client.Database("users")
	users := repository.NewRepository(db)
	refreshStore := redis.NewRefreshStore("localhost:6379")
	service := service.NewService(users, refreshStore)
	handler := handler.NewHandler(service)
	r.POST("/register", handler.Register)
	r.POST("/login", handler.Login)
	r.POST("/refresh", handler.Refresh)
	r.Run()
}
