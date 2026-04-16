package models

import (
	"dwb-admin/internal/database"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

func NormalizeString(val string) string {
	return strings.Join(strings.Fields(strings.TrimSpace(val)), " ")
}

func GetIDsArray(IDs string) ([]string, error) {
	if IDs == "" {
		return []string{}, errors.New("ids is empty")
	}

	out := []string{}
	for item := range strings.SplitSeq(IDs, ",") {
		trimmed := strings.TrimSpace(item)
		if _, err := uuid.Parse(trimmed); err != nil {
			return []string{}, fmt.Errorf("invalid id: %s", item)
		}

		out = append(out, trimmed)
	}

	return out, nil
}

func GetStatusFromCommaSep(statusStr string) []database.OrdersStatus {
	def := []database.OrdersStatus{
		database.OrdersStatusDRAFT,
		database.OrdersStatusCANCELLED,
		database.OrdersStatusCONFIRMED,
		database.OrdersStatusONSITE,
	}
	out := []database.OrdersStatus{}

	if statusStr == "" {
		return def
	}

	statusArr := strings.SplitSeq(statusStr, ",")
	for item := range statusArr {
		switch strings.TrimSpace(item) {
		case string(database.OrdersStatusDRAFT):
			out = append(out, database.OrdersStatusDRAFT)
		case string(database.OrdersStatusCANCELLED):
			out = append(out, database.OrdersStatusCANCELLED)
		case string(database.OrdersStatusCONFIRMED):
			out = append(out, database.OrdersStatusCONFIRMED)
		case string(database.OrdersStatusONSITE):
			out = append(out, database.OrdersStatusONSITE)
		}
	}

	if len(out) == 0 {
		return def
	}

	return out
}
