package models

import (
	"bytes"
	"encoding/gob"
	"time"
)

type FileMeta struct {
	ID        string
	Filename  string
	Size      int64
	Hash      string
	CreatedAt time.Time
	ExpiresAt time.Time
}

func (m *FileMeta) Encode(buf *bytes.Buffer) error {
	return gob.NewEncoder(buf).Encode(m)
}

func (m *FileMeta) Decode(buf *bytes.Buffer) error {
	return gob.NewDecoder(buf).Decode(m)
}
