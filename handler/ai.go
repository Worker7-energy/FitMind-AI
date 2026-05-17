package handler

import (
	"encoding/json"

	"github.com/gin-gonic/gin"
)

// POST /ai/generate-workout
func (h *Handler) GenerateWorkout(c *gin.Context) {
	var req struct {
		UserID        string   `json:"user_id"`
		Sex           string   `json:"sex"`
		Weight        float64  `json:"weight"`
		Level         string   `json:"level"`
		Goal          string   `json:"goal"`
		Limitations   []string `json:"limitations,omitempty"`
		Equipment     []string `json:"equipment,omitempty"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	inputParams, _ := json.Marshal(req)

	// Stub response — AI integration will be added later
	output := gin.H{
		"exercises": []gin.H{},
		"note":      "AI generation not yet implemented. This is a placeholder.",
	}
	outputJSON, _ := json.Marshal(output)

	_, _ = h.repo.LogAiGeneration(c.Request.Context(), req.UserID, "workout", inputParams, outputJSON)

	c.JSON(200, output)
}

// POST /ai/generate-meal-plan
func (h *Handler) GenerateMealPlan(c *gin.Context) {
	var req struct {
		UserID      string   `json:"user_id"`
		Calories    int      `json:"calories"`
		Preferences []string `json:"preferences,omitempty"`
		Diet        string   `json:"diet,omitempty"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	inputParams, _ := json.Marshal(req)

	output := gin.H{
		"meals": []gin.H{},
		"note":  "AI generation not yet implemented. This is a placeholder.",
	}
	outputJSON, _ := json.Marshal(output)

	_, _ = h.repo.LogAiGeneration(c.Request.Context(), req.UserID, "meal_plan", inputParams, outputJSON)

	c.JSON(200, output)
}
