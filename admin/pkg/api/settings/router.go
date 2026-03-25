package settings

import (
	"dwb-admin/pkg/api"

	"github.com/gofiber/fiber/v2"
)

type Server struct {
	*api.DefaultServer
}

func Register(app fiber.Router, srv *Server, middlewares ...fiber.Handler) {
	settings := app.Group("/settings", middlewares...)

	settings.Get("/", srv.list)
	settings.Get("/:id", srv.getByID)

	settings.Post("/", srv.create)
	settings.Put("/:id", srv.update)
	settings.Delete("/:id", srv.delete)
	settings.Put("/:id/active", srv.updateActiveSettings)
}
