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
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}
func (r *UserRepository) GetByID(ctx context.Context, id string) (models.User, error) {
	filter := bson.M{"_id": id}
	var user models.User
	if err := r.Collection.FindOne(ctx, filter).Decode(&user); err != nil {
		return models.User{}, errors.New("user not found")
	}
	return user, nil
}
func (r *UserRepository) Update(ctx context.Context, userID string, email, birthDate string, level int16, weight, height int64) error {
	filter := bson.M{"_id": userID}
	updateFields := bson.M{}
	if email != "" {
		updateFields["email"] = email
	}
	if birthDate != "" {
		updateFields["birth_date"] = birthDate
	}
	if level != 0 {
		updateFields["level"] = level
	}
	if weight != 0 {
		updateFields["weight"] = weight
	}
	if height != 0 {
		updateFields["height"] = height
	}
	update := bson.M{"$set": updateFields}
	_, err := r.Collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}
	return nil
}

func (r *UserRepository) GetAllUsers(ctx context.Context) ([]models.User, error) {
	filter := bson.M{}
	cursor, err := r.Collection.Find(ctx, filter)
	if err != nil {
		return []models.User{}, err
	}
	var users []models.User
	for cursor.Next(ctx) {
		var user models.User
		if err := cursor.Decode(&user); err != nil {
			return []models.User{}, err
		}
		users = append(users, user)
	}
	return users, nil
}
func (r *UserRepository) FindByProviderID(ctx context.Context, providerID, providerField string) (*models.User, error) {
	var user models.User
	err := r.Collection.FindOne(ctx, bson.M{
		providerField: providerID,
	}).Decode(&user)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	return &user, err
}

func (r *UserRepository) FindByYandexID(ctx context.Context, yandexID string) (*models.User, error) {
	return r.FindByProviderID(ctx, yandexID, "yandex_id")
}

func (r *UserRepository) FindByGoogleID(ctx context.Context, googleID string) (*models.User, error) {
	return r.FindByProviderID(ctx, googleID, "google_id")
}
