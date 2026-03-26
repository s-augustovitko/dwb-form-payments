package settingsservice

import (
	"testing"
)

// --- NormalizePrice ---

func TestNormalizePrice_Zero(t *testing.T) {
	got := NormalizePrice(0)
	if got != "0.00" {
		t.Errorf("expected '0.00', got %q", got)
	}
}

func TestNormalizePrice_PositiveInteger(t *testing.T) {
	got := NormalizePrice(100)
	if got != "100.00" {
		t.Errorf("expected '100.00', got %q", got)
	}
}

func TestNormalizePrice_OneDecimalPlace(t *testing.T) {
	got := NormalizePrice(9.5)
	if got != "9.50" {
		t.Errorf("expected '9.50', got %q", got)
	}
}

func TestNormalizePrice_TwoDecimalPlaces(t *testing.T) {
	got := NormalizePrice(19.99)
	if got != "19.99" {
		t.Errorf("expected '19.99', got %q", got)
	}
}

func TestNormalizePrice_TruncatesMoreThanTwoDecimals(t *testing.T) {
	// FormatFloat with 'f' and precision 2 rounds at third decimal
	got := NormalizePrice(1.005)
	// Floating-point: 1.005 may round to "1.00" or "1.01" depending on representation
	if len(got) == 0 {
		t.Error("expected non-empty string")
	}
	// Should always be exactly 2 decimal places
	dotIdx := -1
	for i, c := range got {
		if c == '.' {
			dotIdx = i
			break
		}
	}
	if dotIdx == -1 {
		t.Errorf("expected decimal point in output, got %q", got)
	}
	decimals := len(got) - dotIdx - 1
	if decimals != 2 {
		t.Errorf("expected exactly 2 decimal places, got %d in %q", decimals, got)
	}
}

func TestNormalizePrice_LargeValue(t *testing.T) {
	got := NormalizePrice(1234567.89)
	if got != "1234567.89" {
		t.Errorf("expected '1234567.89', got %q", got)
	}
}

func TestNormalizePrice_NegativeValue(t *testing.T) {
	got := NormalizePrice(-5.5)
	if got != "-5.50" {
		t.Errorf("expected '-5.50', got %q", got)
	}
}

func TestNormalizePrice_SmallFraction(t *testing.T) {
	got := NormalizePrice(0.01)
	if got != "0.01" {
		t.Errorf("expected '0.01', got %q", got)
	}
}