package models

import "time"

type User struct {
	ID        string    `json:"user_id" bson:"_id"`
	Email     string    `json:"email" bson:"email"`
	Password  string    `json:"password"`
	Provider  string    `json:"provider"`
	YandexID  string    `json:"yandex_id" bson:"yandex_id"`
	GoogleID  string    `json:"google_id" bson:"google_id"`
	CreatedAt time.Time `json:"created_at"`
}
