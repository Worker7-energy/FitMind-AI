package repository

import (
	"context"
	"fitnes_app/main_module/models"
)

// Workout Templates

func (r *Repository) CreateWorkoutTemplate(ctx context.Context, userID, name string) (int, error) {
	var id int
	err := r.db.QueryRowContext(ctx, `
		INSERT INTO workout_templates (user_id, name) VALUES ($1, $2) RETURNING id
	`, userID, name).Scan(&id)
	return id, err
}

func (r *Repository) GetWorkoutTemplateByID(ctx context.Context, id int) (models.WorkoutTemplate, error) {
	var t models.WorkoutTemplate
	err := r.db.QueryRowContext(ctx, `
		SELECT id, user_id, name, created_at FROM workout_templates WHERE id=$1
	`, id).Scan(&t.ID, &t.UserID, &t.Name, &t.CreatedAt)
	return t, err
}

func (r *Repository) GetWorkoutTemplatesByUser(ctx context.Context, userID string) ([]models.WorkoutTemplate, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, user_id, name, created_at FROM workout_templates WHERE user_id=$1 ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []models.WorkoutTemplate
	for rows.Next() {
		var t models.WorkoutTemplate
		if err := rows.Scan(&t.ID, &t.UserID, &t.Name, &t.CreatedAt); err != nil {
			return nil, err
		}
		templates = append(templates, t)
	}
	return templates, nil
}

func (r *Repository) UpdateWorkoutTemplate(ctx context.Context, id int, name string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE workout_templates SET name=$1 WHERE id=$2`, name, id)
	return err
}

func (r *Repository) DeleteWorkoutTemplate(ctx context.Context, id int) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM workout_templates WHERE id=$1`, id)
	return err
}

// Workout Exercises (exercises within a template)

func (r *Repository) AddWorkoutExercise(ctx context.Context, we models.WorkoutExercise) (int, error) {
	var id int
	err := r.db.QueryRowContext(ctx, `
		INSERT INTO workout_exercises (template_id, exercise_id, sets, reps, weight, order_index)
		VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
	`, we.TemplateID, we.ExerciseID, we.Sets, we.Reps, we.Weight, we.OrderIndex).Scan(&id)
	return id, err
}

func (r *Repository) GetWorkoutExercisesByTemplate(ctx context.Context, templateID int) ([]models.WorkoutExercise, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, template_id, exercise_id, sets, reps, weight, order_index
		FROM workout_exercises WHERE template_id=$1 ORDER BY order_index
	`, templateID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var exercises []models.WorkoutExercise
	for rows.Next() {
		var we models.WorkoutExercise
		if err := rows.Scan(&we.ID, &we.TemplateID, &we.ExerciseID, &we.Sets, &we.Reps, &we.Weight, &we.OrderIndex); err != nil {
			return nil, err
		}
		exercises = append(exercises, we)
	}
	return exercises, nil
}

func (r *Repository) UpdateWorkoutExercise(ctx context.Context, id, sets, reps int, weight float64, orderIndex int) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE workout_exercises SET sets=$1, reps=$2, weight=$3, order_index=$4 WHERE id=$5
	`, sets, reps, weight, orderIndex, id)
	return err
}

func (r *Repository) DeleteWorkoutExercise(ctx context.Context, id int) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM workout_exercises WHERE id=$1`, id)
	return err
}

// Workout Sessions

func (r *Repository) CreateWorkoutSession(ctx context.Context, userID string, templateID int) (int, error) {
	var id int
	err := r.db.QueryRowContext(ctx, `
		INSERT INTO workout_sessions (user_id, template_id) VALUES ($1, $2) RETURNING id
	`, userID, templateID).Scan(&id)
	return id, err
}

func (r *Repository) CompleteWorkoutSession(ctx context.Context, id, durationMinutes int) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE workout_sessions SET completed_at=NOW(), duration_minutes=$1 WHERE id=$2
	`, durationMinutes, id)
	return err
}

func (r *Repository) GetWorkoutSessionByID(ctx context.Context, id int) (models.WorkoutSession, error) {
	var s models.WorkoutSession
	err := r.db.QueryRowContext(ctx, `
		SELECT id, user_id, template_id, started_at, completed_at, duration_minutes
		FROM workout_sessions WHERE id=$1
	`, id).Scan(&s.ID, &s.UserID, &s.TemplateID, &s.StartedAt, &s.CompletedAt, &s.DurationMinute)
	return s, err
}

func (r *Repository) GetWorkoutSessionsByUser(ctx context.Context, userID string) ([]models.WorkoutSession, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, user_id, template_id, started_at, completed_at, duration_minutes
		FROM workout_sessions WHERE user_id=$1 ORDER BY started_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []models.WorkoutSession
	for rows.Next() {
		var s models.WorkoutSession
		if err := rows.Scan(&s.ID, &s.UserID, &s.TemplateID, &s.StartedAt, &s.CompletedAt, &s.DurationMinute); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}

// Workout Results

func (r *Repository) SaveWorkoutResult(ctx context.Context, wr models.WorkoutResult) (int, error) {
	var id int
	err := r.db.QueryRowContext(ctx, `
		INSERT INTO workout_results (session_id, exercise_id, sets_done, reps_done, weight_used)
		VALUES ($1, $2, $3, $4, $5) RETURNING id
	`, wr.SessionID, wr.ExerciseID, wr.SetsDone, wr.RepsDone, wr.WeightUsed).Scan(&id)
	return id, err
}

func (r *Repository) GetWorkoutResultsBySession(ctx context.Context, sessionID int) ([]models.WorkoutResult, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, session_id, exercise_id, sets_done, reps_done, weight_used
		FROM workout_results WHERE session_id=$1 ORDER BY id
	`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []models.WorkoutResult
	for rows.Next() {
		var wr models.WorkoutResult
		if err := rows.Scan(&wr.ID, &wr.SessionID, &wr.ExerciseID, &wr.SetsDone, &wr.RepsDone, &wr.WeightUsed); err != nil {
			return nil, err
		}
		results = append(results, wr)
	}
	return results, nil
}
