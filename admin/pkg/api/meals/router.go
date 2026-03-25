package meals

import (
	"dwb-admin/pkg/api"

	"github.com/gofiber/fiber/v2"
)

type Server struct {
	*api.DefaultServer
}

func Register(app fiber.Router, srv *Server, middlewares ...fiber.Handler) {
	meals := app.Group("/meals/:settings_id", middlewares...)

	meals.Post("/", srv.create)
	meals.Put("/:id", srv.update)
	meals.Delete("/:id", srv.delete)
}
