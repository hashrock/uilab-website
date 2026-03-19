-- ユーザーにプロフィール項目を追加
ALTER TABLE users ADD COLUMN display_name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN website_url TEXT NOT NULL DEFAULT '';

-- 記事に作者ユーザーIDを追加（自由入力との選択制）
ALTER TABLE posts ADD COLUMN author_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
