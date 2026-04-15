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

	formIDsArr := strings.Split(strings.TrimSpace(IDs), ",")
	for _, item := range formIDsArr {
		if _, err := uuid.Parse(item); err != nil {
			return []string{}, fmt.Errorf("invalid id: %s", item)
		}
	}

	return formIDsArr, nil
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

	statusArr := strings.SplitSeq(strings.TrimSpace(statusStr), ",")
	for item := range statusArr {
		switch item {
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
