package main

import (
	"context"
	"nodeVault/config"
	"nodeVault/handlers"
	"nodeVault/p2p"
	"nodeVault/routes"
	"nodeVault/storage"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	ctx := context.Background()
	cfg := config.Default()

	// Создаем хранилище
	store := storage.NewFileStorage(cfg.StorageDir)
	defer store.Close()

	// Запускаем очистку просроченных файлов
	go func() {
		ticker := time.NewTicker(cfg.CleanupInterval)
		defer ticker.Stop()

		for range ticker.C {
			store.CleanupExpired()
		}
	}()

	// Создаем P2P узел
	node, err := p2p.NewNode(ctx, store)
	if err != nil {
		os.Exit(1)
	}
	defer node.Close()

	fileHandler := handlers.NewFileHandler(store, node, cfg)

	// Настройка Gin
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Устанавливаем лимит размера файла из конфига
	r.MaxMultipartMemory = cfg.MaxFileSize

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, Accept, Origin, Cache-Control, X-Requested-With")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	routes.SetupRoutes(r, fileHandler)

	// Graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		node.Close()
		store.Close()
		os.Exit(0)
	}()

	// Получаем порт из переменных окружения
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r.Run(":" + port)
}
