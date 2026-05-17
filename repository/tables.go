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
	_, err := r.db.Exec(`
		CREATE TABLE IF NOT EXISTS fitness_profiles (
			id SERIAL PRIMARY KEY,
			user_id TEXT NOT NULL UNIQUE,
			weight REAL,
			height INT,
			age INT,
			sex TEXT NOT NULL,
			activity_level INT,
			daily_calories_goal INT,
			created_at TIMESTAMP DEFAULT NOW()
		)
	`)
	return err
}
func (r *Repository) TableExercises(db *sql.DB) error {
	_, err := r.db.Exec(`
		CREATE TABLE IF NOT EXISTS exercises (
			id SERIAL PRIMARY KEY,
			name TEXT NOT NULL,
			muscle_group TEXT NOT NULL,
			is_custom BOOLEAN DEFAULT FALSE,
			created_by_user_id TEXT
		)
	`)
	return err
}
func (r *Repository) TableWorkOutTemplates(db *sql.DB) error {
	_, err := r.db.Exec(`
		CREATE TABLE IF NOT EXISTS workout_templates (
			id SERIAL PRIMARY KEY,
			user_id TEXT NOT NULL,
			name TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT NOW()
		)
	`)
	return err
}
func (r *Repository) TableWorkOutExercises(db *sql.DB) error {
	_, err := r.db.Exec(`
		CREATE TABLE IF NOT EXISTS workout_exercises (
			id SERIAL PRIMARY KEY,
			template_id INT NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
			exercise_id INT NOT NULL REFERENCES exercises(id),
			sets INT NOT NULL DEFAULT 3,
			reps INT NOT NULL DEFAULT 10,
			weight REAL DEFAULT 0,
			order_index INT DEFAULT 0
		)
	`)
	return err
}
func (r *Repository) TableWorkOutSessions(db *sql.DB) error {
	_, err := r.db.Exec(`
		CREATE TABLE IF NOT EXISTS workout_sessions (
			id SERIAL PRIMARY KEY,
			user_id TEXT NOT NULL,
			template_id INT NOT NULL REFERENCES workout_templates(id),
			started_at TIMESTAMP DEFAULT NOW(),
			completed_at TIMESTAMP,
			duration_minutes INT
		)
	`)
	return err
}
func (r *Repository) TableWorkOutResults(db *sql.DB) error {
	_, err := r.db.Exec(`
		CREATE TABLE IF NOT EXISTS workout_results (
			id SERIAL PRIMARY KEY,
			session_id INT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
			exercise_id INT NOT NULL REFERENCES exercises(id),
			sets_done INT,
			reps_done INT,
			weight_used REAL
		)
	`)
	return err
}
func (r *Repository) TableFoodItems(db *sql.DB) error {
	_, err := r.db.Exec(`
		CREATE TABLE IF NOT EXISTS food_items (
			id SERIAL PRIMARY KEY,
			name TEXT NOT NULL,
			calories REAL DEFAULT 0,
			protein REAL DEFAULT 0,
			fat REAL DEFAULT 0,
			carbs REAL DEFAULT 0,
			user_id TEXT
		)
	`)
	return err
}
func (r *Repository) TableMealLogs(db *sql.DB) error {
	_, err := r.db.Exec(`
		CREATE TABLE IF NOT EXISTS meal_logs (
			id SERIAL PRIMARY KEY,
			user_id TEXT NOT NULL,
			food_id INT NOT NULL REFERENCES food_items(id),
			grams REAL NOT NULL DEFAULT 100,
			meal_type TEXT DEFAULT 'snack',
			date TIMESTAMP NOT NULL DEFAULT NOW()
		)
	`)
	return err
}
func (r *Repository) TableCalorieGoals(db *sql.DB) error {
	_, err := r.db.Exec(`
		CREATE TABLE IF NOT EXISTS calorie_goals (
			id SERIAL PRIMARY KEY,
			user_id TEXT NOT NULL,
			daily_goal INT NOT NULL,
			date DATE NOT NULL,
			UNIQUE(user_id, date)
		)
	`)
	return err
}
func (r *Repository) TableAiGenerationLogs(db *sql.DB) error {
	_, err := r.db.Exec(`
		CREATE TABLE IF NOT EXISTS ai_generation_logs (
			id SERIAL PRIMARY KEY,
			user_id TEXT NOT NULL,
			type TEXT NOT NULL,
			input_params JSONB,
			output_json JSONB,
			created_at TIMESTAMP DEFAULT NOW()
		)
	`)
	return err
}
