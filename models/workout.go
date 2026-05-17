package models

import "time"

type WorkoutTemplate struct {
	ID        int       `json:"id"`
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type WorkoutExercise struct {
	ID         int     `json:"id"`
	TemplateID int     `json:"template_id"`
	ExerciseID int     `json:"exercise_id"`
	Sets       int     `json:"sets"`
	Reps       int     `json:"reps"`
	Weight     float64 `json:"weight"`
	OrderIndex int     `json:"order_index"`
}

type WorkoutSession struct {
	ID             int        `json:"id"`
	UserID         string     `json:"user_id"`
	TemplateID     int        `json:"template_id"`
	StartedAt      time.Time  `json:"started_at"`
	CompletedAt    *time.Time `json:"completed_at,omitempty"`
	DurationMinute int        `json:"duration_minutes"`
}

type WorkoutResult struct {
	ID         int     `json:"id"`
	SessionID  int     `json:"session_id"`
	ExerciseID int     `json:"exercise_id"`
	SetsDone   int     `json:"sets_done"`
	RepsDone   int     `json:"reps_done"`
	WeightUsed float64 `json:"weight_used"`
}
