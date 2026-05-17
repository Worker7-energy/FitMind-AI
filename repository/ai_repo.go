package repository

import (
	"context"
	"encoding/json"
)

func (r *Repository) LogAiGeneration(ctx context.Context, userID, genType string, inputParams, outputJSON json.RawMessage) (int, error) {
	var id int
	err := r.db.QueryRowContext(ctx, `
		INSERT INTO ai_generation_logs (user_id, type, input_params, output_json)
		VALUES ($1, $2, $3, $4) RETURNING id
	`, userID, genType, inputParams, outputJSON).Scan(&id)
	return id, err
}
