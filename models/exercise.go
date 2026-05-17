package models

type Exercise struct {
	ID              int    `json:"id"`
	Name            string `json:"name"`
	MuscleGroup     string `json:"muscle_group"`
	IsCustom        bool   `json:"is_custom"`
	CreatedByUserID string `json:"created_by_user_id,omitempty"`
}
