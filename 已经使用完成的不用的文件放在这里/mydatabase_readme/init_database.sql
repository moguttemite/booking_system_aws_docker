-- =====================================================
-- 讲座预订系统数据库初始化脚本
-- 版本: v1.4
-- 创建时间: 2025-01-27
-- 描述: 完整的数据库表结构创建脚本
-- =====================================================

-- 设置客户端编码
SET client_encoding = 'UTF8';

-- =====================================================
-- 1. 用户管理表
-- =====================================================

-- ユーザー情報テーブル
CREATE TABLE user_infos (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP
);

-- 講師情報テーブル
CREATE TABLE teacher_profiles (
  id INTEGER PRIMARY KEY,  -- 使用与 user_infos.id 相同的 ID，作为一对一扩展
  phone TEXT,
  bio TEXT,
  profile_image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (id) REFERENCES user_infos(id) ON DELETE CASCADE
);

-- =====================================================
-- 2. 讲座管理表
-- =====================================================

-- 講義情報テーブル
CREATE TABLE lectures (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL,  -- 主讲讲师ID（必須）
  lecture_title TEXT NOT NULL,
  lecture_description TEXT,
  approval_status VARCHAR(20) DEFAULT 'pending' CHECK (
    approval_status IN ('pending', 'approved', 'rejected')
  ),
  is_multi_teacher BOOLEAN DEFAULT FALSE,  -- 多讲师講座フラグ
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,

  FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id) ON DELETE CASCADE
);

-- 约束：主讲讲师は必須
ALTER TABLE lectures ADD CONSTRAINT check_teacher_consistency 
CHECK (
  teacher_id IS NOT NULL  -- 主讲讲师は常に必要
);

-- 講座-講師関連テーブル（多讲师講座用）
CREATE TABLE lecture_teachers (
  lecture_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (lecture_id, teacher_id) -- 複合主キー、重複関連を防止
);

-- カルーセルテーブル
CREATE TABLE carousel (
  lecture_id INTEGER NOT NULL,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
  UNIQUE (lecture_id),  -- 一つの講座は一度だけカルーセルに掲載可能
  UNIQUE (display_order)  -- 表示順序は重複不可
);

-- =====================================================
-- 3. 时间安排与预约表
-- =====================================================

-- 講義スケジュールテーブル
CREATE TABLE lecture_schedules (
  id SERIAL PRIMARY KEY,
  lecture_id INTEGER NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_expired BOOLEAN DEFAULT FALSE,
  
  CHECK (start_time < end_time),
  UNIQUE (lecture_id, booking_date, start_time, end_time),

  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);

-- 講義予約テーブル
CREATE TABLE lecture_bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  lecture_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'cancelled')
  ),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_expired BOOLEAN DEFAULT FALSE,
  
  FOREIGN KEY (user_id) REFERENCES user_infos(id) ON DELETE CASCADE,
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);

-- =====================================================
-- 4. 索引创建
-- =====================================================

-- インデックス作成
CREATE INDEX idx_lecture_teachers_lecture_id ON lecture_teachers(lecture_id);
CREATE INDEX idx_lecture_teachers_teacher_id ON lecture_teachers(teacher_id);

-- 用户表索引
CREATE INDEX idx_user_infos_email ON user_infos(email);
CREATE INDEX idx_user_infos_role ON user_infos(role);
CREATE INDEX idx_user_infos_is_deleted ON user_infos(is_deleted);

-- 讲座表索引
CREATE INDEX idx_lectures_teacher_id ON lectures(teacher_id);
CREATE INDEX idx_lectures_approval_status ON lectures(approval_status);
CREATE INDEX idx_lectures_is_deleted ON lectures(is_deleted);
CREATE INDEX idx_lectures_is_multi_teacher ON lectures(is_multi_teacher);

-- 时间安排表索引
CREATE INDEX idx_lecture_schedules_lecture_id ON lecture_schedules(lecture_id);
CREATE INDEX idx_lecture_schedules_booking_date ON lecture_schedules(booking_date);
CREATE INDEX idx_lecture_schedules_is_expired ON lecture_schedules(is_expired);

-- 预约表索引
CREATE INDEX idx_lecture_bookings_user_id ON lecture_bookings(user_id);
CREATE INDEX idx_lecture_bookings_lecture_id ON lecture_bookings(lecture_id);
CREATE INDEX idx_lecture_bookings_booking_date ON lecture_bookings(booking_date);
CREATE INDEX idx_lecture_bookings_status ON lecture_bookings(status);
CREATE INDEX idx_lecture_bookings_is_expired ON lecture_bookings(is_expired);

-- 轮播图表索引
CREATE INDEX idx_carousel_lecture_id ON carousel(lecture_id);
CREATE INDEX idx_carousel_display_order ON carousel(display_order);
CREATE INDEX idx_carousel_is_active ON carousel(is_active);

-- =====================================================
-- 5. 后续更新（参考 create_database.sql 的更新部分）
-- =====================================================

-- 2025-09-02 追加
-- 1. 添加 teacher_id 字段（允许 NULL）
ALTER TABLE lecture_bookings 
ADD COLUMN teacher_id INTEGER;

-- 2. 根据现有 lecture_id 填充 teacher_id
UPDATE lecture_bookings 
SET teacher_id = (
    SELECT teacher_id 
    FROM lectures 
    WHERE lectures.id = lecture_bookings.lecture_id
);

-- 3. 验证数据填充成功
SELECT COUNT(*) FROM lecture_bookings WHERE teacher_id IS NULL;

-- 4. 添加 NOT NULL 约束
ALTER TABLE lecture_bookings 
ALTER COLUMN teacher_id SET NOT NULL;

-- 5. 添加外键约束
ALTER TABLE lecture_bookings 
ADD CONSTRAINT fk_lecture_bookings_teacher 
FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id);

-- 2025-09-02 追加 2
-- 1. 添加 teacher_id 字段
ALTER TABLE lecture_schedules 
ADD COLUMN teacher_id INTEGER;

-- 2. 根据现有 lecture_id 填充 teacher_id
UPDATE lecture_schedules 
SET teacher_id = (
    SELECT teacher_id 
    FROM lectures 
    WHERE lectures.id = lecture_schedules.lecture_id
);

-- 3. 添加 NOT NULL 约束
ALTER TABLE lecture_schedules 
ALTER COLUMN teacher_id SET NOT NULL;

-- 4. 添加外键约束
ALTER TABLE lecture_schedules 
ADD CONSTRAINT fk_lecture_schedules_teacher 
FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id);

-- 5. 添加复合唯一约束（防止同一讲师同一时间重复）
ALTER TABLE lecture_schedules 
ADD CONSTRAINT unique_teacher_time_slot 
UNIQUE (teacher_id, booking_date, start_time, end_time);

-- 为新增的 teacher_id 字段创建索引
CREATE INDEX idx_lecture_bookings_teacher_id ON lecture_bookings(teacher_id);
CREATE INDEX idx_lecture_schedules_teacher_id ON lecture_schedules(teacher_id);

-- =====================================================
-- 6. 触发器创建（自动更新时间戳）
-- =====================================================

-- 创建更新时间戳的通用函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为用户表创建触发器
CREATE TRIGGER update_user_infos_updated_at 
    BEFORE UPDATE ON user_infos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为讲师档案表创建触发器
CREATE TRIGGER update_teacher_profiles_updated_at 
    BEFORE UPDATE ON teacher_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为讲座表创建触发器
CREATE TRIGGER update_lectures_updated_at 
    BEFORE UPDATE ON lectures 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. 完成信息
-- =====================================================

-- 显示创建完成的表信息
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 完成提示
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '讲座预订系统数据库初始化完成！';
    RAISE NOTICE '创建时间: %', CURRENT_TIMESTAMP;
    RAISE NOTICE '数据库版本: v1.4';
    RAISE NOTICE '包含更新: 2025-09-02 添加 teacher_id 字段';
    RAISE NOTICE '=====================================================';
END $$;