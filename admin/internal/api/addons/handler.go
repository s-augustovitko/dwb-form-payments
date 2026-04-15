package addons

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
	addons := app.Group("/addons", middlewares...)

	h := handler{
		svc: newService(srv.DB),
		cfg: srv.Cfg,
	}

	addons.Post("/", h.UpsertAddon)
	addons.Put("/:id/active", h.UpdateAddonStatus)
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
