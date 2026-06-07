package redis

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

type RefreshStore struct {
	client *redis.Client
}

func NewRefreshStore(addr string) *RefreshStore {
	return &RefreshStore{
		client: redis.NewClient(&redis.Options{
			Addr: addr,
		}),
	}
}
func (r *RefreshStore) key(refresh string) string {
	return fmt.Sprintf("refresh:%s", refresh)
}
func (r *RefreshStore) Save(ctx context.Context, userID, refresh, deviceID string, ttl time.Duration) error {
	value := fmt.Sprintf("%s:%s", userID, deviceID)
	return r.client.Set(ctx, r.key(refresh), value, ttl).Err()
}
func (r *RefreshStore) Get(ctx context.Context, refresh string) (string, string, error) {
	val, err := r.client.Get(ctx, r.key(refresh)).Result()
	if err != nil {
		return "", "", err
	}
	parts := strings.Split(val, ":")
	if len(parts) != 2 {
		return "", "", errors.New("invalid data")
	}
	return parts[0], parts[1], nil
}
func (r *RefreshStore) Del(ctx context.Context, refresh string) error {
	return r.client.Del(ctx, r.key(refresh)).Err()
}
func (r *RefreshStore) SaveCode(ctx context.Context, email string, code *big.Int) error {
	codeString := fmt.Sprintf("%06d", code.Int64())
	return r.client.Set(ctx, email, codeString, 10*time.Minute).Err()
}
func (r *RefreshStore) GetCode(ctx context.Context, email string) (string, error) {
	code, err := r.client.Get(ctx, email).Result()
	return code, err
}
func (r *RefreshStore) DeleteCode(ctx context.Context, email string) error {
	return r.client.Del(ctx, email).Err()
}
func (r *RefreshStore) MarkVerified(ctx context.Context, email string) error {
	return r.client.Set(ctx, "verified:"+email, "1", time.Hour).Err()
}
func (r *RefreshStore) IsVerified(ctx context.Context, email string) (bool, error) {
	_, err := r.client.Get(ctx, "verified:"+email).Result()
	if err == redis.Nil {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}
