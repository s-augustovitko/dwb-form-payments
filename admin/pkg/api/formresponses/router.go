package formresponses

import (
	"dwb-admin/pkg/api"

	"github.com/gofiber/fiber/v2"
)

type Server struct {
	*api.DefaultServer
}

func Register(app fiber.Router, srv *Server, middlewares ...fiber.Handler) {
	formResponses := app.Group("/form_responses/:settings_id", middlewares...)

	formResponses.Get("", srv.list)
	formResponses.Get("/export", srv.export)
}
