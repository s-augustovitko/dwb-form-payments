package main

import (
	"dwb-admin/internal/config"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func setupMiddlewares(app *fiber.App, cfg *config.Config) {
	// CORS
	app.Use(cors.New(cors.Config{
		AllowMethods:     cfg.Service.AllowMethods,
		AllowOrigins:     cfg.Service.AllowOrigins,
		AllowHeaders:     "Content-Type,Authorization",
		AllowCredentials: true,
	}))

	// Logging, Helmet, Compression, Recovery
	app.Use(
		slogLogger,
		recover.New(),
		helmet.New(),
		compress.New(compress.Config{
			Level: compress.LevelBestSpeed,
		}),
	)

	// Global rate limit
	// 100 RPM
	app.Use(limiter.New(limiter.Config{
		Max:        100,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return cfg.Service.Name + ":global_limit:" + c.IP()
		},
	}))
}
