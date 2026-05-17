package handler

import (
	"math"
	"strconv"

	"github.com/gin-gonic/gin"
)

func (h *Handler) Calculate1RM(c *gin.Context) {
	weightStr := c.Query("weight")
	repsStr := c.Query("reps")

	if weightStr == "" || repsStr == "" {
		c.JSON(400, gin.H{"error": "weight and reps query parameters are required"})
		return
	}

	weight, err := strconv.ParseFloat(weightStr, 64)
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid weight"})
		return
	}
	reps, err := strconv.ParseFloat(repsStr, 64)
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid reps"})
		return
	}

	if reps <= 0 || weight <= 0 {
		c.JSON(400, gin.H{"error": "weight and reps must be positive"})
		return
	}

	oneRM := weight * (1 + reps/30)
	oneRM = math.Round(oneRM*100) / 100

	c.JSON(200, gin.H{
		"one_rm":          oneRM,
		"weight":          weight,
		"reps":            reps,
		"formula":         "Epley",
		"working_weights": calculateWorkingWeights(oneRM),
	})
}

func (h *Handler) CalculateWorkingWeight(c *gin.Context) {
	var req struct {
		OneRM      float64 `json:"one_rm"`
		Percentage float64 `json:"percentage"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if req.OneRM <= 0 || req.Percentage <= 0 || req.Percentage > 100 {
		c.JSON(400, gin.H{"error": "one_rm must be positive, percentage must be between 1 and 100"})
		return
	}

	workingWeight := req.OneRM * req.Percentage / 100
	workingWeight = math.Round(workingWeight*100) / 100

	c.JSON(200, gin.H{
		"one_rm":          req.OneRM,
		"percentage":      req.Percentage,
		"working_weight":  workingWeight,
		"working_weights": calculateWorkingWeights(req.OneRM),
	})
}

func calculateWorkingWeights(oneRM float64) map[string]float64 {
	percentages := []struct {
		Name  string
		Value float64
	}{
		{"warmup_50", 50},
		{"warmup_60", 60},
		{"light_65", 65},
		{"moderate_70", 70},
		{"medium_75", 75},
		{"heavy_80", 80},
		{"very_heavy_85", 85},
		{"max_effort_90", 90},
		{"near_max_95", 95},
	}

	weights := make(map[string]float64, len(percentages))
	for _, p := range percentages {
		weights[p.Name] = math.Round(oneRM*p.Value/100*100) / 100
	}
	return weights
}
