package redis

import (
	"context"
	"errors"
	"fmt"
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
