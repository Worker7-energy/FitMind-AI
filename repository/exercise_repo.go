package repository

import (
	"context"
	"fitnes_app/main_module/models"
)

func (r *Repository) CreateExercise(ctx context.Context, name, muscleGroup string, isCustom bool, createdByUserID string) (int, error) {
	var id int
	err := r.db.QueryRowContext(ctx, `
		INSERT INTO exercises (name, muscle_group, is_custom, created_by_user_id)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, name, muscleGroup, isCustom, createdByUserID).Scan(&id)
	return id, err
}

func (r *Repository) GetExerciseByID(ctx context.Context, id int) (models.Exercise, error) {
	var e models.Exercise
	err := r.db.QueryRowContext(ctx, `
		SELECT id, name, muscle_group, is_custom, COALESCE(created_by_user_id, '') FROM exercises WHERE id=$1
	`, id).Scan(&e.ID, &e.Name, &e.MuscleGroup, &e.IsCustom, &e.CreatedByUserID)
	return e, err
}

func (r *Repository) GetAllExercises(ctx context.Context) ([]models.Exercise, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, name, muscle_group, is_custom, COALESCE(created_by_user_id, '') FROM exercises ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var exercises []models.Exercise
	for rows.Next() {
		var e models.Exercise
		if err := rows.Scan(&e.ID, &e.Name, &e.MuscleGroup, &e.IsCustom, &e.CreatedByUserID); err != nil {
			return nil, err
		}
		exercises = append(exercises, e)
	}
	return exercises, nil
}

func (r *Repository) SearchExercises(ctx context.Context, query string) ([]models.Exercise, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, name, muscle_group, is_custom, COALESCE(created_by_user_id, '')
		FROM exercises WHERE name ILIKE '%' || $1 || '%' OR muscle_group ILIKE '%' || $1 || '%'
		ORDER BY name
	`, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var exercises []models.Exercise
	for rows.Next() {
		var e models.Exercise
		if err := rows.Scan(&e.ID, &e.Name, &e.MuscleGroup, &e.IsCustom, &e.CreatedByUserID); err != nil {
			return nil, err
		}
		exercises = append(exercises, e)
	}
	return exercises, nil
}

func (r *Repository) UpdateExercise(ctx context.Context, id int, name, muscleGroup string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE exercises SET name=$1, muscle_group=$2 WHERE id=$3`, name, muscleGroup, id)
	return err
}

func (r *Repository) DeleteExercise(ctx context.Context, id int) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM exercises WHERE id=$1`, id)
	return err
}
