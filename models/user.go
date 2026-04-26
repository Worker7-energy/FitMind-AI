package models

type User struct {
	ID       string `json:"user_id" bson:"_id"`
	Email    string `json:"email" bson:"email"`
	Password string `json:"password"`
}
