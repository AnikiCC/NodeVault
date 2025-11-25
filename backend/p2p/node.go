package p2p

import (
	"bufio"
	"bytes"
	"context"
	"encoding/binary"
	"fmt"
	"io"
	"strings"
	"sync/atomic"
	"time"

	"nodeVault/models"
	"nodeVault/storage"

	"github.com/ipfs/go-cid"
	libp2p "github.com/libp2p/go-libp2p"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	mh "github.com/multiformats/go-multihash"
)

const fileProtocol = "/nodevault/file/1.0.0"

type Node struct {
	Host  host.Host
	DHT   *dht.IpfsDHT
	Store *storage.FileStorage
	// Счетчики для метрик
	streamCount int32
	connCount   int32
}

// Ensure Node implements NodeInterface
var _ NodeInterface = (*Node)(nil)

func NewNode(ctx context.Context, st *storage.FileStorage) (*Node, error) {
	h, err := libp2p.New()
	if err != nil {
		return nil, fmt.Errorf("libp2p new: %w", err)
	}

	kadDHT, err := dht.New(ctx, h, dht.Mode(dht.ModeAutoServer))
	if err != nil {
		h.Close()
		return nil, fmt.Errorf("failed to create DHT: %w", err)
	}

	node := &Node{Host: h, DHT: kadDHT, Store: st}

	// Устанавливаем stream handler для обслуживания файлов по CID
	h.SetStreamHandler(fileProtocol, func(s network.Stream) {
		atomic.AddInt32(&node.streamCount, 1)
		defer func() {
			atomic.AddInt32(&node.streamCount, -1)
			s.Close()
		}()

		r := bufio.NewReader(s)
		cidLine, err := r.ReadString('\n')
		if err != nil {
			return
		}
		cidStr := strings.TrimSpace(cidLine)

		// Пробуем загрузить файл из локального хранилища
		data, meta, err := st.GetFile(cidStr)
		if err != nil {
			msg := fmt.Sprintf("ERROR: not found locally: %s\n", err.Error())
			s.Write([]byte(msg))
			return
		}

		// Создаем буфер в формате: [длина мета][мета][данные]
		buf := &bytes.Buffer{}

		// Кодируем метаданные
		metaBuf := &bytes.Buffer{}
		if err := meta.Encode(metaBuf); err != nil {
			msg := fmt.Sprintf("ERROR: failed to encode meta: %s\n", err.Error())
			s.Write([]byte(msg))
			return
		}
		metaBytes := metaBuf.Bytes()

		// 1. Длина метаданных
		if err := binary.Write(buf, binary.LittleEndian, uint64(len(metaBytes))); err != nil {
			msg := fmt.Sprintf("ERROR: failed to write meta length: %s\n", err.Error())
			s.Write([]byte(msg))
			return
		}

		// 2. Метаданные
		buf.Write(metaBytes)
		// 3. Данные
		buf.Write(data)

		// Отправляем полный пакет
		s.Write(buf.Bytes())
	})

	// Bootstrap DHT в фоне
	go func() {
		select {
		case <-time.After(2 * time.Second):
			kadDHT.Bootstrap(ctx)
		case <-ctx.Done():
			return
		}
	}()

	return node, nil
}

// CalcCID вычисляет CIDv1 (raw codec) используя SHA-256
func CalcCID(data []byte) (cid.Cid, error) {
	sum, err := mh.Sum(data, mh.SHA2_256, -1)
	if err != nil {
		return cid.Cid{}, err
	}
	return cid.NewCidV1(cid.Raw, sum), nil
}

// Provide анонсирует, что этот узел хранит указанный CID
func (n *Node) Provide(ctx context.Context, c cid.Cid) error {
	ctx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()
	return n.DHT.Provide(ctx, c, true)
}

// FindProviders возвращает пиров, которые предоставляют CID
func (n *Node) FindProviders(ctx context.Context, c cid.Cid) ([]peer.AddrInfo, error) {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	return n.DHT.FindProviders(ctx, c)
}

// FetchFromNetwork пытается получить файл из сети
func (n *Node) FetchFromNetwork(ctx context.Context, cidStr string, maxSize int64) ([]byte, *models.FileMeta, error) {
	cidObj, err := cid.Parse(cidStr)
	if err != nil {
		return nil, nil, fmt.Errorf("invalid cid: %w", err)
	}

	// Ищем провайдеров
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	providers := n.DHT.FindProvidersAsync(ctx, cidObj, 10)
	attempts := 0

	for p := range providers {
		if p.ID == n.Host.ID() {
			continue // Пропускаем себя
		}

		attempts++

		// Открываем stream к провайдеру
		streamCtx, scancel := context.WithTimeout(ctx, 20*time.Second)
		s, err := n.Host.NewStream(streamCtx, p.ID, fileProtocol)
		scancel()

		if err != nil {
			continue
		}

		// Отправляем CID + newline
		_, err = s.Write([]byte(cidStr + "\n"))
		if err != nil {
			s.Close()
			continue
		}

		// Читаем ответ
		responseData, err := io.ReadAll(s)
		s.Close()

		if err != nil {
			continue
		}

		// Проверяем на ошибку
		if bytes.HasPrefix(responseData, []byte("ERROR:")) {
			continue
		}

		// Проверяем размер файла
		if int64(len(responseData)) > maxSize {
			continue
		}

		// Парсим ответ
		buf := bytes.NewBuffer(responseData)

		// 1. Читаем длину метаданных
		var metaLen uint64
		if err := binary.Read(buf, binary.LittleEndian, &metaLen); err != nil {
			continue
		}

		// 2. Читаем метаданные
		metaBytes := make([]byte, metaLen)
		if _, err := buf.Read(metaBytes); err != nil {
			continue
		}

		meta := &models.FileMeta{}
		metaBuf := bytes.NewBuffer(metaBytes)
		if err := meta.Decode(metaBuf); err != nil {
			continue
		}

		// 3. Оставшиеся байты - данные файла
		fileData := buf.Bytes()

		return fileData, meta, nil
	}

	return nil, nil, fmt.Errorf("no providers found for cid %s (attempts: %d)", cidStr, attempts)
}

// GetPeerID возвращает ID пира
func (n *Node) GetPeerID() string {
	return n.Host.ID().String()
}

// GetAddresses возвращает адреса узла
func (n *Node) GetAddresses() []string {
	var addrs []string
	for _, a := range n.Host.Addrs() {
		addrs = append(addrs, fmt.Sprintf("%s/p2p/%s", a, n.Host.ID()))
	}
	return addrs
}

// GetConnectionCount возвращает количество активных соединений
func (n *Node) GetConnectionCount() int {
	return int(atomic.LoadInt32(&n.connCount))
}

// GetStreamCount возвращает количество активных стримов
func (n *Node) GetStreamCount() int {
	return int(atomic.LoadInt32(&n.streamCount))
}

// Close закрывает P2P узел
func (n *Node) Close() error {
	var errors []string

	if err := n.DHT.Close(); err != nil {
		errors = append(errors, fmt.Sprintf("DHT close error: %v", err))
	}

	if err := n.Host.Close(); err != nil {
		errors = append(errors, fmt.Sprintf("Host close error: %v", err))
	}

	if len(errors) > 0 {
		return fmt.Errorf("%s", strings.Join(errors, "; "))
	}

	return nil
}
