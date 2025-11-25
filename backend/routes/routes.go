package routes

import (
	"nodeVault/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine, fh *handlers.FileHandler) {
	r.GET("/health", fh.Health)
	r.POST("/upload", fh.Upload)
	r.GET("/download/:id", fh.Download)
}
