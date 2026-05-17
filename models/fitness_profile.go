package models

import "time"

type FitnessProfile struct {
	ID                int       `json:"id"`
	UserID            string    `json:"user_id"`
	Weight            int       `json:"weight"`
	Height            int       `json:"height"`
	Age               int       `json:"age"`
	Sex               string    `json:"sex"`
	ActivityLevel     int       `json:"activity_level"`
	DailyCaloriesGoal int       `json:"daily_calories_goal"`
	CreatedAt         time.Time `json:"created_at"`
}
