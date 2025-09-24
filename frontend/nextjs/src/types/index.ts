/**
 * 统一的类型定义文件
 * 所有项目中的类型定义都应该在这里定义，避免重复和混乱
 */

// ==================== 基础类型 ====================

/**
 * 用户角色类型
 */
export type UserRole = 'admin' | 'teacher' | 'student';

/**
 * 用户基础信息
 */
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

/**
 * 用户更新数据
 */
export interface UserUpdateData {
  name?: string;
  email?: string;
}

/**
 * 用户详细信息（包含扩展信息）
 */
export interface UserProfile extends User {
  phone?: string;
  bio?: string;
  profile_image?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ==================== 讲座相关类型 ====================

/**
 * 讲座状态
 */
export type LectureStatus = 'pending' | 'approved' | 'rejected';

/**
 * 讲座基础信息
 */
export interface Lecture {
  id: number;
  lecture_title: string;
  lecture_description: string;
  teacher_id: number;
  teacher_name: string;
  approval_status: LectureStatus;
  is_multi_teacher: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 讲座创建数据
 */
export interface LectureCreateData {
  lecture_title: string;
  lecture_description: string;
  teacher_id: number;
  is_multi_teacher: boolean;
}

/**
 * 讲座更新数据
 */
export interface LectureUpdateData {
  lecture_title?: string;
  lecture_description?: string;
}

/**
 * 讲座审批数据
 */
export interface LectureApprovalUpdateData {
  approval_status: LectureStatus;
}

/**
 * 多讲师讲座信息
 */
export interface MultiLecture {
  id: number;
  title: string;
  description: string;
  teacher_ids: number[];
  status: 'active' | 'inactive';
  created_at: string;
}

// ==================== 预约相关类型 ====================

/**
 * 预约状态
 */
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

/**
 * 用户预约信息
 */
export interface UserBooking {
  id: number;
  lecture_id: number;
  lecture_title: string;
  teacher_name: string;
  status: BookingStatus;
  booking_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

/**
 * 预约创建数据
 */
export interface BookingCreateData {
  user_id: number;
  lecture_id: number;
  teacher_id: number;
  reserved_date: string;
  start_time: string;
  end_time: string;
}

/**
 * 预约响应数据
 */
export interface UserBookingsResponse {
  message: string;
  total_count: number;
  bookings: UserBooking[];
}

// ==================== 时间表相关类型 ====================

/**
 * 讲座时间表记录
 */
export interface LectureScheduleRecord {
  id: number;
  lecture_id: number;
  teacher_id: number;
  available_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 时间表创建数据
 */
export interface ScheduleCreateData {
  lecture_id: number;
  available_date: string;
  start_time: string;
  end_time: string;
}

/**
 * 时间表响应数据
 */
export interface LectureScheduleResponse {
  message: string;
  schedules: LectureScheduleRecord[];
}

/**
 * 讲座预约响应数据
 */
export interface LectureBookingResponse {
  id: number;
  lecture_id: number;
  teacher_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
  is_expired: boolean;
}

// ==================== 讲师相关类型 ====================

/**
 * 讲师档案信息
 */
export interface TeacherProfile {
  id: number;
  user_id: number;
  phone?: string;
  bio?: string;
  profile_image?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 讲师档案更新数据
 */
export interface TeacherProfileUpdateData {
  phone?: string;
  bio?: string;
  profile_image?: string;
}

/**
 * 讲师档案更新响应
 */
export interface TeacherProfileUpdateResponse {
  message: string;
  profile: TeacherProfile;
}

// ==================== 轮播图相关类型 ====================

/**
 * 轮播图项目
 */
export interface CarouselItem {
  lecture_id: number;
  lecture_title: string;
  lecture_description: string;
  teacher_name: string;
  teacher_image: string | null;
  display_order: number;
}

/**
 * 轮播图管理项目
 */
export interface CarouselManagementItem {
  lecture_id: number;
  lecture_title: string;
  display_order: number;
  is_active: boolean;
}

// ==================== API响应类型 ====================

/**
 * 通用API响应
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * 分页信息
 */
export interface PaginationInfo {
  page: number;
  size: number;
  total: number;
  pages: number;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
}

// ==================== 表单相关类型 ====================

/**
 * 登录表单数据
 */
export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * 注册表单数据
 */
export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ==================== 组件Props类型 ====================

/**
 * 模态框基础Props
 */
export interface ModalProps {
  opened: boolean;
  onClose: () => void;
  title?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
}

/**
 * 加载状态Props
 */
export interface LoadingProps {
  loading: boolean;
  error?: string | null;
  loadingText?: string;
  onRetry?: () => void;
}

/**
 * 表单基础Props
 */
export interface FormProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  onSubmit?: (data: Record<string, any>) => void;
  onReset?: () => void;
  readOnly?: boolean;
}

/**
 * 输入框Props
 */
export interface InputProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
}

/**
 * 选择器Props
 */
export interface SelectProps {
  name: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  label?: string;
  error?: string;
  searchable?: boolean;
  clearable?: boolean;
}

// ==================== 工具类型 ====================

/**
 * 可选字段类型
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 必需字段类型
 */
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * 部分更新类型
 */
export type PartialUpdate<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;

// ==================== 向后兼容的类型别名 ====================

/**
 * 向后兼容的类型别名
 * @deprecated 请使用 User 替代
 */
export type UserInfo = User;

/**
 * 向后兼容的类型别名
 * @deprecated 请使用 User 替代
 */
export type UserType = User;

/**
 * 向后兼容的类型别名
 * @deprecated 请使用 Lecture 替代
 */
export type LectureListType = Lecture;

/**
 * 向后兼容的类型别名
 * @deprecated 请使用 LectureCreateData 替代
 */
export type LectureCreateData = LectureCreateData;
