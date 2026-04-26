package repository

import (
	"context"
	"errors"
	"fitnes_app/auth_module/models"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type UserRepository struct {
	Collection *mongo.Collection
}

func NewRepository(db *mongo.Database) *UserRepository {
	return &UserRepository{
		Collection: db.Collection("users"),
	}
}
func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	_, err := r.Collection.InsertOne(ctx, user)
	if err != nil {
		return err
	}
	return nil
}
func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	filter := bson.M{"email": email}
	err := r.Collection.FindOne(ctx, filter).Decode(&user)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}
	return &user, nil
}
