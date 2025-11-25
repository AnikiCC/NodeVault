package p2p

import (
	"context"
	"nodeVault/models"

	"github.com/ipfs/go-cid"
	"github.com/libp2p/go-libp2p/core/peer"
)

// NodeInterface определяет контракт для P2P узла
type NodeInterface interface {
	// Provide анонсирует, что этот узел хранит указанный CID
	Provide(ctx context.Context, c cid.Cid) error

	// FindProviders возвращает пиров, которые предоставляют CID
	FindProviders(ctx context.Context, c cid.Cid) ([]peer.AddrInfo, error)

	// FetchFromNetwork пытается получить файл из сети
	FetchFromNetwork(ctx context.Context, cidStr string, maxSize int64) ([]byte, *models.FileMeta, error)

	// GetPeerID возвращает ID пира
	GetPeerID() string

	// GetAddresses возвращает адреса узла
	GetAddresses() []string

	// GetConnectionCount возвращает количество активных соединений
	GetConnectionCount() int

	// GetStreamCount возвращает количество активных стримов
	GetStreamCount() int

	// Close закрывает P2P узел
	Close() error
}
