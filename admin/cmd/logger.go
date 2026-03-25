package main

import (
	"dwb-admin/pkg/config"
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
)

var skipPathsLogger = map[string]bool{"/v1/readyz": true, "/v1/livez": true}

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

	isErr := err != nil || statusCode < 200 || statusCode >= 300
	if isErr {
		errMsg := ""
		if err != nil {
			errMsg = err.Error()
		}
		if errMsg == "" {
			errMsg = string(utils.CopyBytes(c.Response().Body()))
		}

		logger.Error("http error",
			slog.String("error", errMsg),
		)
	} else {
		logger.Info("http request")
	}

	return err
}
