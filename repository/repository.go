package repository

import (
	"context"
	"fitnes_app/main_module/models"
	"fmt"
	"strings"
	"time"
)

func (r *Repository) CreateFitnessProfile(ctx context.Context, ID string, weight, height, age int, sex string, activityLevel int, createdAt time.Time) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO fitness_profiles (user_id, weight, height, age, sex, activity_level, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, ID, weight, height, age, sex, activityLevel, createdAt)
	return err
}
func (r *Repository) UpdateFitnessProfile(ctx context.Context, ID string, weight, height, age *int, sex *string, activityLevel *int) error {
	updateFields := make(map[string]interface{})
	if weight != nil {
		updateFields["weight"] = *weight
	}
	if height != nil {
		updateFields["height"] = *height
	}
	if age != nil {
		updateFields["age"] = *age
	}
	if sex != nil {
		updateFields["sex"] = *sex
	}
	if activityLevel != nil {
		updateFields["activity_level"] = *activityLevel
	}
	if len(updateFields) == 0 {
		return nil
	}
	query := "UPDATE fitness_profiles SET "
	args := []interface{}{}
	i := 1
	for key, value := range updateFields {
		query += fmt.Sprintf("%s = $%d, ", key, i)
		args = append(args, value)
		i++
	}
	query = strings.TrimSuffix(query, ", ")
	query += fmt.Sprintf(" WHERE user_id = $%d", i)
	args = append(args, ID)
	_, err := r.db.ExecContext(ctx, query, args...)
	return err
}
func (r *Repository) GetFitnessProfile(ctx context.Context, id string) (models.FitnessProfile, error) {
	var user models.FitnessProfile
	err := r.db.QueryRowContext(ctx, `
		SELECT * FROM fitness_profiles
		WHERE id=$1
	`, id).Scan(&user.UserID, &user.Weight, &user.Height, &user.Age, &user.Sex, &user.ActivityLevel, &user.Created_At)
	return user, err
}
func (r *Repository) GetAllFitnessProfiles(ctx context.Context) ([]models.FitnessProfile, error) {
	cursor, err := r.db.QueryContext(ctx, `
		SELECT * FROM fitness_profiles ORDER BY id
	`)
	if err != nil {
		return []models.FitnessProfile{}, err
	}
	defer cursor.Close()
	var users []models.FitnessProfile
	for cursor.Next() {
		var user models.FitnessProfile
		err := cursor.Scan(&user.UserID, &user.Weight, &user.Height, &user.Age, &user.Sex, &user.ActivityLevel, &user.Created_At)
		if err != nil {
			return []models.FitnessProfile{}, err
		}
	}
	return users, nil
}
