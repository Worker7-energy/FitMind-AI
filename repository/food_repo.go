package repository

import (
	"context"
	"fitnes_app/main_module/models"
	"time"
)

// Food Items

func (r *Repository) CreateFoodItem(ctx context.Context, fi models.FoodItem) (int, error) {
	var id int
	err := r.db.QueryRowContext(ctx, `
		INSERT INTO food_items (name, calories, protein, fat, carbs, user_id)
		VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
	`, fi.Name, fi.Calories, fi.Protein, fi.Fat, fi.Carbs, fi.UserID).Scan(&id)
	return id, err
}

func (r *Repository) GetFoodItemByID(ctx context.Context, id int) (models.FoodItem, error) {
	var fi models.FoodItem
	var userID *string
	err := r.db.QueryRowContext(ctx, `
		SELECT id, name, calories, protein, fat, carbs, user_id FROM food_items WHERE id=$1
	`, id).Scan(&fi.ID, &fi.Name, &fi.Calories, &fi.Protein, &fi.Fat, &fi.Carbs, &userID)
	if userID != nil {
		fi.UserID = *userID
	}
	return fi, err
}

func (r *Repository) GetAllFoodItems(ctx context.Context, userID string) ([]models.FoodItem, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, name, calories, protein, fat, carbs, user_id
		FROM food_items WHERE user_id IS NULL OR user_id=$1 ORDER BY name
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.FoodItem
	for rows.Next() {
		var fi models.FoodItem
		var uid *string
		if err := rows.Scan(&fi.ID, &fi.Name, &fi.Calories, &fi.Protein, &fi.Fat, &fi.Carbs, &uid); err != nil {
			return nil, err
		}
		if uid != nil {
			fi.UserID = *uid
		}
		items = append(items, fi)
	}
	return items, nil
}

func (r *Repository) SearchFoodItems(ctx context.Context, query, userID string) ([]models.FoodItem, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, name, calories, protein, fat, carbs, user_id
		FROM food_items
		WHERE (user_id IS NULL OR user_id=$1) AND name ILIKE '%' || $2 || '%'
		ORDER BY name
	`, userID, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.FoodItem
	for rows.Next() {
		var fi models.FoodItem
		var uid *string
		if err := rows.Scan(&fi.ID, &fi.Name, &fi.Calories, &fi.Protein, &fi.Fat, &fi.Carbs, &uid); err != nil {
			return nil, err
		}
		if uid != nil {
			fi.UserID = *uid
		}
		items = append(items, fi)
	}
	return items, nil
}

func (r *Repository) UpdateFoodItem(ctx context.Context, id int, fi models.FoodItem) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE food_items SET name=$1, calories=$2, protein=$3, fat=$4, carbs=$5 WHERE id=$6
	`, fi.Name, fi.Calories, fi.Protein, fi.Fat, fi.Carbs, id)
	return err
}

func (r *Repository) DeleteFoodItem(ctx context.Context, id int) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM food_items WHERE id=$1`, id)
	return err
}

// Meal Logs

func (r *Repository) CreateMealLog(ctx context.Context, ml models.MealLog) (int, error) {
	var id int
	err := r.db.QueryRowContext(ctx, `
		INSERT INTO meal_logs (user_id, food_id, grams, meal_type, date)
		VALUES ($1, $2, $3, $4, $5) RETURNING id
	`, ml.UserID, ml.FoodID, ml.Grams, ml.MealType, ml.Date).Scan(&id)
	return id, err
}

func (r *Repository) GetMealLogsByUserAndDate(ctx context.Context, userID string, date time.Time) ([]models.MealLog, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, user_id, food_id, grams, meal_type, date
		FROM meal_logs WHERE user_id=$1 AND date::date=$2::date ORDER BY date
	`, userID, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.MealLog
	for rows.Next() {
		var ml models.MealLog
		if err := rows.Scan(&ml.ID, &ml.UserID, &ml.FoodID, &ml.Grams, &ml.MealType, &ml.Date); err != nil {
			return nil, err
		}
		logs = append(logs, ml)
	}
	return logs, nil
}

func (r *Repository) DeleteMealLog(ctx context.Context, id int) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM meal_logs WHERE id=$1`, id)
	return err
}

// Calorie Goals

func (r *Repository) SetCalorieGoal(ctx context.Context, userID string, goal int, date time.Time) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO calorie_goals (user_id, daily_goal, date)
		VALUES ($1, $2, $3::date)
		ON CONFLICT (user_id, date) DO UPDATE SET daily_goal=$2
	`, userID, goal, date)
	return err
}

func (r *Repository) GetCalorieGoal(ctx context.Context, userID string, date time.Time) (models.CalorieGoal, error) {
	var cg models.CalorieGoal
	err := r.db.QueryRowContext(ctx, `
		SELECT id, user_id, daily_goal, date FROM calorie_goals WHERE user_id=$1 AND date=$2::date
	`, userID, date).Scan(&cg.ID, &cg.UserID, &cg.DailyGoal, &cg.Date)
	return cg, err
}
