package repository

import (
	"context"
	"fitnes_app/main_module/models"
	"fmt"
	"strings"
)

func (r *Repository) CreateFitnessProfile(ctx context.Context, ID string, weight, height, age int, sex string, activityLevel int, dailyCaloriesGoal int) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO fitness_profiles (user_id, weight, height, age, sex, activity_level, daily_calories_goal)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, ID, weight, height, age, sex, activityLevel, dailyCaloriesGoal)
	return err
}
func (r *Repository) UpdateFitnessProfile(ctx context.Context, ID string, weight, height, age *int, sex *string, activityLevel, dailyCaloriesGoal *int) error {
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
	if dailyCaloriesGoal != nil {
		updateFields["daily_calories_goal"] = *dailyCaloriesGoal
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
func (r *Repository) GetFitnessProfile(ctx context.Context, userID string) (models.FitnessProfile, error) {
	var user models.FitnessProfile
	err := r.db.QueryRowContext(ctx, `
		SELECT id, user_id, weight, height, age, sex, activity_level, COALESCE(daily_calories_goal, 0), created_at
		FROM fitness_profiles WHERE user_id=$1
	`, userID).Scan(&user.ID, &user.UserID, &user.Weight, &user.Height, &user.Age, &user.Sex, &user.ActivityLevel, &user.DailyCaloriesGoal, &user.CreatedAt)
	return user, err
}
func (r *Repository) GetAllFitnessProfiles(ctx context.Context) ([]models.FitnessProfile, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, user_id, weight, height, age, sex, activity_level, COALESCE(daily_calories_goal, 0), created_at
		FROM fitness_profiles ORDER BY id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var users []models.FitnessProfile
	for rows.Next() {
		var user models.FitnessProfile
		err := rows.Scan(&user.ID, &user.UserID, &user.Weight, &user.Height, &user.Age, &user.Sex, &user.ActivityLevel, &user.DailyCaloriesGoal, &user.CreatedAt)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, nil
}
