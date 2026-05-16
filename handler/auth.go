package handler

import (
	"fitnes_app/main_module/repository"
	"time"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	repo *repository.Repository
}

func NewHandler(repo *repository.Repository) *Handler {
	return &Handler{repo: repo}
}
func (h *Handler) CreateFitnessProfile(c *gin.Context) {
	var req struct {
		ID            string    `json:"user_id"`
		Weight        int       `json:"weight"`
		Height        int       `json:"height"`
		Age           int       `json:"age"`
		Sex           string    `json:"sex"`
		ActivityLevel int       `json:"activity_level"`
		Created_At    time.Time `json:"created_at"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, err)
		return
	}
	err := h.repo.CreateFitnessProfile(
		c.Request.Context(),
		req.ID,
		req.Weight,
		req.Height,
		req.Age,
		req.Sex,
		req.ActivityLevel,
		req.Created_At,
	)
	if err != nil {
		c.JSON(400, err)
		return
	}
	c.JSON(200, gin.H{"status": "fitness profile created"})
}
func (h *Handler) UpdateFitnessProfile(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Weight        *int    `json:"weight"`
		Height        *int    `json:"height"`
		Age           *int    `json:"age"`
		Sex           *string `json:"sex"`
		ActivityLevel *int    `json:"activity_level"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, err)
		return
	}
	err := h.repo.UpdateFitnessProfile(
		c.Request.Context(),
		id,
		req.Weight,
		req.Height,
		req.Age,
		req.Sex,
		req.ActivityLevel,
	)
	if err != nil {
		c.JSON(400, err)
		return
	}
	c.JSON(200, gin.H{"status": "fitness profile updated"})
}
func (h *Handler) GetFitnessProfile(c *gin.Context) {
	id := c.Param("id")
	user, err := h.repo.GetFitnessProfile(c.Request.Context(), id)
	if err != nil {
		c.JSON(404, gin.H{"error": "fitness profile not found"})
		return
	}
	c.JSON(200, user)
}
func (h *Handler) GetAllFitnessProfiles(c *gin.Context) {
	users, err := h.repo.GetAllFitnessProfiles(c.Request.Context())
	if err != nil {
		c.JSON(400, gin.H{"error": err})
		return
	}
	c.JSON(200, users)
}
