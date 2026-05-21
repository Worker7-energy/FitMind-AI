package service

import (
	"context"
	"encoding/json"
	"errors"
	"fitnes_app/auth_module/jwt"
	"fitnes_app/auth_module/models"
	"fitnes_app/auth_module/redis"
	"fitnes_app/auth_module/repository"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	repository    *repository.UserRepository
	refreshStore  *redis.RefreshStore
}

type YandexService struct {
	clientID     string
	clientSecret string
	redirectURL  string
}

type GoogleService struct {
	clientID     string
	clientSecret string
	redirectURL  string
}

type AuthResult struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	User         *models.User `json:"user"`
}

func NewYandexService(clientID, clientSecret, redirectURL string) *YandexService {
	return &YandexService{
		clientID:     clientID,
		clientSecret: clientSecret,
		redirectURL:  redirectURL,
	}
}

func NewGoogleService(clientID, clientSecret, redirectURL string) *GoogleService {
	return &GoogleService{
		clientID:     clientID,
		clientSecret: clientSecret,
		redirectURL:  redirectURL,
	}
}

func NewService(repository *repository.UserRepository, refreshStore *redis.RefreshStore) *Service {
	return &Service{
		repository:   repository,
		refreshStore: refreshStore,
	}
}
func (s *Service) Register(ctx context.Context, email, password string) error {
	existing, err := s.repository.GetByEmail(ctx, email)
	if err == nil || existing != nil {
		return errors.New("user already exists")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	id := uuid.New().String()
	user := &models.User{
		ID:        id,
		Email:     email,
		Password:  string(hash),
		Provider:  "local",
		CreatedAt: time.Now(),
	}
	return s.repository.Create(ctx, user)
}
func (s *Service) Login(ctx context.Context, email, password, deviceID string) (string, string, error) {
	user, err := s.repository.GetByEmail(ctx, email)
	if err != nil {
		return "", "", errors.New("invalid credentials")
	}
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return "", "", errors.New("invalid credentials")
	}
	secret := os.Getenv("secret")
	accessToken, err := jwt.GenerateAccessToken(user.ID, secret, 10*time.Minute)
	if err != nil {
		return "", "", err
	}
	refreshToken := uuid.New().String()
	ttl := 7 * 24 * time.Hour
	err = s.refreshStore.Save(context.Background(), user.ID, refreshToken, deviceID, ttl)
	if err != nil {
		return "", "", err
	}
	return accessToken, refreshToken, nil
}
func (s *Service) Refresh(ctx context.Context, refresh, deviceID string) (string, string, error) {
	userID, storedDeviceID, err := s.refreshStore.Get(ctx, refresh)
	if err != nil {
		return "", "", errors.New("invalid credentials")
	}
	if storedDeviceID != deviceID {
		return "", "", errors.New("invalid credentials")
	}
	refreshToken := uuid.New().String()
	if err := s.refreshStore.Save(ctx, userID, refreshToken, deviceID, 7*24*time.Hour); err != nil {
		return "", "", err
	}
	accessToken, err := jwt.GenerateAccessToken(userID, os.Getenv("secret"), 10*time.Minute)
	if err != nil {
		return "", "", err
	}
	_ = s.refreshStore.Del(ctx, refresh)
	return accessToken, refreshToken, nil
}
func (s *Service) GetByID(ctx context.Context, id string) (models.User, error) {
	return s.repository.GetByID(ctx, id)
}
func (s *Service) UpdateUser(ctx context.Context, userID, email, birthDate string, level int16, weight, height int64) error {
	return s.repository.Update(ctx, userID, email, birthDate, level, weight, height)
}
func (s *Service) GetAllUsers(ctx context.Context) ([]models.User, error) {
	return s.repository.GetAllUsers(ctx)
}
func (s *YandexService) ExchangeCode(ctx context.Context, code string) (string, error) {
	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("client_id", s.clientID)
	data.Set("client_secret", s.clientSecret)
	data.Set("code", code)
	data.Set("redirect_uri", s.redirectURL)
	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		"https://oauth.yandex.ru/token",
		strings.NewReader(data.Encode()),
	)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var result struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	if result.AccessToken == "" {
		return "", errors.New("no access token from yandex")
	}
	return result.AccessToken, nil
}
func (s *GoogleService) ExchangeCode(ctx context.Context, code string) (string, error) {
	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("client_id", s.clientID)
	data.Set("client_secret", s.clientSecret)
	data.Set("code", code)
	data.Set("redirect_uri", s.redirectURL)
	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		"https://oauth2.googleapis.com/token",
		strings.NewReader(data.Encode()),
	)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var result struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	if result.AccessToken == "" {
		return "", errors.New("no access token from google")
	}
	return result.AccessToken, nil
}

func (s *GoogleService) GetUser(ctx context.Context, accessToken string) (*models.User, error) {
	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		"https://www.googleapis.com/oauth2/v2/userinfo",
		nil,
	)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var googleUser struct {
		ID    string `json:"id"`
		Email string `json:"email"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		return nil, err
	}
	return &models.User{
		ID:       googleUser.ID,
		Email:    googleUser.Email,
		Provider: "google",
		GoogleID: googleUser.ID,
	}, nil
}

func (s *YandexService) GetUser(ctx context.Context, accessToken string) (*models.User, error) {
	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		"https://login.yandex.ru/info?format=json",
		nil,
	)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "OAuth "+accessToken)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var user models.User
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, err
	}
	return &user, nil
}
func (s *Service) findOrCreateOAuthUser(ctx context.Context, provider, providerID, email string) (*models.User, error) {
	var user *models.User
	var err error

	switch provider {
	case "yandex":
		user, err = s.repository.FindByYandexID(ctx, providerID)
	case "google":
		user, err = s.repository.FindByGoogleID(ctx, providerID)
	default:
		return nil, errors.New("unknown provider")
	}
	if err != nil {
		return nil, err
	}
	if user != nil {
		return user, nil
	}

	user = &models.User{
		ID:        uuid.New().String(),
		Email:     email,
		Provider:  provider,
		CreatedAt: time.Now(),
	}
	switch provider {
	case "yandex":
		user.YandexID = providerID
	case "google":
		user.GoogleID = providerID
	}
	if err := s.repository.Create(ctx, user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *Service) LoginWithYandex(ctx context.Context, yandexID, email string) (*AuthResult, error) {
	user, err := s.findOrCreateOAuthUser(ctx, "yandex", yandexID, email)
	if err != nil {
		return nil, err
	}
	return s.IssueTokens(ctx, user)
}

func (s *Service) LoginWithGoogle(ctx context.Context, googleID, email string) (*AuthResult, error) {
	user, err := s.findOrCreateOAuthUser(ctx, "google", googleID, email)
	if err != nil {
		return nil, err
	}
	return s.IssueTokens(ctx, user)
}
func (s *Service) IssueTokens(_ context.Context, user *models.User) (*AuthResult, error) {
	userID := user.ID
	accessToken, err := jwt.GenerateAccessToken(userID, os.Getenv("secret"), 10*time.Minute)
	if err != nil {
		return nil, err
	}
	refreshToken := uuid.New().String()
	return &AuthResult{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
	}, nil
}

func (s *Service) ValidateToken(tokenString string) (string, error) {
	return jwt.ValidateAccessToken(tokenString, os.Getenv("secret"))
}
