package formresponses

import (
	"database/sql"
	"testing"
	"time"
)

// --- strOrDefault ---

func TestStrOrDefault_EmptyVal_ReturnsDefault(t *testing.T) {
	got := strOrDefault("", "fallback")
	if got != "fallback" {
		t.Errorf("expected 'fallback', got %q", got)
	}
}

func TestStrOrDefault_NonEmptyVal_ReturnsVal(t *testing.T) {
	got := strOrDefault("hello", "fallback")
	if got != "hello" {
		t.Errorf("expected 'hello', got %q", got)
	}
}

func TestStrOrDefault_BothEmpty(t *testing.T) {
	got := strOrDefault("", "")
	if got != "" {
		t.Errorf("expected empty string when both val and def are empty, got %q", got)
	}
}

func TestStrOrDefault_ValIsSpaces(t *testing.T) {
	// spaces are not empty, so should return val (spaces)
	got := strOrDefault("   ", "fallback")
	if got != "   " {
		t.Errorf("expected spaces to be returned as-is, got %q", got)
	}
}

func TestStrOrDefault_DefaultIsNotUsedWhenValPresent(t *testing.T) {
	got := strOrDefault("actual", "default")
	if got == "default" {
		t.Error("expected 'actual', but got default value")
	}
}

// --- nullTimeHandle ---

func TestNullTimeHandle_InvalidTime_ReturnsEmpty(t *testing.T) {
	val := sql.NullTime{Valid: false}
	got := nullTimeHandle(val)
	if got != "" {
		t.Errorf("expected empty string for invalid NullTime, got %q", got)
	}
}

func TestNullTimeHandle_ValidTime_ReturnsFormatted(t *testing.T) {
	// Date: 15 March 2025
	loc := time.UTC
	ts := time.Date(2025, time.March, 15, 10, 30, 0, 0, loc)
	val := sql.NullTime{Valid: true, Time: ts}
	got := nullTimeHandle(val)
	// Format: "02/01/2006" => day/month/year
	expected := "15/03/2025"
	if got != expected {
		t.Errorf("expected %q, got %q", expected, got)
	}
}

func TestNullTimeHandle_ValidTime_DifferentDate(t *testing.T) {
	ts := time.Date(2000, time.January, 1, 0, 0, 0, 0, time.UTC)
	val := sql.NullTime{Valid: true, Time: ts}
	got := nullTimeHandle(val)
	expected := "01/01/2000"
	if got != expected {
		t.Errorf("expected %q, got %q", expected, got)
	}
}

func TestNullTimeHandle_ValidTime_EndOfYear(t *testing.T) {
	ts := time.Date(2024, time.December, 31, 23, 59, 59, 0, time.UTC)
	val := sql.NullTime{Valid: true, Time: ts}
	got := nullTimeHandle(val)
	expected := "31/12/2024"
	if got != expected {
		t.Errorf("expected %q, got %q", expected, got)
	}
}

func TestNullTimeHandle_ValidTime_FormatIsDateOnly(t *testing.T) {
	// Verify time component is not included in output
	ts := time.Date(2025, time.June, 5, 15, 45, 30, 0, time.UTC)
	val := sql.NullTime{Valid: true, Time: ts}
	got := nullTimeHandle(val)
	// Should not contain time component
	if len(got) != 10 {
		t.Errorf("expected 10-char date string (DD/MM/YYYY), got %q (len=%d)", got, len(got))
	}
}