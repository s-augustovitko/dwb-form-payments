package main

import (
	"dwb-admin/internal/api"
	"dwb-admin/internal/api/addons"
	"dwb-admin/internal/api/dashboard"
	"dwb-admin/internal/api/forms"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/healthcheck"
)

func router(api fiber.Router, srv *api.DefaultServer) {
	// Setup for healthchecks
	api.Use(healthcheck.New(healthcheck.Config{
		ReadinessProbe: srv.Ready,
	}))

	// Register routes
	forms.Register(api, srv)
	addons.Register(api, srv)
	dashboard.Register(api, srv)
}
