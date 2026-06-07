package email

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"net/smtp"
	"os"
)

type Email struct {
	from     string
	password string
	host     string
	port     string
}

func NewEmailService() *Email {
	return &Email{
		from:     os.Getenv("SMTP_USER"),
		password: os.Getenv("SMTP_PASSWORD"),
		host:     os.Getenv("SMTP_HOST"),
		port:     os.Getenv("SMTP_PORT"),
	}
}
func (e *Email) GenerateCode() (*big.Int, error) {
	code, err := rand.Int(rand.Reader, big.NewInt(900000))
	if err != nil {
		return nil, err
	}
	return code, err
}
func (e *Email) SendVerification(ctx context.Context, code *big.Int, email string) error {
	auth := smtp.PlainAuth("", e.from, e.password, e.host)
	codeString := fmt.Sprintf("%06d", code.Int64())
	msg := []byte(fmt.Sprintf(
		"From: %s\r\n"+
			"To: %s\r\n"+
			"Subject: Код подтверждения email\r\n\r\n"+
			"Ваш код подтверждения: %s\n\n"+
			"Код действителен 10 минут.",
		e.from, email, codeString))

	err := smtp.SendMail(e.host+":"+e.port, auth, e.from, []string{email}, msg)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}
	return nil
}
