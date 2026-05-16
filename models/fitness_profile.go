package models

import "time"

type FitnessProfile struct {
	UserID        string    `json:"user_id"`
	Weight        int       `json:"weight"`
	Height        int       `json:"height"`
	Age           int       `json:"age"`
	Sex           string    `json:"sex"`
	ActivityLevel int       `json:"activity_level"`
	Created_At    time.Time `json:"created_at"`
}
