package forms

import (
	"database/sql"
	"dwb-admin/internal/api"
	"dwb-admin/internal/config"
	"dwb-admin/internal/database"

	"github.com/gofiber/fiber/v2"
)

// Controller
type handler struct {
	svc *service
	cfg *config.Config
}

func Register(app fiber.Router, srv *api.DefaultServer, middlewares ...fiber.Handler) {
	forms := app.Group("/forms", middlewares...)

	h := handler{
		svc: newService(srv.DB),
		cfg: srv.Cfg,
	}

	forms.Get("/", h.ListForms)
	forms.Get("/export", h.Export)
	forms.Get("/:id", h.GetPopulatedByID)

	forms.Post("/", h.CreateFormWithAddons)

	forms.Put("/:id", h.UpdateForm)
	forms.Put("/:id/active", h.UpdateFormStatus)
}

// Business logic
type service struct {
	repo *repository
	db   *sql.DB
}

func newService(db *sql.DB) *service {
	return &service{
		repo: newRepository(db),
		db:   db,
	}
}

// Database Layer
type repository struct {
	db database.DBTX
	q  *database.Queries
}

func newRepository(db database.DBTX) *repository {
	return &repository{
		q:  database.New(db),
		db: db,
	}
}

func (r repository) WithTx(tx *sql.Tx) *repository {
	return &repository{
		q:  database.New(tx),
		db: tx,
	}
}
