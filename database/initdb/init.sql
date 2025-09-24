-- 講義予約システムデータベース初期化スクリプト
-- このスクリプトはPostgreSQLコンテナ起動時に自動実行されます

-- 必要な拡張機能を作成
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ユーザー情報テーブル
CREATE TABLE user_infos (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 講師情報テーブル（ユーザー情報テーブルと1対1の関係）
CREATE TABLE teacher_profiles (
  id INTEGER PRIMARY KEY,
  phone TEXT,
  bio TEXT,
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (id) REFERENCES user_infos(id) ON DELETE CASCADE
);

-- 講義情報テーブル
CREATE TABLE lectures (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL,
  lecture_title TEXT NOT NULL,
  lecture_description TEXT,
  approval_status VARCHAR(20) DEFAULT 'pending' CHECK (
    approval_status IN ('pending', 'approved', 'rejected')
  ),
  is_multi_teacher BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,

  FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id) ON DELETE CASCADE
);

-- 講義スケジュールテーブル
CREATE TABLE lecture_schedules (
  id SERIAL PRIMARY KEY,
  lecture_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_expired BOOLEAN DEFAULT FALSE,
  
  CHECK (start_time < end_time),
  UNIQUE (lecture_id, booking_date, start_time, end_time),

  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id) ON DELETE CASCADE
);

-- 講義予約テーブル
CREATE TABLE lecture_bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  lecture_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'cancelled')
  ),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_expired BOOLEAN DEFAULT FALSE,
  
  FOREIGN KEY (user_id) REFERENCES user_infos(id) ON DELETE CASCADE,
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id) ON DELETE CASCADE
);

-- 講義-講師関連テーブル（多講師講義サポート）
CREATE TABLE lecture_teachers (
  lecture_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  
  PRIMARY KEY (lecture_id, teacher_id),
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id) ON DELETE CASCADE
);

-- カルーセルテーブル
CREATE TABLE carousel (
  lecture_id INTEGER NOT NULL,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);

-- クエリ性能を最適化するためのインデックスを作成
CREATE INDEX IF NOT EXISTS idx_user_infos_email ON user_infos(email);
CREATE INDEX IF NOT EXISTS idx_user_infos_role ON user_infos(role);
CREATE INDEX IF NOT EXISTS idx_user_infos_is_deleted ON user_infos(is_deleted);
CREATE INDEX IF NOT EXISTS idx_lectures_teacher_id ON lectures(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lectures_approval_status ON lectures(approval_status);
CREATE INDEX IF NOT EXISTS idx_lectures_is_deleted ON lectures(is_deleted);
CREATE INDEX IF NOT EXISTS idx_lecture_schedules_lecture_id ON lecture_schedules(lecture_id);
CREATE INDEX IF NOT EXISTS idx_lecture_schedules_booking_date ON lecture_schedules(booking_date);
CREATE INDEX IF NOT EXISTS idx_lecture_schedules_is_expired ON lecture_schedules(is_expired);
CREATE INDEX IF NOT EXISTS idx_lecture_bookings_user_id ON lecture_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_lecture_bookings_lecture_id ON lecture_bookings(lecture_id);
CREATE INDEX IF NOT EXISTS idx_lecture_bookings_booking_date ON lecture_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_lecture_bookings_status ON lecture_bookings(status);
CREATE INDEX IF NOT EXISTS idx_lecture_bookings_is_expired ON lecture_bookings(is_expired);
CREATE INDEX IF NOT EXISTS idx_lecture_teachers_lecture_id ON lecture_teachers(lecture_id);
CREATE INDEX IF NOT EXISTS idx_lecture_teachers_teacher_id ON lecture_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_carousel_lecture_id ON carousel(lecture_id);
CREATE INDEX IF NOT EXISTS idx_carousel_display_order ON carousel(display_order);
CREATE INDEX IF NOT EXISTS idx_carousel_is_active ON carousel(is_active);

-- 更新時間トリガー関数を作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ユーザー情報テーブルに更新時間トリガーを追加
CREATE TRIGGER update_user_infos_updated_at 
    BEFORE UPDATE ON user_infos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 講師情報テーブルに更新時間トリガーを追加
CREATE TRIGGER update_teacher_profiles_updated_at 
    BEFORE UPDATE ON teacher_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 講義情報テーブルに更新時間トリガーを追加
CREATE TRIGGER update_lectures_updated_at 
    BEFORE UPDATE ON lectures 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- デフォルト管理者アカウントを挿入
-- パスワード: Admin1234
INSERT INTO user_infos (name, email, hashed_password, role, is_deleted) VALUES
('システム管理者', 'admin@example.com', '$2b$12$fFtBoDntm7psjKl3AvrCUe65e7XnnXDrVxXhF8Ze/Z2DcoAJteNlK', 'admin', FALSE)
ON CONFLICT (email) DO NOTHING;
