package handler

import (
	"encoding/json"
	"log"

	"github.com/gin-gonic/gin"
)

// POST /ai/generate-workout
func (h *Handler) GenerateWorkout(c *gin.Context) {
	var req struct {
		UserID      string   `json:"user_id"`
		Sex         string   `json:"sex"`
		Weight      float64  `json:"weight"`
		Level       string   `json:"level"`
		Goal        string   `json:"goal"`
		Limitations []string `json:"limitations,omitempty"`
		Equipment   []string `json:"equipment,omitempty"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	inputParams, _ := json.Marshal(req)

	result, err := h.ai.GenerateWorkout(req.Sex, req.Weight, req.Level, req.Goal, req.Limitations, req.Equipment)
	if err != nil {
		log.Printf("AI GenerateWorkout error: %v", err)
		output := gin.H{
			"error": "AI generation failed: " + err.Error(),
			"note":  "Fallback — empty workout returned",
		}
		outputJSON, _ := json.Marshal(output)
		_, _ = h.repo.LogAiGeneration(c.Request.Context(), req.UserID, "workout", inputParams, outputJSON)
		c.JSON(502, output)
		return
	}

	var parsed interface{}
	if err := json.Unmarshal([]byte(result), &parsed); err != nil {
		parsed = gin.H{"raw": result}
	}

	outputJSON, _ := json.Marshal(parsed)
	_, _ = h.repo.LogAiGeneration(c.Request.Context(), req.UserID, "workout", inputParams, outputJSON)

	c.JSON(200, parsed)
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

	result, err := h.ai.GenerateMealPlan(req.Calories, req.Preferences, req.Diet)
	if err != nil {
		log.Printf("AI GenerateMealPlan error: %v", err)
		output := gin.H{
			"error": "AI generation failed: " + err.Error(),
			"note":  "Fallback — empty meal plan returned",
		}
		outputJSON, _ := json.Marshal(output)
		_, _ = h.repo.LogAiGeneration(c.Request.Context(), req.UserID, "meal_plan", inputParams, outputJSON)
		c.JSON(502, output)
		return
	}

	var parsed interface{}
	if err := json.Unmarshal([]byte(result), &parsed); err != nil {
		parsed = gin.H{"raw": result}
	}

	outputJSON, _ := json.Marshal(parsed)
	_, _ = h.repo.LogAiGeneration(c.Request.Context(), req.UserID, "meal_plan", inputParams, outputJSON)

	c.JSON(200, parsed)
}
