package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

func (h *Handler) CreateExercise(c *gin.Context) {
	var req struct {
		Name            string `json:"name"`
		MuscleGroup     string `json:"muscle_group"`
		IsCustom        bool   `json:"is_custom"`
		CreatedByUserID string `json:"created_by_user_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	id, err := h.repo.CreateExercise(c.Request.Context(), req.Name, req.MuscleGroup, req.IsCustom, req.CreatedByUserID)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, gin.H{"id": id})
}

func (h *Handler) GetExercise(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid id"})
		return
	}
	exercise, err := h.repo.GetExerciseByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(404, gin.H{"error": "exercise not found"})
		return
	}
	c.JSON(200, exercise)
}

func (h *Handler) GetAllExercises(c *gin.Context) {
	exercises, err := h.repo.GetAllExercises(c.Request.Context())
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, exercises)
}

func (h *Handler) SearchExercises(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(400, gin.H{"error": "query parameter q is required"})
		return
	}
	exercises, err := h.repo.SearchExercises(c.Request.Context(), query)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, exercises)
}

func (h *Handler) UpdateExercise(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid id"})
		return
	}
	var req struct {
		Name        string `json:"name"`
		MuscleGroup string `json:"muscle_group"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	if err := h.repo.UpdateExercise(c.Request.Context(), id, req.Name, req.MuscleGroup); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"status": "updated"})
}

func (h *Handler) DeleteExercise(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid id"})
		return
	}
	if err := h.repo.DeleteExercise(c.Request.Context(), id); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"status": "deleted"})
}
