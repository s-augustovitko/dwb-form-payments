package config

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"reflect"
	"time"
)

type (
	Service struct {
		Name        string `json:"name"`
		Environment string `json:"environment"`
		Host        string `json:"host"`
		Port        string `json:"port"`

		AllowOrigins string `json:"allowOrigins"`
		AllowMethods string `json:"allowMethods"`
	}

	Db struct {
		Host string `json:"host"`
		User string `json:"user"`
		Pass string `json:"pass"`
		Name string `json:"name"`
	}

	Timeout struct {
		Read        time.Duration `json:"read"`
		Write       time.Duration `json:"write"`
		Transaction time.Duration `json:"transaction"`
	}
)

func (t Timeout) ReadCtx(c context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), t.Read)
}

func (t Timeout) WriteCtx(c context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), t.Write)
}

func (t Timeout) TransactionCtx(c context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), t.Transaction)
}

type Config struct {
	Service `json:"service"`
	Db      `json:"db"`
	Timeout `json:"timeout"`
}

func Load() (*Config, error) {
	configPath := getEnvString("CONFIG_PATH", "/service/config/service.json")

	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	cfg := &Config{
		Service: Service{
			Name:        getEnvString("SERVICE_NAME", ""),
			Environment: getEnvString("ENVIRONMENT", "prod"),
			Host:        getEnvString("HOST", "0.0.0.0"),
			Port:        getEnvString("PORT", "3000"),

			AllowMethods: getEnvString("ALLOW_METHODS", "GET,POST,PUT,DELETE"),
			AllowOrigins: getEnvString("ALLOW_ORIGINS", ""),
		},
		Db: Db{
			Host: getEnvString("DB_HOST", ""),
			User: getEnvString("DB_USER", ""),
			Pass: getEnvString("DB_PASS", ""),
			Name: getEnvString("DB_NAME", ""),
		},

		Timeout: Timeout{
			Read:        getEnvDuration("TIMEOUT_READ", time.Second*2),
			Write:       getEnvDuration("TIMEOUT_WRITE", time.Second*5),
			Transaction: getEnvDuration("TIMEOUT_TRANSACTION", time.Second*15),
		},
	}

	if err := json.Unmarshal(data, cfg); err != nil {
		return nil, fmt.Errorf("failed to parse JSON config: %w", err)
	}

	return cfg, validateNonZeroFields(cfg)
}

// GetEnvString returns the value of the environment variable or a default if unset.
func getEnvString(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return defaultVal
}

// GetEnvDuration returns the env variable parsed as time.Duration or the default if unset or invalid.
// Format example: "5s", "1h", etc.
func getEnvDuration(key string, defaultVal time.Duration) time.Duration {
	if val, ok := os.LookupEnv(key); ok {
		if parsed, err := time.ParseDuration(val); err == nil {
			return parsed
		}
	}
	return defaultVal
}

// Validates that config does not have empty values
func validateNonZeroFields(cfg *Config) error {
	var missing []string

	if cfg == nil {
		return errors.New("Config should not be empty")
	}

	root := reflect.ValueOf(cfg).Elem()
	typ := root.Type()
	for i := 0; i < root.NumField(); i++ {
		fieldValue := root.Field(i)
		fieldType := typ.Field(i)

		// skip unexported
		if fieldType.PkgPath != "" {
			continue
		}

		missing = checkZeroFields(fieldValue, fieldType.Name, missing)
	}

	if len(missing) > 0 {
		return fmt.Errorf("missing or zero-value config fields: %+v", missing)
	}

	return nil
}

func checkZeroFields(value reflect.Value, path string, missing []string) []string {
	// Resolve pointer values
	for value.Kind() == reflect.Pointer {
		if value.IsNil() {
			return append(missing, path)
		}
		value = value.Elem()
	}

	switch value.Kind() {
	case reflect.String:
		if value.String() == "" {
			missing = append(missing, path)
		}
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		if value.Int() == 0 {
			missing = append(missing, path)
		}
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		if value.Uint() == 0 {
			missing = append(missing, path)
		}
	case reflect.Float32, reflect.Float64:
		if value.Float() == 0 {
			missing = append(missing, path)
		}
	case reflect.Struct:
		t := value.Type()
		for i := 0; i < value.NumField(); i++ {
			typ := t.Field(i)

			// Skip unexported fields
			if typ.PkgPath != "" {
				continue
			}

			childPath := typ.Name
			if path != "" {
				childPath = path + "." + typ.Name
			}

			missing = checkZeroFields(value.Field(i), childPath, missing)
		}
	}

	return missing
}
