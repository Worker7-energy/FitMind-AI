package models

import (
	"encoding/json"
	"time"
)

type AiGenerationLog struct {
	ID          int             `json:"id"`
	UserID      string          `json:"user_id"`
	Type        string          `json:"type"`
	InputParams json.RawMessage `json:"input_params"`
	OutputJSON  json.RawMessage `json:"output_json"`
	CreatedAt   time.Time       `json:"created_at"`
}
