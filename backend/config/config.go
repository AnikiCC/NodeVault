package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	MaxFileSize     int64
	CleanupInterval time.Duration
	StorageDir      string
}

func Default() *Config {
	// Получаем настройки из переменных окружения или используем значения по умолчанию
	maxFileSize := getEnvAsInt("NODEVAULT_MAX_FILE_SIZE", 500*1024*1024) // 500 MB
	storageDir := getEnv("NODEVAULT_STORAGE_DIR", "./data")

	return &Config{
		MaxFileSize:     int64(maxFileSize),
		CleanupInterval: time.Hour,
		StorageDir:      storageDir,
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
