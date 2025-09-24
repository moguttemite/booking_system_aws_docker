/**
 * 组件相关的类型定义
 * 包含各种UI组件的Props和状态类型
 */

import type { ReactNode, CSSProperties } from 'react';
import type { BookableTeacher, BookingRecord, TimeRange, DateRange } from './booking';
import type { User, LectureStatus } from './index';

// ==================== 基础组件类型 ====================

/**
 * 基础组件Props
 */
export interface BaseComponentProps {
  /** 子元素 */
  children?: ReactNode;
  /** 自定义样式类名 */
  className?: string;
  /** 内联样式 */
  style?: CSSProperties;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可见 */
  visible?: boolean;
  /** 测试ID */
  testId?: string;
}

/**
 * 加载状态Props
 */
export interface LoadingProps extends BaseComponentProps {
  /** 是否加载中 */
  loading: boolean;
  /** 加载文本 */
  loadingText?: string;
  /** 错误信息 */
  error?: string | null;
  /** 重试回调 */
  onRetry?: () => void;
}

/**
 * 模态框基础Props
 */
export interface ModalProps extends BaseComponentProps {
  /** 是否打开 */
  opened: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 标题 */
  title?: string;
  /** 是否可关闭 */
  closeOnClickOutside?: boolean;
  /** 是否可ESC关闭 */
  closeOnEscape?: boolean;
  /** 模态框大小 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// ==================== 卡片组件类型 ====================

/**
 * 讲师卡片Props
 */
export interface TeacherCardProps extends BaseComponentProps {
  /** 讲座ID */
  lectureId: number;
  /** 讲座标题 */
  lectureTitle?: string;
  /** 讲座描述 */
  lectureDescription?: string;
  /** 讲师姓名 */
  teacherName?: string;
  /** 讲师头像 */
  teacherImage?: string | null;
  /** 点击事件 */
  onClick?: (lectureId: number) => void;
  /** 悬停效果 */
  hoverable?: boolean;
  /** 阴影效果 */
  shadow?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'none';
}

/**
 * 讲座卡片Props
 */
export interface LectureCardProps extends BaseComponentProps {
  /** 讲座信息 */
  lecture: BookableTeacher;
  /** 是否显示操作按钮 */
  showActions?: boolean;
  /** 操作按钮配置 */
  actions?: LectureCardAction[];
  /** 点击事件 */
  onClick?: (lecture: BookableTeacher) => void;
}

/**
 * 讲座卡片操作
 */
export interface LectureCardAction {
  /** 操作标签 */
  label: string;
  /** 操作类型 */
  type: 'primary' | 'secondary' | 'danger';
  /** 点击回调 */
  onClick: (lecture: BookableTeacher) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 图标 */
  icon?: ReactNode;
}

// ==================== 表单组件类型 ====================

/**
 * 表单基础Props
 */
export interface FormProps extends BaseComponentProps {
  /** 表单数据 */
  data: Record<string, any>;
  /** 数据变更回调 */
  onChange: (data: Record<string, any>) => void;
  /** 提交回调 */
  onSubmit?: (data: Record<string, any>) => void;
  /** 重置回调 */
  onReset?: () => void;
  /** 验证规则 */
  validation?: Record<string, ValidationRule>;
  /** 是否只读 */
  readOnly?: boolean;
}

/**
 * 验证规则
 */
export interface ValidationRule {
  /** 是否必填 */
  required?: boolean;
  /** 最小长度 */
  minLength?: number;
  /** 最大长度 */
  maxLength?: number;
  /** 正则表达式 */
  pattern?: RegExp;
  /** 自定义验证函数 */
  validator?: (value: any) => string | null;
  /** 错误消息 */
  message?: string;
}

/**
 * 输入框Props
 */
export interface InputProps extends BaseComponentProps {
  /** 字段名 */
  name: string;
  /** 值 */
  value: string;
  /** 变更回调 */
  onChange: (value: string) => void;
  /** 占位符 */
  placeholder?: string;
  /** 标签 */
  label?: string;
  /** 错误信息 */
  error?: string;
  /** 帮助文本 */
  helpText?: string;
  /** 是否必填 */
  required?: boolean;
  /** 输入类型 */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
}

/**
 * 选择器Props
 */
export interface SelectProps extends BaseComponentProps {
  /** 字段名 */
  name: string;
  /** 值 */
  value: string | null;
  /** 变更回调 */
  onChange: (value: string | null) => void;
  /** 选项列表 */
  options: SelectOption[];
  /** 占位符 */
  placeholder?: string;
  /** 标签 */
  label?: string;
  /** 错误信息 */
  error?: string;
  /** 是否可搜索 */
  searchable?: boolean;
  /** 是否可清除 */
  clearable?: boolean;
}

/**
 * 选择器选项
 */
export interface SelectOption {
  /** 值 */
  value: string;
  /** 标签 */
  label: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 分组 */
  group?: string;
}

// ==================== 时间相关组件类型 ====================

/**
 * 时间选择器Props
 */
export interface TimeSelectorProps extends BaseComponentProps {
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
  /** 是否显示时间冲突 */
  showConflicts?: boolean;
}

/**
 * 日期选择器Props
 */
export interface DateSelectorProps extends BaseComponentProps {
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
  /** 是否显示周末 */
  showWeekends?: boolean;
}

/**
 * 日历组件Props
 */
export interface CalendarProps extends BaseComponentProps {
  /** 当前日期 */
  currentDate: Date;
  /** 日期变更回调 */
  onDateChange: (date: Date) => void;
  /** 可用日期 */
  availableDates?: string[];
  /** 已预约日期 */
  bookedDates?: string[];
  /** 是否显示导航 */
  showNavigation?: boolean;
  /** 是否显示周数 */
  showWeekNumbers?: boolean;
}

// ==================== 列表组件类型 ====================

/**
 * 预约列表Props
 */
export interface BookingListProps extends BaseComponentProps {
  /** 预约记录列表 */
  bookings: BookingRecord[];
  /** 加载状态 */
  loading?: boolean;
  /** 错误信息 */
  error?: string | null;
  /** 空状态文本 */
  emptyText?: string;
  /** 是否显示分页 */
  showPagination?: boolean;
  /** 分页配置 */
  pagination?: PaginationProps;
  /** 操作配置 */
  actions?: BookingListAction[];
}

/**
 * 预约列表操作
 */
export interface BookingListAction {
  /** 操作标签 */
  label: string;
  /** 操作类型 */
  type: 'view' | 'edit' | 'cancel' | 'confirm';
  /** 点击回调 */
  onClick: (booking: BookingRecord) => void;
  /** 是否显示 */
  visible?: (booking: BookingRecord) => boolean;
  /** 是否禁用 */
  disabled?: (booking: BookingRecord) => boolean;
}

/**
 * 分页Props
 */
export interface PaginationProps {
  /** 当前页 */
  currentPage: number;
  /** 总页数 */
  totalPages: number;
  /** 每页数量 */
  pageSize: number;
  /** 总数 */
  total: number;
  /** 页码变更回调 */
  onPageChange: (page: number) => void;
  /** 每页数量变更回调 */
  onPageSizeChange: (size: number) => void;
  /** 是否显示每页数量选择器 */
  showSizeChanger?: boolean;
  /** 每页数量选项 */
  pageSizeOptions?: number[];
}

// ==================== 状态组件类型 ====================

/**
 * 状态徽章Props
 */
export interface StatusBadgeProps extends BaseComponentProps {
  /** 状态值 */
  status: string;
  /** 状态配置 */
  statusConfig: StatusConfig;
  /** 是否显示文本 */
  showText?: boolean;
  /** 是否显示图标 */
  showIcon?: boolean;
}

/**
 * 状态配置
 */
export interface StatusConfig {
  /** 显示文本 */
  text: string;
  /** 颜色 */
  color: string;
  /** 图标 */
  icon?: ReactNode;
  /** 背景色 */
  backgroundColor?: string;
  /** 边框色 */
  borderColor?: string;
}

/**
 * 加载指示器Props
 */
export interface LoadingIndicatorProps extends BaseComponentProps {
  /** 加载文本 */
  text?: string;
  /** 大小 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** 颜色 */
  color?: string;
  /** 是否覆盖整个容器 */
  overlay?: boolean;
}

// ==================== 工具类型 ====================

/**
 * 组件尺寸
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * 组件变体
 */
export type ComponentVariant = 'filled' | 'outline' | 'light' | 'subtle' | 'transparent';

/**
 * 组件颜色
 */
export type ComponentColor = 
  | 'blue' | 'cyan' | 'teal' | 'green' | 'lime' | 'yellow' | 'orange' | 'red' 
  | 'pink' | 'grape' | 'violet' | 'indigo' | 'gray' | 'dark';

/**
 * 组件位置
 */
export type ComponentPosition = 'left' | 'right' | 'top' | 'bottom' | 'center';

/**
 * 组件对齐
 */
export type ComponentAlign = 'left' | 'center' | 'right' | 'justify';

/**
 * 组件方向
 */
export type ComponentDirection = 'horizontal' | 'vertical';

// ==================== 事件处理器类型 ====================

/**
 * 点击事件处理器
 */
export type ClickHandler<T = any> = (data: T) => void;

/**
 * 变更事件处理器
 */
export type ChangeHandler<T = any> = (value: T) => void;

/**
 * 提交事件处理器
 */
export type SubmitHandler<T = any> = (data: T) => void;

/**
 * 错误事件处理器
 */
export type ErrorHandler = (error: Error) => void;

/**
 * 成功事件处理器
 */
export type SuccessHandler<T = any> = (data: T) => void;
