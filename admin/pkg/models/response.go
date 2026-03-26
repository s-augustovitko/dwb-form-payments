package models

import (
	"dwb-admin/pkg/config"
	"log/slog"

	"github.com/gofiber/fiber/v2"
)

type Response[T any] struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    T      `json:"data"`
}

func ErrorBadData(c *fiber.Ctx, err error) error {
	if err != nil {
		config.GetLogger(c).Error("bad data error", slog.String("error", err.Error()))
	}

	return c.Status(fiber.ErrBadRequest.Code).JSON(Response[any]{Success: false, Message: "Invalid Payload"})
}

func ErrorUnexpected(c *fiber.Ctx, err error) error {
	if err != nil {
		config.GetLogger(c).Error("unexpected error", slog.String("error", err.Error()))
	}

	return c.Status(fiber.ErrInternalServerError.Code).JSON(Response[any]{Success: false, Message: "Unexpected Error"})
}

func Success[T any](c *fiber.Ctx, data T) error {
	return c.JSON(Response[T]{Success: true, Message: "Success", Data: data})
}
