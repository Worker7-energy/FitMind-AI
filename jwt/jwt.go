package jwt

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateAccessToken(userID string, secret string, ttl time.Duration) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(ttl).Unix(),
		"iss":     "auth",
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
