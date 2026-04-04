package main

import (
	"database/sql"
	"dwb-admin/internal/api"
	"dwb-admin/internal/api/forms"
	"dwb-admin/internal/config"
	"log/slog"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/healthcheck"
)

func router(api fiber.Router, srv *api.DefaultServer) {
	// Setup for healthchecks
	api.Use(healthcheck.New(healthcheck.Config{
		ReadinessProbe: isServiceReady(srv),
	}))

	// Register routes
	forms.Register(api, &forms.Server{DefaultServer: srv})
}

func isServiceReady(srv *api.DefaultServer) healthcheck.HealthChecker {
	return func(c *fiber.Ctx) bool {
		db, ok := srv.DB.(*sql.DB)
		if !ok {
			return false
		}

		if err := db.Ping(); err != nil {
			config.GetLogger(c).Error("could not connect to the database", slog.String("error", err.Error()))
			return false
		}

		return srv.Cfg != nil
	}
}
