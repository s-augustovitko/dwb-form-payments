package api

import (
	"dwb-admin/internal/config"
	"dwb-admin/internal/database"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
)

type DefaultServer struct {
	Cfg *config.Config
	DB  database.DBTX
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
