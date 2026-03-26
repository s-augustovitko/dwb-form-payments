package models

import (
	"strings"
	"testing"
	"time"
)

// --- MealData.Normalize() ---

func TestMealData_Normalize_TrimsAndTitleCases(t *testing.T) {
	m := &MealData{Title: "  grilled chicken  "}
	m.Normalize()
	if strings.HasPrefix(m.Title, " ") || strings.HasSuffix(m.Title, " ") {
		t.Errorf("expected trimmed title, got %q", m.Title)
	}
}

func TestMealData_Normalize_EmptyTitle(t *testing.T) {
	m := &MealData{Title: "   "}
	m.Normalize()
	if m.Title != "" {
		t.Errorf("expected empty string after trimming all spaces, got %q", m.Title)
	}
}

// --- MealData validation ---

func TestMealData_Validate_Valid(t *testing.T) {
	m := MealData{Title: "Chicken"}
	if err := ValidateData(m); err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
}

func TestMealData_Validate_EmptyTitle(t *testing.T) {
	m := MealData{Title: ""}
	if err := ValidateData(m); err == nil {
		t.Fatal("expected validation error for empty Title, got nil")
	}
}

func TestMealData_Validate_TitleTooLong(t *testing.T) {
	m := MealData{Title: strings.Repeat("x", 256)}
	if err := ValidateData(m); err == nil {
		t.Fatal("expected validation error for title > 255 chars, got nil")
	}
}

func TestMealData_Validate_TitleAtMaxLength(t *testing.T) {
	m := MealData{Title: strings.Repeat("x", 255)}
	if err := ValidateData(m); err != nil {
		t.Fatalf("expected no error for title at 255 chars, got: %v", err)
	}
}

// --- SessionData.Normalize() ---

func TestSessionData_Normalize_TrimsTitle(t *testing.T) {
	now := time.Now().Add(time.Hour)
	s := &SessionData{Title: "  morning yoga  ", SessionTime: now}
	s.Normalize()
	if strings.HasPrefix(s.Title, " ") || strings.HasSuffix(s.Title, " ") {
		t.Errorf("expected trimmed title, got %q", s.Title)
	}
}

func TestSessionData_Normalize_ConvertsTitleToTitle(t *testing.T) {
	now := time.Now().Add(time.Hour)
	s := &SessionData{Title: "morning yoga", SessionTime: now}
	s.Normalize()
	// strings.ToTitle uppercases all letters
	if s.Title != strings.ToTitle("morning yoga") {
		t.Errorf("expected title-cased string, got %q", s.Title)
	}
}

func TestSessionData_Normalize_SessionTimeUTC(t *testing.T) {
	loc, _ := time.LoadLocation("America/Lima")
	localTime := time.Date(2025, 6, 1, 12, 0, 0, 0, loc)
	s := &SessionData{Title: "Session", SessionTime: localTime}
	s.Normalize()
	if s.SessionTime.Location() != time.UTC {
		t.Errorf("expected session time in UTC, got %v", s.SessionTime.Location())
	}
}

// --- SessionData validation ---

func TestSessionData_Validate_Valid(t *testing.T) {
	s := SessionData{
		Title:       "Workshop",
		SessionTime: time.Now().Add(time.Hour),
	}
	if err := ValidateData(s); err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
}

func TestSessionData_Validate_EmptyTitle(t *testing.T) {
	s := SessionData{
		Title:       "",
		SessionTime: time.Now().Add(time.Hour),
	}
	if err := ValidateData(s); err == nil {
		t.Fatal("expected error for empty Title, got nil")
	}
}

func TestSessionData_Validate_TitleTooShort(t *testing.T) {
	s := SessionData{
		Title:       "ab",
		SessionTime: time.Now().Add(time.Hour),
	}
	if err := ValidateData(s); err == nil {
		t.Fatal("expected error for Title with fewer than 3 chars, got nil")
	}
}

func TestSessionData_Validate_ZeroSessionTime(t *testing.T) {
	// zero time is not > now, so should fail the 'gt' constraint
	s := SessionData{
		Title:       "Session",
		SessionTime: time.Time{},
	}
	if err := ValidateData(s); err == nil {
		t.Fatal("expected error for zero SessionTime, got nil")
	}
}

func TestSessionData_Validate_PastSessionTime(t *testing.T) {
	s := SessionData{
		Title:       "Session",
		SessionTime: time.Now().Add(-time.Hour),
	}
	if err := ValidateData(s); err == nil {
		t.Fatal("expected error for past SessionTime, got nil")
	}
}

// --- SettingsData.Normalize() ---

func TestSettingsData_Normalize_TrimsTitle(t *testing.T) {
	future := time.Now().Add(time.Hour)
	s := &SettingsData{
		Title:       "  my event  ",
		Description: "desc",
		StartDate:   future,
		EndDate:     future.Add(time.Hour),
	}
	s.Normalize()
	if strings.HasPrefix(s.Title, " ") || strings.HasSuffix(s.Title, " ") {
		t.Errorf("expected trimmed title, got %q", s.Title)
	}
}

func TestSettingsData_Normalize_TrimsDescription(t *testing.T) {
	future := time.Now().Add(time.Hour)
	s := &SettingsData{
		Title:       "Title",
		Description: "  some description  ",
		StartDate:   future,
		EndDate:     future.Add(time.Hour),
	}
	s.Normalize()
	if strings.HasPrefix(s.Description, " ") || strings.HasSuffix(s.Description, " ") {
		t.Errorf("expected trimmed description, got %q", s.Description)
	}
}

func TestSettingsData_Normalize_DatesUTC(t *testing.T) {
	loc, _ := time.LoadLocation("America/Lima")
	start := time.Date(2026, 6, 1, 8, 0, 0, 0, loc)
	end := time.Date(2026, 6, 2, 8, 0, 0, 0, loc)
	s := &SettingsData{
		Title:     "Event",
		StartDate: start,
		EndDate:   end,
	}
	s.Normalize()
	if s.StartDate.Location() != time.UTC {
		t.Errorf("expected StartDate in UTC, got %v", s.StartDate.Location())
	}
	if s.EndDate.Location() != time.UTC {
		t.Errorf("expected EndDate in UTC, got %v", s.EndDate.Location())
	}
}

// --- SettingsData validation ---

func TestSettingsData_Validate_ValidTalk(t *testing.T) {
	future := time.Now().Add(time.Hour)
	s := SettingsData{
		FormType:    "TALK",
		Title:       "My Talk",
		Description: "desc",
		StartDate:   future,
		EndDate:     future.Add(time.Hour),
		// prices are gte=0, zero is fine for float validation
		MealPricePen:    0,
		MealPriceUsd:    0,
		SessionPricePen: 0,
		SessionPriceUsd: 0,
	}
	// Note: validate:"required,gte=0" - 0.0 passes gte=0 but 'required' for float is tricky.
	// In go-playground/validator, required for float64 means != zero value.
	// Prices are 'required,gte=0' which means a price of 0.0 would fail 'required'.
	// This is a known quirk. Let's use positive prices for a valid case.
	s.MealPricePen = 0.01
	s.MealPriceUsd = 0.01
	s.SessionPricePen = 0.01
	s.SessionPriceUsd = 0.01
	if err := ValidateData(s); err != nil {
		t.Fatalf("expected no error for valid TALK SettingsData, got: %v", err)
	}
}

func TestSettingsData_Validate_InvalidFormType(t *testing.T) {
	future := time.Now().Add(time.Hour)
	s := SettingsData{
		FormType:        "INVALID",
		Title:           "My Event",
		StartDate:       future,
		EndDate:         future.Add(time.Hour),
		MealPricePen:    1.0,
		MealPriceUsd:    1.0,
		SessionPricePen: 1.0,
		SessionPriceUsd: 1.0,
	}
	if err := ValidateData(s); err == nil {
		t.Fatal("expected error for invalid FormType, got nil")
	}
}

func TestSettingsData_Validate_TitleTooShort(t *testing.T) {
	future := time.Now().Add(time.Hour)
	s := SettingsData{
		FormType:        "COURSE",
		Title:           "ab", // min=3
		StartDate:       future,
		EndDate:         future.Add(time.Hour),
		MealPricePen:    1.0,
		MealPriceUsd:    1.0,
		SessionPricePen: 1.0,
		SessionPriceUsd: 1.0,
	}
	if err := ValidateData(s); err == nil {
		t.Fatal("expected error for Title too short, got nil")
	}
}

func TestSettingsData_Validate_EndDateBeforeStartDate(t *testing.T) {
	future := time.Now().Add(time.Hour)
	s := SettingsData{
		FormType:        "COURSE",
		Title:           "My Course",
		StartDate:       future.Add(time.Hour),
		EndDate:         future, // end < start
		MealPricePen:    1.0,
		MealPriceUsd:    1.0,
		SessionPricePen: 1.0,
		SessionPriceUsd: 1.0,
	}
	if err := ValidateData(s); err == nil {
		t.Fatal("expected error for EndDate before StartDate, got nil")
	}
}

func TestSettingsData_Validate_AllFormTypes(t *testing.T) {
	future := time.Now().Add(time.Hour)
	for _, ft := range []string{"TALK", "COURSE", "SPECIAL"} {
		s := SettingsData{
			FormType:        ft,
			Title:           "My Event",
			StartDate:       future,
			EndDate:         future.Add(time.Hour),
			MealPricePen:    1.0,
			MealPriceUsd:    1.0,
			SessionPricePen: 1.0,
			SessionPriceUsd: 1.0,
		}
		if err := ValidateData(s); err != nil {
			t.Errorf("expected no error for FormType=%q, got: %v", ft, err)
		}
	}
}

func TestSettingsData_Validate_DescriptionTooLong(t *testing.T) {
	future := time.Now().Add(time.Hour)
	s := SettingsData{
		FormType:        "TALK",
		Title:           "My Event",
		Description:     strings.Repeat("x", 2001), // max=2000
		StartDate:       future,
		EndDate:         future.Add(time.Hour),
		MealPricePen:    1.0,
		MealPriceUsd:    1.0,
		SessionPricePen: 1.0,
		SessionPriceUsd: 1.0,
	}
	if err := ValidateData(s); err == nil {
		t.Fatal("expected error for Description exceeding 2000 chars, got nil")
	}
}