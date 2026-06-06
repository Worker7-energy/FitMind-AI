package handler

import (
	"fitnes_app/auth_module/service"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service       *service.Service
	yandexService *service.YandexService
	googleService *service.GoogleService
}

func NewHandler(svc *service.Service, yandex *service.YandexService, google *service.GoogleService) *Handler {
	return &Handler{
		service:       svc,
		yandexService: yandex,
		googleService: google,
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

func (h *Handler) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			return
		}
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization format"})
			return
		}
		userID, err := h.service.ValidateToken(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}
		c.Set("user_id", userID)
		c.Next()
	}
}

func (h *Handler) GoogleLogin(c *gin.Context) {
	q := url.Values{}
	q.Set("response_type", "code")
	q.Set("client_id", os.Getenv("GOOGLE_CLIENT_ID"))
	q.Set("redirect_uri", os.Getenv("GOOGLE_REDIRECT_URL"))
	q.Set("scope", "email profile")
	googleURL := "https://accounts.google.com/o/oauth2/auth?" + q.Encode()
	c.Redirect(http.StatusFound, googleURL)
}

func (h *Handler) GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no code"})
		return
	}
	accessToken, err := h.googleService.ExchangeCode(c.Request.Context(), code)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	guser, err := h.googleService.GetUser(c.Request.Context(), accessToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	result, err := h.service.LoginWithGoogle(c.Request.Context(), guser.GoogleID, guser.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	q := url.Values{}
	q.Set("access_token", result.AccessToken)
	q.Set("refresh_token", result.RefreshToken)
	q.Set("user_id", result.User.ID)
	q.Set("email", result.User.Email)
	c.Redirect(http.StatusFound, os.Getenv("FRONTEND_URL")+"?"+q.Encode())
}

func (h *Handler) GetAllUsers(c *gin.Context) {
	users, err := h.service.GetAllUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusBadRequest, err)
		return
	}
	c.JSON(http.StatusOK, users)
}
func (h *Handler) YandexLogin(c *gin.Context) {
	q := url.Values{}
	q.Set("response_type", "code")
	q.Set("client_id", os.Getenv("YANDEX_CLIENT_ID"))
	q.Set("redirect_uri", os.Getenv("YANDEX_REDIRECT_URL"))
	yandexURL := "https://oauth.yandex.ru/authorize?" + q.Encode()
	c.Redirect(http.StatusFound, yandexURL)
}
func (h *Handler) YandexCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no code"})
		return
	}
	accessToken, err := h.yandexService.ExchangeCode(
		c.Request.Context(),
		code,
	)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	yuser, err := h.yandexService.GetUser(
		c.Request.Context(),
		accessToken,
	)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	result, err := h.service.LoginWithYandex(c.Request.Context(), yuser.ID, yuser.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	q := url.Values{}
	q.Set("access_token", result.AccessToken)
	q.Set("refresh_token", result.RefreshToken)
	q.Set("user_id", result.User.ID)
	q.Set("email", result.User.Email)
	c.Redirect(http.StatusFound, os.Getenv("FRONTEND_URL")+"?"+q.Encode())
}
