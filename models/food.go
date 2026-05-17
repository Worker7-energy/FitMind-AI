package models

import "time"

type FoodItem struct {
	ID       int     `json:"id"`
	Name     string  `json:"name"`
	Calories float64 `json:"calories"`
	Protein  float64 `json:"protein"`
	Fat      float64 `json:"fat"`
	Carbs    float64 `json:"carbs"`
	UserID   string  `json:"user_id,omitempty"`
}

type MealLog struct {
	ID       int       `json:"id"`
	UserID   string    `json:"user_id"`
	FoodID   int       `json:"food_id"`
	Grams    float64   `json:"grams"`
	MealType string    `json:"meal_type"`
	Date     time.Time `json:"date"`
}

type CalorieGoal struct {
	ID        int       `json:"id"`
	UserID    string    `json:"user_id"`
	DailyGoal int       `json:"daily_goal"`
	Date      time.Time `json:"date"`
}
