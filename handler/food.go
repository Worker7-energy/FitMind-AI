package handler

import (
	"fitnes_app/main_module/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// Food Items

func (h *Handler) CreateFoodItem(c *gin.Context) {
	var fi models.FoodItem
	if err := c.ShouldBindJSON(&fi); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	id, err := h.repo.CreateFoodItem(c.Request.Context(), fi)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, gin.H{"id": id})
}

func (h *Handler) GetFoodItem(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid id"})
		return
	}
	item, err := h.repo.GetFoodItemByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(404, gin.H{"error": "food item not found"})
		return
	}
	c.JSON(200, item)
}

func (h *Handler) GetAllFoodItems(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		userID = ""
	}
	items, err := h.repo.GetAllFoodItems(c.Request.Context(), userID)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, items)
}

func (h *Handler) SearchFoodItems(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(400, gin.H{"error": "query parameter q is required"})
		return
	}
	userID := c.Query("user_id")
	if userID == "" {
		userID = ""
	}
	items, err := h.repo.SearchFoodItems(c.Request.Context(), query, userID)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, items)
}

func (h *Handler) UpdateFoodItem(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid id"})
		return
	}
	var fi models.FoodItem
	if err := c.ShouldBindJSON(&fi); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	if err := h.repo.UpdateFoodItem(c.Request.Context(), id, fi); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"status": "updated"})
}

func (h *Handler) DeleteFoodItem(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid id"})
		return
	}
	if err := h.repo.DeleteFoodItem(c.Request.Context(), id); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"status": "deleted"})
}

// Meal Logs

func (h *Handler) CreateMealLog(c *gin.Context) {
	var req struct {
		UserID   string  `json:"user_id"`
		FoodID   int     `json:"food_id"`
		Grams    float64 `json:"grams"`
		MealType string  `json:"meal_type"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	ml := models.MealLog{
		UserID:   req.UserID,
		FoodID:   req.FoodID,
		Grams:    req.Grams,
		MealType: req.MealType,
		Date:     time.Now(),
	}
	id, err := h.repo.CreateMealLog(c.Request.Context(), ml)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, gin.H{"id": id})
}

func (h *Handler) GetMealLogs(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(400, gin.H{"error": "user_id query parameter is required"})
		return
	}
	dateStr := c.Query("date")
	var date time.Time
	var err error
	if dateStr != "" {
		date, err = time.Parse("2006-01-02", dateStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
			return
		}
	} else {
		date = time.Now()
	}
	logs, err := h.repo.GetMealLogsByUserAndDate(c.Request.Context(), userID, date)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, logs)
}

func (h *Handler) DeleteMealLog(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid id"})
		return
	}
	if err := h.repo.DeleteMealLog(c.Request.Context(), id); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"status": "deleted"})
}

// Calorie Goals

func (h *Handler) SetCalorieGoal(c *gin.Context) {
	var req struct {
		UserID    string `json:"user_id"`
		DailyGoal int    `json:"daily_goal"`
		Date      string `json:"date"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}
	if err := h.repo.SetCalorieGoal(c.Request.Context(), req.UserID, req.DailyGoal, date); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"status": "goal set"})
}

func (h *Handler) GetCalorieGoal(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(400, gin.H{"error": "user_id query parameter is required"})
		return
	}
	dateStr := c.Query("date")
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}
	goal, err := h.repo.GetCalorieGoal(c.Request.Context(), userID, date)
	if err != nil {
		c.JSON(404, gin.H{"error": "calorie goal not found"})
		return
	}
	c.JSON(200, goal)
}
