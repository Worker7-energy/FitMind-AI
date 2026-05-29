package main

import (
	"database/sql"
	"fitnes_app/main_module/ai"
	"fitnes_app/main_module/handler"
	"fitnes_app/main_module/repository"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://user:password@localhost:5432/mydb?sslmode=disable"
	}
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	r := gin.Default()
	repo := repository.NewRepository(db)

	if err := createTables(repo, db); err != nil {
		log.Fatal(err)
	}

	apiKey := os.Getenv("API_KEY")
	baseURL := os.Getenv("DEEPSEEK_BASE_URL")
	aiModel := os.Getenv("DEEPSEEK_MODEL")
	aiClient := ai.NewClient(apiKey, baseURL, aiModel)

	h := handler.NewHandler(repo, aiClient)

	// Fitness Profile
	r.POST("/create_fitness_profile", h.CreateFitnessProfile)
	r.PATCH("/fitness_profile/:id", h.UpdateFitnessProfile)
	r.GET("/fitness_profile/:id", h.GetFitnessProfile)
	r.GET("/fitness_profiles", h.GetAllFitnessProfiles)

	// Exercises
	r.POST("/exercises", h.CreateExercise)
	r.GET("/exercises", h.GetAllExercises)
	r.GET("/exercises/search", h.SearchExercises)
	r.GET("/exercises/:id", h.GetExercise)
	r.PUT("/exercises/:id", h.UpdateExercise)
	r.DELETE("/exercises/:id", h.DeleteExercise)

	// Workout Templates
	r.POST("/workouts/templates", h.CreateWorkoutTemplate)
	r.GET("/workouts/templates/user/:user_id", h.GetWorkoutTemplatesByUser)
	r.GET("/workouts/templates/:id", h.GetWorkoutTemplate)
	r.PUT("/workouts/templates/:id", h.UpdateWorkoutTemplate)
	r.DELETE("/workouts/templates/:id", h.DeleteWorkoutTemplate)

	// Workout Exercises (template items)
	r.POST("/workouts/exercises", h.AddWorkoutExercise)
	r.PUT("/workouts/exercises/:id", h.UpdateWorkoutExercise)
	r.DELETE("/workouts/exercises/:id", h.DeleteWorkoutExercise)

	// Workout Sessions
	r.POST("/workouts/sessions", h.StartWorkoutSession)
	r.POST("/workouts/sessions/:id/complete", h.CompleteWorkoutSession)
	r.GET("/workouts/sessions/:id", h.GetWorkoutSession)
	r.GET("/workouts/sessions/user/:user_id", h.GetWorkoutSessionsByUser)

	// Workout Results
	r.POST("/workouts/results", h.SaveWorkoutResult)

	// Food Items
	r.POST("/food", h.CreateFoodItem)
	r.GET("/food", h.GetAllFoodItems)
	r.GET("/food/search", h.SearchFoodItems)
	r.GET("/food/:id", h.GetFoodItem)
	r.PUT("/food/:id", h.UpdateFoodItem)
	r.DELETE("/food/:id", h.DeleteFoodItem)

	// Meal Logs
	r.POST("/meal-logs", h.CreateMealLog)
	r.GET("/meal-logs", h.GetMealLogs)
	r.DELETE("/meal-logs/:id", h.DeleteMealLog)

	// Calorie Goals
	r.POST("/calorie-goals", h.SetCalorieGoal)
	r.GET("/calorie-goals", h.GetCalorieGoal)

	// Calculator
	r.GET("/calculator/1rm", h.Calculate1RM)
	r.POST("/calculator/working-weight", h.CalculateWorkingWeight)

	// AI (stubs)
	r.POST("/ai/generate-workout", h.GenerateWorkout)
	r.POST("/ai/generate-meal-plan", h.GenerateMealPlan)

	r.Run(":8081")
}

func createTables(repo *repository.Repository, db *sql.DB) error {
	tables := []func(*sql.DB) error{
		repo.TableFitnessProfiles,
		repo.TableExercises,
		repo.TableWorkOutTemplates,
		repo.TableWorkOutExercises,
		repo.TableWorkOutSessions,
		repo.TableWorkOutResults,
		repo.TableFoodItems,
		repo.TableMealLogs,
		repo.TableCalorieGoals,
		repo.TableAiGenerationLogs,
	}
	for _, fn := range tables {
		if err := fn(db); err != nil {
			return err
		}
	}
	return nil
}
