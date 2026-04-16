package config

import (
	"log/slog"

	"github.com/gofiber/fiber/v2"
)

func GetLogger(c *fiber.Ctx) *slog.Logger {
	return slog.Default().With(
		slog.Group("request",
			slog.String("method", c.Method()),
			slog.String("path", c.Path()),
			slog.String("ip", c.IP()),
			slog.String("agent", c.Get("User-Agent")),
		),
	)
}
