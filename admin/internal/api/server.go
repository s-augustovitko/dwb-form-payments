package api

import (
	"database/sql"
	"dwb-admin/internal/config"
	"log/slog"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
)

type DefaultServer struct {
	Cfg *config.Config
	DB  *sql.DB
}

func (s DefaultServer) Ready(c *fiber.Ctx) bool {
	logger := config.GetLogger(c)
	if s.Cfg == nil || s.DB == nil {
		logger.Error("server dependencies are not initialized")
		return false
	}

	ctx, cancel := s.Cfg.ReadCtx(c.Context())
	defer cancel()

	if err := s.DB.PingContext(ctx); err != nil {
		logger.Error("could not connect to the database", slog.String("error", err.Error()))
		return false
	}

	return true
}

type Paging struct {
	Limit int32
	Skip  int32
}

type PagingResponse[T any] struct {
	Items []T   `json:"items"`
	Total int64 `json:"total"`
}

func GetPaging(c *fiber.Ctx) Paging {
	skip, err := strconv.Atoi(utils.CopyString(c.Query("skip", "0")))
	if err != nil {
		skip = 0
	}

	limit, err := strconv.Atoi(utils.CopyString(c.Query("limit", "100")))
	if err != nil {
		limit = 100
	}

	return Paging{
		Limit: int32(limit),
		Skip:  int32(skip),
	}
}
