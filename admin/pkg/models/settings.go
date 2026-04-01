package models

import (
	"strings"
	"time"
)

type SettingsData struct {
	FormType string `json:"form_type" validate:"required,oneof=TALK COURSE SPECIAL"`

	Title       string `json:"title" validate:"required,min=3,max=255"`
	Description string `json:"description" validate:"max=2000"`

	StartDate time.Time `json:"start_date" validate:"required,gt"`
	EndDate   time.Time `json:"end_date" validate:"required,gtfield=StartDate"`

	MealPricePen float64 `json:"meal_price_pen" validate:"gte=0"`
	MealPriceUsd float64 `json:"meal_price_usd" validate:"gte=0"`

	SessionPricePen float64 `json:"session_price_pen" validate:"gte=0"`
	SessionPriceUsd float64 `json:"session_price_usd" validate:"gte=0"`
}

func (s *SettingsData) Normalize() {
	s.Title = strings.TrimSpace(s.Title)
	s.Description = strings.TrimSpace(s.Description)

	s.StartDate = s.StartDate.UTC()
	s.EndDate = s.EndDate.UTC()
}

type SessionData struct {
	Title       string    `json:"title" validate:"required,min=3,max=255"`
	SessionTime time.Time `json:"session_time" validate:"required,gt"`
}

func (s *SessionData) Normalize() {
	s.Title = strings.TrimSpace(s.Title)
	s.SessionTime = s.SessionTime.UTC()
}

type MealData struct {
	Title string `json:"title" validate:"required,min=1,max=255"`
}

func (s *MealData) Normalize() {
	s.Title = strings.TrimSpace(s.Title)
}
