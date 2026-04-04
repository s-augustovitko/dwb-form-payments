package models

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

type ErrorResponses []ErrorResponse

func (e ErrorResponses) Error() string {
	out := strings.Builder{}

	for _, item := range e {
		out.WriteString(item.Error())
		out.WriteString("\n")
	}

	return out.String()
}

type ErrorResponse struct {
	Field string
	Tag   string
	Value any
}

func (e ErrorResponse) Error() string {
	return fmt.Sprintf("field [%s: %+v] failed validation for: %s", e.Field, e.Value, e.Tag)
}

// ValidateData validates the provided data struct using predefined validation rules.
// Returns nil if validation passes, or an aggregated error containing details for each failed validation.
// Returns an error if the input data is nil or if validation should not be performed.
func ValidateData(data any) error {
	if data == nil {
		return fmt.Errorf("validation data should not be nil")
	}

	errs := validate.Struct(data)
	if errs == nil {
		return nil
	}

	validErrs, ok := errs.(validator.ValidationErrors)
	if !ok {
		return errs
	}

	validationErrors := make(ErrorResponses, 0, len(validErrs))
	for _, err := range validErrs {
		var elem ErrorResponse

		elem.Field = err.Field()
		elem.Tag = err.Tag()
		elem.Value = err.Value()

		validationErrors = append(validationErrors, elem)
	}

	return validationErrors
}
