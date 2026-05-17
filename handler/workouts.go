package handler

import (
	"fitnes_app/main_module/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

// Workout Templates

func (h *Handler) CreateWorkoutTemplate(c *gin.Context) {
	var req struct {
		UserID string `json:"user_id"`
		Name   string `json:"name"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	id, err := h.repo.CreateWorkoutTemplate(c.Request.Context(), req.UserID, req.Name)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, gin.H{"id": id})
}

func (h *Handler) GetWorkoutTemplate(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid id"})
		return
	}
	template, err := h.repo.GetWorkoutTemplateByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(404, gin.H{"error": "template not found"})
		return
	}
	exercises, err := h.repo.GetWorkoutExercisesByTemplate(c.Request.Context(), id)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"template": template, "exercises": exercises})
}

func (h *Handler) GetWorkoutTemplatesByUser(c *gin.Context) {
	userID := c.Param("user_id")
	templates, err := h.repo.GetWorkoutTemplatesByUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, templates)
}

func (h *Handler) UpdateWorkoutTemplate(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid id"})
		return
	}
	var req struct {
		Name string `json:"name"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	if err := h.repo.UpdateWorkoutTemplate(c.Request.Context(), id, req.Name); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"status": "updated"})
}

func (h *Handler) DeleteWorkoutTemplate(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid id"})
		return
	}
	if err := h.repo.DeleteWorkoutTemplate(c.Request.Context(), id); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"status": "deleted"})
}

// Workout Exercises (within a template)

func (h *Handler) AddWorkoutExercise(c *gin.Context) {
	var we models.WorkoutExercise
	if err := c.ShouldBindJSON(&we); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	id, err := h.repo.AddWorkoutExercise(c.Request.Context(), we)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, gin.H{"id": id})
}

func (h *Handler) UpdateWorkoutExercise(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid id"})
		return
	}
	var req struct {
		Sets       int     `json:"sets"`
		Reps       int     `json:"reps"`
		Weight     float64 `json:"weight"`
		OrderIndex int     `json:"order_index"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	if err := h.repo.UpdateWorkoutExercise(c.Request.Context(), id, req.Sets, req.Reps, req.Weight, req.OrderIndex); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"status": "updated"})
}

func (h *Handler) DeleteWorkoutExercise(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid id"})
		return
	}
	if err := h.repo.DeleteWorkoutExercise(c.Request.Context(), id); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"status": "deleted"})
}

// Workout Sessions

func (h *Handler) StartWorkoutSession(c *gin.Context) {
	var req struct {
		UserID     string `json:"user_id"`
		TemplateID int    `json:"template_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	id, err := h.repo.CreateWorkoutSession(c.Request.Context(), req.UserID, req.TemplateID)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, gin.H{"session_id": id})
}

func (h *Handler) CompleteWorkoutSession(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid id"})
		return
	}
	var req struct {
		DurationMinutes int `json:"duration_minutes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	if err := h.repo.CompleteWorkoutSession(c.Request.Context(), id, req.DurationMinutes); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"status": "completed"})
}

func (h *Handler) GetWorkoutSession(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid id"})
		return
	}
	session, err := h.repo.GetWorkoutSessionByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(404, gin.H{"error": "session not found"})
		return
	}
	results, err := h.repo.GetWorkoutResultsBySession(c.Request.Context(), id)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"session": session, "results": results})
}

func (h *Handler) GetWorkoutSessionsByUser(c *gin.Context) {
	userID := c.Param("user_id")
	sessions, err := h.repo.GetWorkoutSessionsByUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, sessions)
}

// Workout Results

func (h *Handler) SaveWorkoutResult(c *gin.Context) {
	var wr models.WorkoutResult
	if err := c.ShouldBindJSON(&wr); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	id, err := h.repo.SaveWorkoutResult(c.Request.Context(), wr)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, gin.H{"id": id})
}
