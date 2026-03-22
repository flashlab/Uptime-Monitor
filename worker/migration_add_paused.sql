-- 为 monitors 表增加 paused 字段（0=正常监控, 1=已暂停）
ALTER TABLE monitors ADD COLUMN paused INTEGER NOT NULL DEFAULT 0;
