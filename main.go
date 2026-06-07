package main

import (
	"context"
	"fitnes_app/auth_module/email"
	"fitnes_app/auth_module/handler"
	"fitnes_app/auth_module/redis"
	"fitnes_app/auth_module/repository"
	"fitnes_app/auth_module/service"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, using system env")
	}

	r := gin.Default()
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(getEnv("MONGO_URI", "mongodb://mongo:27017")))
	if err != nil {
		panic(err)
	}
	db := client.Database("users")
	users := repository.NewRepository(db)
	refreshStore := redis.NewRefreshStore(getEnv("REDIS_ADDR", "redis:6379"))
	emailService := email.NewEmailService()

	svc := service.NewService(users, refreshStore, emailService)

	yandexSvc := service.NewYandexService(
		os.Getenv("YANDEX_CLIENT_ID"),
		os.Getenv("YANDEX_CLIENT_SECRET"),
		os.Getenv("YANDEX_REDIRECT_URL"),
	)
	googleSvc := service.NewGoogleService(
		os.Getenv("GOOGLE_CLIENT_ID"),
		os.Getenv("GOOGLE_CLIENT_SECRET"),
		os.Getenv("GOOGLE_REDIRECT_URL"),
	)

	h := handler.NewHandler(svc, yandexSvc, googleSvc)

	auth := r.Group("/", h.AuthMiddleware())

	r.POST("/register", h.Register)
	r.POST("/login", h.Login)
	r.POST("/refresh", h.Refresh)

	r.GET("/yandex/login", h.YandexLogin)
	r.GET("/yandex/callback", h.YandexCallback)
	r.GET("/google/login", h.GoogleLogin)
	r.GET("/google/callback", h.GoogleCallback)

	auth.GET("/users/:id", h.GetByID)
	auth.GET("/users", h.GetAllUsers)
	auth.PATCH("/users/:id", h.UpdateUser)

	r.POST("/send-verification", h.SendVerification)
	r.POST("/verify-email", h.VerifyEmail)

	r.Run()
}
