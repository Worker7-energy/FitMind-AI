package handler

import (
	"fitnes_app/auth_module/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *service.Service
}

func NewHandler(service *service.Service) *Handler {
	return &Handler{
		service: service,
	}
}
func (h *Handler) Register(c *gin.Context) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}
	if err := h.service.Register(c.Request.Context(), req.Email, req.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}
	c.JSON(200, gin.H{"status": "registered"})
}
func (h *Handler) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		DeviceID string `json:"device_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnauthorized, err)
		return
	}
	access, refresh, err := h.service.Login(c.Request.Context(), req.Email, req.Password, req.DeviceID)
	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}
	c.JSON(200, gin.H{
		"access_token":  access,
		"refresh_token": refresh,
	})
}
func (h *Handler) Refresh(c *gin.Context) {
	var req struct {
		Refresh  string `json:"refresh_token"`
		DeviceID string `json:"device_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}
	access, refresh, err := h.service.Refresh(c.Request.Context(), req.Refresh, req.DeviceID)
	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}
	c.JSON(200, gin.H{
		"access":  access,
		"refresh": refresh,
	})
}
func (h *Handler) GetByID(c *gin.Context) {
	id := c.Param("id")
	user, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(400, err)
		return
	}
	c.JSON(200, user)
}
func (h *Handler) UpdateUser(c *gin.Context) {
	userID := c.Param("id")
	var req struct {
		Email     string `json:"email,omitempty"`
		Birthdate string `json:"birth_date,omitempty"`
		Level     int16  `json:"level"`
		Weight    int64  `json:"weight,omitempty"`
		Height    int64  `json:"height,omitempty"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}
	err := h.service.UpdateUser(c.Request.Context(), userID, req.Email, req.Birthdate, req.Level, req.Weight, req.Height)
	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

func (h *Handler) GetAllUsers(c *gin.Context) {
	users, err := h.service.GetAllUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}
	c.JSON(http.StatusOK, users)
}
