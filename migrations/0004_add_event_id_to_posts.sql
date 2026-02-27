-- イベントとポストの紐付け
ALTER TABLE posts ADD COLUMN event_id INTEGER REFERENCES events(id) ON DELETE SET NULL;
