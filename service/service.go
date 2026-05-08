package service

import (
	"context"
	"errors"
	"fitnes_app/auth_module/jwt"
	"fitnes_app/auth_module/models"
	"fitnes_app/auth_module/redis"
	"fitnes_app/auth_module/repository"
	"os"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	repository   *repository.UserRepository
	refreshStore *redis.RefreshStore
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
		ID:       id,
		Email:    email,
		Password: string(hash),
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
