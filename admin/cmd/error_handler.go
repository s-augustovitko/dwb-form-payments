package main

import (
	"dwb-admin/internal/config"
	"dwb-admin/internal/models"
	"log/slog"

	"github.com/gofiber/fiber/v2"
)

func globalErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Unexpected Error"
	logger := config.GetLogger(c)

	if e, ok := err.(models.AppError); ok {
		code = e.Code
		message = e.Message

		if e.Err != nil {
			logger.Error("request_error",
				slog.Int("status", code),
				slog.String("error", e.Err.Error()),
				slog.String("user_message", e.Message),
			)
		}
	} else {
		logger.Error("unhandled_error", slog.String("error", err.Error()))
	}

	return c.Status(code).JSON(models.NewResponse[any](false, message, nil))
}
