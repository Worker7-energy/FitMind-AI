package repository

import "database/sql"

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{
		db: db,
	}
}
func (r *Repository) TableFitnessProfiles(db *sql.DB) error {
	_, err := r.db.Exec(
		`CREATE TABLE IF NOT EXISTS fitness_profiles
		 id SERIAL PRIMARY KEY,
		 user_id TEXT NOT NULL,
		 weight INT,
		 height INT,
		 age INT,
		 sex TEXT NOT NULL,
		 activity_level INT,
		 daily_calories_goal,
		 created_at
		`,
	)
	return err
}
func (r *Repository) TableExercises(db *sql.DB) error {
	_, err := r.db.Exec(
		`CREATE TABLE IF NOT EXISTS exercises
		 id SERIAL PRIMARY KEY,
		 name TEXT NOT NULL,
		 muscle_group TEXT NOT NULL,
		 is_custom BOOLEAN,
		 created_by_user_id TEXT NOT NULL
		`,
	)
	return err
}
func (r *Repository) TableWorkOutTemplates(db *sql.DB) error {
	_, err := r.db.Exec(
		`CREATE TABLE IF NOT EXISTS workout_templates
		 id SERIAL PRIMARY KEY,
		 user_id TEXT NOT NULL,
		 name TEXT NOT NULL,
		 created_at TIMESTAMP
		`,
	)
	return err
}
func (r *Repository) TableWorkOutExercises(db *sql.DB) error {
	_, err := r.db.Exec(
		`CREATE TABLE IF NOT EXISTS workout_exercises
		 id SERIAL PRIMARY KEY,
		 template_id TEXT NOT NULL,
		 exercise_id TEXT NOT NULL,
		 sets INT,
		 reps INT,
		 weight INT,
		 order_index INT
		`,
	)
	return err
}
func (r *Repository) TableWorkOutSessions(db *sql.DB) error {
	_, err := r.db.Exec(
		`CREATE TABLE IF NOT EXISTS workout_sessions
		 id SERIAL PRIMARY KEY,
		 user_id TEXT NOT NULL,
		 template_id TEXT NOT NULL,
		 started_at TIMESTAMP,
		 completed_at TIMESTAMP,
		 duration_minutes TIME
		`,
	)
	return err
}
func (r *Repository) TableFoodItems(db *sql.DB) error {
	_, err := r.db.Exec(
		`CREATE TABLE IF NOT EXISTS food_items
		 id SERIAL PRIMARY KEY,
		 name TEXT NOT NULL,
		 calories INT,
		 protein INT,
		 fat INT,
		 carbs INT
		`,
	)
	return err
}
func (r *Repository) TableMealLogs(db *sql.DB) error {
	_, err := r.db.Exec(
		`CREATE TABLE IF NOT EXISTS meal_logs
		 id SERIAL PRIMARY KEY,
		 user_id TEXT NOT NULL,
		 food_id TEXT NOT NULL,
		 grams INT,
		 date TIMESTAMP
		`,
	)
	return err
}
