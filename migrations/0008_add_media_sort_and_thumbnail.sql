-- メディアの並び順カラム追加
ALTER TABLE media ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- 記事のサムネイルメディアID追加
ALTER TABLE posts ADD COLUMN thumbnail_id INTEGER REFERENCES media(id) ON DELETE SET NULL;
