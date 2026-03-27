package main

import (
	"database/sql"
	"dwb-admin/pkg/api"
	"dwb-admin/pkg/api/formresponses"
	"dwb-admin/pkg/api/meals"
	"dwb-admin/pkg/api/sessions"
	"dwb-admin/pkg/api/settings"
	"dwb-admin/pkg/config"
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
	settings.Register(api, &settings.Server{DefaultServer: srv})
	meals.Register(api, &meals.Server{DefaultServer: srv})
	sessions.Register(api, &sessions.Server{DefaultServer: srv})
	formresponses.Register(api, &formresponses.Server{DefaultServer: srv})
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
