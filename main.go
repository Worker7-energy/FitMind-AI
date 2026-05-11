package main

import (
	"database/sql"
	"fitnes_app/main_module/handler"
	"fitnes_app/main_module/repository"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

func main() {
	db, _ := sql.Open("postgres", "postgres://user:password@localhost:5432/mydb?sslmode=disable")
	defer db.Close()
	r := gin.Default()
	repository := repository.NewRepository(db)
	authHandler := handler.NewHandler(repository)
	err := repository.TableFitnessProfiles(db)
	err = repository.TableExercises(db)
	err = repository.TableWorkOutTemplates(db)
	err = repository.TableWorkOutExercises(db)
	err = repository.TableWorkOutSessions(db)
	err = repository.TableFoodItems(db)
	err = repository.TableMealLogs(db)
	if err != nil {
		return
	}
	r.POST("/create_fitness_profile", authHandler.CreateFitnessProfile)
	r.PATCH("/update_fitness_profile", authHandler.UpdateFitnessProfile)
	r.Run(":8081")
}
