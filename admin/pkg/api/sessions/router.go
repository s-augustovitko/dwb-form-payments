package sessions

import (
	"dwb-admin/pkg/api"

	"github.com/gofiber/fiber/v2"
)

type Server struct {
	*api.DefaultServer
}

func Register(app fiber.Router, srv *Server, middlewares ...fiber.Handler) {
	sessions := app.Group("/sessions/:settings_id", middlewares...)

	sessions.Post("/", srv.create)
	sessions.Put("/:id", srv.update)
	sessions.Delete("/:id", srv.delete)
}
