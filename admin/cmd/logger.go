package main

import (
	"dwb-admin/internal/config"
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v2"
)

var skipPathsLogger = map[string]bool{"/api/v1/readyz": true, "/api/v1/livez": true}

func slogLogger(c *fiber.Ctx) error {
	if skipPathsLogger[c.Path()] {
		return c.Next()
	}

	start := time.Now()
	err := c.Next()
	latency := time.Since(start)
	statusCode := c.Response().StatusCode()

	logger := config.GetLogger(c).With(
		slog.Int("status", statusCode),
		slog.Duration("latency", latency),
	)

	if err != nil {
		logger.Error("http error", slog.String("error", err.Error()))
		return err
	}

	if statusCode < 200 || statusCode >= 400 {
		logger.Error("http error")
		return nil
	}

	logger.Info("http request")

	return err
}
