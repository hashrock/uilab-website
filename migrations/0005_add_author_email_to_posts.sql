-- 記事に作成者のメールアドレスを追加
ALTER TABLE posts ADD COLUMN author_email TEXT NOT NULL DEFAULT '';
