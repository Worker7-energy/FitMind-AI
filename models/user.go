package models

type User struct {
	ID       string `json:"user_id" bson:"_id"`
	Email    string `json:"email" bson:"email"`
	Password string `json:"password"`
	Birthdate string `json:"birth_date,omitempty"`
	Weight int64 `json:"weight,omitempty"`
	Height int64 `json:"height,omitempty"`
}
