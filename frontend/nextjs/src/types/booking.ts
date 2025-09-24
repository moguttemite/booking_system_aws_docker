/**
 * 预约系统相关的类型定义
 * 包含预约、讲座、讲师等核心业务类型
 */

import type { LectureStatus, UserRole } from './index';

// ==================== 预约相关类型 ====================

/**
 * 预约项目基础信息
 */
export interface BookingItem {
  /** 讲座标题 */
  lecture_title: string;
  /** 讲座描述 */
  lecture_description: string;
  /** 讲师姓名 */
  teacher_name: string;
  /** 讲师头像 */
  teacher_profile_image: string | null;
}

/**
 * 可预约讲座类型 - 直接适配后端API
 */
export interface BookableTeacher {
  /** 讲座ID */
  id: number;
  /** 讲座标题 */
  lecture_title: string;
  /** 讲座描述 */
  lecture_description: string;
  /** 审批状态 */
  approval_status: LectureStatus;
  /** 讲师姓名 */
  teacher_name: string;
  /** 讲师ID */
  teacher_id: number;
  /** 是否多讲师课程 */
  is_multi_teacher: boolean;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/**
 * 预约状态类型
 */
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired';

/**
 * 预约记录
 */
export interface BookingRecord {
  /** 预约ID */
  id: number;
  /** 用户ID */
  user_id: number;
  /** 讲座ID */
  lecture_id: number;
  /** 讲师ID */
  teacher_id: number;
  /** 预约日期 */
  booking_date: string;
  /** 开始时间 */
  start_time: string;
  /** 结束时间 */
  end_time: string;
  /** 预约状态 */
  status: BookingStatus;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
  /** 是否过期 */
  is_expired?: boolean;
}

/**
 * 预约创建数据
 */
export interface BookingCreateData {
  /** 用户ID */
  user_id: number;
  /** 讲座ID */
  lecture_id: number;
  /** 讲师ID */
  teacher_id: number;
  /** 预约日期 */
  booking_date: string;
  /** 开始时间 */
  start_time: string;
  /** 结束时间 */
  end_time: string;
}

/**
 * 预约更新数据
 */
export interface BookingUpdateData {
  /** 预约状态 */
  status?: BookingStatus;
  /** 预约日期 */
  booking_date?: string;
  /** 开始时间 */
  start_time?: string;
  /** 结束时间 */
  end_time?: string;
}

// ==================== 时间安排相关类型 ====================

/**
 * 时间槽类型
 */
export interface TimeSlot {
  /** 开始时间 */
  start: string;
  /** 结束时间 */
  end: string;
  /** 是否可用 */
  available: boolean;
  /** 是否被预约 */
  booked: boolean;
  /** 预约者信息 */
  booker?: {
    id: number;
    name: string;
  };
}

/**
 * 日期时间安排
 */
export interface DateSchedule {
  /** 日期 */
  date: string;
  /** 时间槽列表 */
  timeSlots: TimeSlot[];
  /** 是否可用 */
  available: boolean;
}

/**
 * 周视图数据
 */
export interface WeekSchedule {
  /** 周开始日期 */
  weekStart: string;
  /** 周结束日期 */
  weekEnd: string;
  /** 日期安排列表 */
  dateSchedules: DateSchedule[];
}

// ==================== 讲师相关类型 ====================

/**
 * 讲师基础信息
 */
export interface TeacherInfo {
  /** 讲师ID */
  id: number;
  /** 讲师姓名 */
  name: string;
  /** 讲师邮箱 */
  email: string;
  /** 讲师头像 */
  profile_image?: string | null;
  /** 讲师简介 */
  bio?: string;
  /** 讲师电话 */
  phone?: string;
  /** 用户角色 */
  role: UserRole;
}

/**
 * 讲师讲座关联
 */
export interface TeacherLectureRelation {
  /** 关联ID */
  id: number;
  /** 讲师ID */
  teacher_id: number;
  /** 讲座ID */
  lecture_id: number;
  /** 讲师姓名 */
  teacher_name: string;
  /** 创建时间 */
  created_at: string;
}

// ==================== 预约管理相关类型 ====================

/**
 * 预约统计信息
 */
export interface BookingStatistics {
  /** 总预约数 */
  total_bookings: number;
  /** 待确认预约数 */
  pending_bookings: number;
  /** 已确认预约数 */
  confirmed_bookings: number;
  /** 已取消预约数 */
  cancelled_bookings: number;
  /** 过期预约数 */
  expired_bookings: number;
}

/**
 * 预约查询参数
 */
export interface BookingQueryParams {
  /** 用户ID */
  user_id?: number;
  /** 讲座ID */
  lecture_id?: number;
  /** 讲师ID */
  teacher_id?: number;
  /** 预约状态 */
  status?: BookingStatus;
  /** 开始日期 */
  start_date?: string;
  /** 结束日期 */
  end_date?: string;
  /** 页码 */
  page?: number;
  /** 每页数量 */
  size?: number;
}

/**
 * 预约响应数据
 */
export interface BookingResponse {
  /** 预约记录列表 */
  bookings: BookingRecord[];
  /** 总数 */
  total: number;
  /** 页码 */
  page: number;
  /** 每页数量 */
  size: number;
  /** 总页数 */
  total_pages: number;
}

// ==================== 时间工具类型 ====================

/**
 * 时间范围
 */
export interface TimeRange {
  /** 开始时间 */
  start: string;
  /** 结束时间 */
  end: string;
}

/**
 * 日期范围
 */
export interface DateRange {
  /** 开始日期 */
  start: string;
  /** 结束日期 */
  end: string;
}

/**
 * 时间冲突信息
 */
export interface TimeConflict {
  /** 冲突类型 */
  type: 'overlap' | 'adjacent' | 'duplicate';
  /** 冲突时间 */
  time: TimeRange;
  /** 冲突描述 */
  description: string;
  /** 冲突的预约ID */
  conflicting_booking_id?: number;
}

// ==================== 组件Props类型 ====================

/**
 * 预约组件基础Props
 */
export interface BookingComponentProps {
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 加载状态 */
  loading?: boolean;
  /** 错误信息 */
  error?: string | null;
}

/**
 * 时间选择器Props
 */
export interface TimeSelectorProps extends BookingComponentProps {
  /** 可用时间范围 */
  availableTimes: TimeRange[];
  /** 已预约时间 */
  bookedTimes: TimeRange[];
  /** 选择的时间 */
  selectedTime?: TimeRange | null;
  /** 时间选择回调 */
  onTimeSelect?: (time: TimeRange) => void;
  /** 时间间隔（分钟） */
  interval?: number;
}

/**
 * 日期选择器Props
 */
export interface DateSelectorProps extends BookingComponentProps {
  /** 可用日期范围 */
  availableDates: string[];
  /** 选择的日期 */
  selectedDate?: string | null;
  /** 日期选择回调 */
  onDateSelect?: (date: string) => void;
  /** 最小日期 */
  minDate?: string;
  /** 最大日期 */
  maxDate?: string;
}

// ==================== 工具类型 ====================

/**
 * 预约状态颜色映射
 */
export type BookingStatusColor = {
  [K in BookingStatus]: string;
};

/**
 * 预约状态文本映射
 */
export type BookingStatusText = {
  [K in BookingStatus]: string;
};

/**
 * 时间格式类型
 */
export type TimeFormat = 'HH:mm' | 'HH:mm:ss' | 'h:mm A' | 'HH:mm:ss.SSS';

/**
 * 日期格式类型
 */
export type DateFormat = 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY年MM月DD日';
