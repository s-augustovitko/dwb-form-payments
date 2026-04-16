package models

import (
	"fmt"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

var validate = validator.New()

// Return an AppError
func ValidateData(data any) error {
	if data == nil {
		return Error(fiber.StatusBadRequest, "Empty data", nil)
	}

	errs := validate.Struct(data)
	if errs == nil {
		return nil
	}

	validErrs, ok := errs.(validator.ValidationErrors)
	if !ok {
		return Error(fiber.StatusBadRequest, "Invalid payload", errs)
	}

	if len(validErrs) > 0 && validErrs[0] != nil {
		e := validErrs[0]
		return Error(
			fiber.StatusBadRequest,
			fmt.Sprintf("field [%s: %+v] failed validation for: %s", e.Field(), e.Value(), e.Tag()),
			validErrs,
		)
	}

	return nil
}
