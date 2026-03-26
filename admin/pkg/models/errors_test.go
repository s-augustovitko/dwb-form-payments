package models

import (
	"strings"
	"testing"
)

// --- ErrorResponse.Error() ---

func TestErrorResponse_Error(t *testing.T) {
	e := ErrorResponse{
		Field: "Title",
		Tag:   "required",
		Value: "",
	}
	got := e.Error()
	if !strings.Contains(got, "Title") {
		t.Errorf("expected 'Title' in error message, got: %q", got)
	}
	if !strings.Contains(got, "required") {
		t.Errorf("expected 'required' in error message, got: %q", got)
	}
}

// --- ErrorResponses.Error() ---

func TestErrorResponses_Error_MultipleErrors(t *testing.T) {
	errs := ErrorResponses{
		{Field: "Title", Tag: "required", Value: ""},
		{Field: "FormType", Tag: "oneof", Value: "BAD"},
	}
	got := errs.Error()
	if !strings.Contains(got, "Title") {
		t.Errorf("expected 'Title' in error string, got: %q", got)
	}
	if !strings.Contains(got, "FormType") {
		t.Errorf("expected 'FormType' in error string, got: %q", got)
	}
}

func TestErrorResponses_Error_Empty(t *testing.T) {
	errs := ErrorResponses{}
	got := errs.Error()
	if got != "" {
		t.Errorf("expected empty string for empty ErrorResponses, got: %q", got)
	}
}

// --- ValidateData ---

func TestValidateData_Nil(t *testing.T) {
	err := ValidateData(nil)
	if err == nil {
		t.Fatal("expected error for nil input, got nil")
	}
	if !strings.Contains(err.Error(), "nil") {
		t.Errorf("expected 'nil' mention in error, got: %q", err.Error())
	}
}

func TestValidateData_ValidStruct(t *testing.T) {
	type sample struct {
		Name string `validate:"required"`
	}
	err := ValidateData(sample{Name: "hello"})
	if err != nil {
		t.Fatalf("expected no error for valid struct, got: %v", err)
	}
}

func TestValidateData_MissingRequired(t *testing.T) {
	type sample struct {
		Name string `validate:"required"`
	}
	err := ValidateData(sample{Name: ""})
	if err == nil {
		t.Fatal("expected validation error for missing required field, got nil")
	}
	errs, ok := err.(ErrorResponses)
	if !ok {
		t.Fatalf("expected ErrorResponses type, got %T", err)
	}
	if len(errs) == 0 {
		t.Fatal("expected at least one validation error")
	}
	if errs[0].Field != "Name" {
		t.Errorf("expected field 'Name', got %q", errs[0].Field)
	}
	if errs[0].Tag != "required" {
		t.Errorf("expected tag 'required', got %q", errs[0].Tag)
	}
}

func TestValidateData_MultipleValidationErrors(t *testing.T) {
	type sample struct {
		Name  string `validate:"required"`
		Email string `validate:"required,email"`
	}
	err := ValidateData(sample{Name: "", Email: "bad-email"})
	if err == nil {
		t.Fatal("expected validation errors, got nil")
	}
	errs, ok := err.(ErrorResponses)
	if !ok {
		t.Fatalf("expected ErrorResponses type, got %T", err)
	}
	if len(errs) < 2 {
		t.Fatalf("expected at least 2 validation errors, got %d", len(errs))
	}
}

func TestValidateData_OneofConstraint(t *testing.T) {
	type sample struct {
		Type string `validate:"required,oneof=A B C"`
	}
	err := ValidateData(sample{Type: "D"})
	if err == nil {
		t.Fatal("expected error for invalid oneof value, got nil")
	}
	errs, ok := err.(ErrorResponses)
	if !ok {
		t.Fatalf("expected ErrorResponses type, got %T", err)
	}
	if errs[0].Tag != "oneof" {
		t.Errorf("expected tag 'oneof', got %q", errs[0].Tag)
	}
}

func TestValidateData_NonStructValue(t *testing.T) {
	// validator.Struct on a non-struct should return a non-nil error (invalid input)
	err := ValidateData("not-a-struct")
	if err == nil {
		t.Fatal("expected error for non-struct value, got nil")
	}
}