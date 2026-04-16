package models

import (
	"github.com/gofiber/fiber/v2"
)

type Response[T any] struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    T      `json:"data,omitempty"`
}

func NewResponse[T any](success bool, message string, data T) Response[T] {
	return Response[T]{
		Success: success,
		Message: message,
		Data:    data,
	}
}

func Success[T any](c *fiber.Ctx, data T) error {
	return c.JSON(NewResponse(true, "Success", data))
}

type AppError struct {
	Code    int
	Message string
	Err     error
}

func (e AppError) Error() string {
	return e.Message
}

func Error(code int, message string, err error) error {
	return AppError{Code: code, Message: message, Err: err}
}
