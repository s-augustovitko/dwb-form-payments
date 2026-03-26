package config

import (
	"os"
	"reflect"
	"testing"
	"time"
)

// --- validateNonZeroFields ---

func TestValidateNonZeroFields_NilConfig(t *testing.T) {
	err := validateNonZeroFields(nil)
	if err == nil {
		t.Fatal("expected error for nil config, got nil")
	}
}

func TestValidateNonZeroFields_ValidConfig(t *testing.T) {
	cfg := &Config{
		Service: Service{
			Name:         "test-service",
			Environment:  "test",
			Host:         "0.0.0.0",
			Port:         "3000",
			AllowOrigins: "http://localhost",
			AllowMethods: "GET,POST",
		},
		Db: Db{
			Host: "localhost",
			User: "user",
			Pass: "pass",
			Name: "dbname",
		},
		Timeout: Timeout{
			Read:        time.Second * 2,
			Write:       time.Second * 5,
			Transaction: time.Second * 15,
		},
	}

	if err := validateNonZeroFields(cfg); err != nil {
		t.Fatalf("expected no error for valid config, got: %v", err)
	}
}

func TestValidateNonZeroFields_MissingServiceName(t *testing.T) {
	cfg := &Config{
		Service: Service{
			Name:         "", // missing
			Environment:  "test",
			Host:         "0.0.0.0",
			Port:         "3000",
			AllowOrigins: "http://localhost",
			AllowMethods: "GET,POST",
		},
		Db: Db{
			Host: "localhost",
			User: "user",
			Pass: "pass",
			Name: "dbname",
		},
		Timeout: Timeout{
			Read:        time.Second * 2,
			Write:       time.Second * 5,
			Transaction: time.Second * 15,
		},
	}

	err := validateNonZeroFields(cfg)
	if err == nil {
		t.Fatal("expected error for missing Service.Name, got nil")
	}
}

func TestValidateNonZeroFields_MissingDbHost(t *testing.T) {
	cfg := &Config{
		Service: Service{
			Name:         "test-service",
			Environment:  "test",
			Host:         "0.0.0.0",
			Port:         "3000",
			AllowOrigins: "http://localhost",
			AllowMethods: "GET,POST",
		},
		Db: Db{
			Host: "", // missing
			User: "user",
			Pass: "pass",
			Name: "dbname",
		},
		Timeout: Timeout{
			Read:        time.Second * 2,
			Write:       time.Second * 5,
			Transaction: time.Second * 15,
		},
	}

	err := validateNonZeroFields(cfg)
	if err == nil {
		t.Fatal("expected error for missing Db.Host, got nil")
	}
}

func TestValidateNonZeroFields_ZeroTimeout(t *testing.T) {
	cfg := &Config{
		Service: Service{
			Name:         "test-service",
			Environment:  "test",
			Host:         "0.0.0.0",
			Port:         "3000",
			AllowOrigins: "http://localhost",
			AllowMethods: "GET,POST",
		},
		Db: Db{
			Host: "localhost",
			User: "user",
			Pass: "pass",
			Name: "dbname",
		},
		Timeout: Timeout{
			Read:        0, // zero duration
			Write:       time.Second * 5,
			Transaction: time.Second * 15,
		},
	}

	err := validateNonZeroFields(cfg)
	if err == nil {
		t.Fatal("expected error for zero Timeout.Read, got nil")
	}
}

// --- checkZeroFields ---

func TestCheckZeroFields_String(t *testing.T) {
	t.Run("empty string is missing", func(t *testing.T) {
		val := reflect.ValueOf("")
		result := checkZeroFields(val, "Field", nil)
		if len(result) == 0 {
			t.Fatal("expected field to be reported as missing for empty string")
		}
		if result[0] != "Field" {
			t.Fatalf("expected 'Field', got %q", result[0])
		}
	})

	t.Run("non-empty string is ok", func(t *testing.T) {
		val := reflect.ValueOf("hello")
		result := checkZeroFields(val, "Field", nil)
		if len(result) != 0 {
			t.Fatalf("expected no missing fields, got: %v", result)
		}
	})
}

func TestCheckZeroFields_Int(t *testing.T) {
	t.Run("zero int is missing", func(t *testing.T) {
		val := reflect.ValueOf(int64(0))
		result := checkZeroFields(val, "IntField", nil)
		if len(result) == 0 {
			t.Fatal("expected zero int64 to be reported missing")
		}
	})

	t.Run("non-zero int is ok", func(t *testing.T) {
		val := reflect.ValueOf(int64(42))
		result := checkZeroFields(val, "IntField", nil)
		if len(result) != 0 {
			t.Fatalf("expected no missing fields, got: %v", result)
		}
	})
}

func TestCheckZeroFields_Struct(t *testing.T) {
	type Inner struct {
		Name string
		Port string
	}
	inner := Inner{Name: "", Port: "3000"}
	val := reflect.ValueOf(inner)
	result := checkZeroFields(val, "Inner", nil)
	if len(result) == 0 {
		t.Fatal("expected Inner.Name to be reported missing")
	}
	found := false
	for _, m := range result {
		if m == "Inner.Name" {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected 'Inner.Name' in missing fields, got: %v", result)
	}
}

// --- Timeout context methods ---

func TestTimeout_ReadCtx(t *testing.T) {
	to := Timeout{Read: 500 * time.Millisecond}
	ctx, cancel := to.ReadCtx()
	defer cancel()
	if ctx == nil {
		t.Fatal("ReadCtx returned nil context")
	}
	deadline, ok := ctx.Deadline()
	if !ok {
		t.Fatal("ReadCtx context has no deadline")
	}
	if deadline.IsZero() {
		t.Fatal("ReadCtx context deadline is zero")
	}
}

func TestTimeout_WriteCtx(t *testing.T) {
	to := Timeout{Write: 500 * time.Millisecond}
	ctx, cancel := to.WriteCtx()
	defer cancel()
	if ctx == nil {
		t.Fatal("WriteCtx returned nil context")
	}
	_, ok := ctx.Deadline()
	if !ok {
		t.Fatal("WriteCtx context has no deadline")
	}
}

func TestTimeout_TransactionCtx(t *testing.T) {
	to := Timeout{Transaction: 500 * time.Millisecond}
	ctx, cancel := to.TransactionCtx()
	defer cancel()
	if ctx == nil {
		t.Fatal("TransactionCtx returned nil context")
	}
	_, ok := ctx.Deadline()
	if !ok {
		t.Fatal("TransactionCtx context has no deadline")
	}
}

// --- getEnvString ---

func TestGetEnvString_UsesEnvVar(t *testing.T) {
	t.Setenv("TEST_KEY_STRING", "envvalue")
	got := getEnvString("TEST_KEY_STRING", "default")
	if got != "envvalue" {
		t.Fatalf("expected 'envvalue', got %q", got)
	}
}

func TestGetEnvString_UsesDefault(t *testing.T) {
	os.Unsetenv("TEST_KEY_STRING_MISSING")
	got := getEnvString("TEST_KEY_STRING_MISSING", "fallback")
	if got != "fallback" {
		t.Fatalf("expected 'fallback', got %q", got)
	}
}

// --- getEnvDuration ---

func TestGetEnvDuration_ValidDuration(t *testing.T) {
	t.Setenv("TEST_TIMEOUT_DUR", "3s")
	got := getEnvDuration("TEST_TIMEOUT_DUR", time.Second)
	if got != 3*time.Second {
		t.Fatalf("expected 3s, got %v", got)
	}
}

func TestGetEnvDuration_InvalidDuration_FallsBackToDefault(t *testing.T) {
	t.Setenv("TEST_TIMEOUT_INVALID", "not-a-duration")
	got := getEnvDuration("TEST_TIMEOUT_INVALID", 7*time.Second)
	if got != 7*time.Second {
		t.Fatalf("expected 7s fallback, got %v", got)
	}
}

func TestGetEnvDuration_MissingEnv_FallsBackToDefault(t *testing.T) {
	os.Unsetenv("TEST_TIMEOUT_MISSING")
	got := getEnvDuration("TEST_TIMEOUT_MISSING", 10*time.Second)
	if got != 10*time.Second {
		t.Fatalf("expected 10s fallback, got %v", got)
	}
}

// --- Load ---

func TestLoad_InvalidConfigPath(t *testing.T) {
	t.Setenv("CONFIG_PATH", "/nonexistent/path/service.json")
	_, err := Load()
	if err == nil {
		t.Fatal("expected error when config file does not exist, got nil")
	}
}

func TestLoad_InvalidJSON(t *testing.T) {
	f, err := os.CreateTemp("", "config-*.json")
	if err != nil {
		t.Fatal(err)
	}
	defer os.Remove(f.Name())
	f.WriteString("not-json{{{")
	f.Close()

	t.Setenv("CONFIG_PATH", f.Name())
	_, err = Load()
	if err == nil {
		t.Fatal("expected error for invalid JSON config, got nil")
	}
}

func TestLoad_ValidMinimalConfig(t *testing.T) {
	f, err := os.CreateTemp("", "config-*.json")
	if err != nil {
		t.Fatal(err)
	}
	defer os.Remove(f.Name())

	// Write a minimal valid JSON that overrides AllowOrigins from env
	f.WriteString(`{"service":{"allowOrigins":"http://localhost"}}`)
	f.Close()

	t.Setenv("CONFIG_PATH", f.Name())
	t.Setenv("SERVICE_NAME", "test-svc")
	t.Setenv("ENVIRONMENT", "test")
	t.Setenv("HOST", "127.0.0.1")
	t.Setenv("PORT", "8080")
	t.Setenv("ALLOW_METODS", "GET,POST")
	t.Setenv("DB_HOST", "db-host")
	t.Setenv("DB_USER", "db-user")
	t.Setenv("DB_PASS", "db-pass")
	t.Setenv("DB_NAME", "db-name")
	t.Setenv("TIMEOUT_READ", "2s")
	t.Setenv("TIMEOUT_WRITE", "5s")
	t.Setenv("TIMEOUT_TRANSACTION", "15s")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if cfg.Service.Name != "test-svc" {
		t.Fatalf("expected service name 'test-svc', got %q", cfg.Service.Name)
	}
	if cfg.Db.Host != "db-host" {
		t.Fatalf("expected db host 'db-host', got %q", cfg.Db.Host)
	}
	if cfg.Timeout.Read != 2*time.Second {
		t.Fatalf("expected 2s read timeout, got %v", cfg.Timeout.Read)
	}
}