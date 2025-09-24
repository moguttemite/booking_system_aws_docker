# 类型定义文档

本文档描述了项目中所有类型定义的结构和使用方法。

## 📁 文件结构

```
types/
├── index.ts          # 核心类型定义
├── booking.ts        # 预约系统相关类型
├── components.ts     # 组件相关类型
└── README.md         # 本文档
```

## 🎯 核心类型

### 用户相关类型

```typescript
// 用户角色
type UserRole = 'admin' | 'teacher' | 'student';

// 用户基础信息
interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

// 用户详细信息
interface UserProfile extends User {
  phone?: string;
  bio?: string;
  profile_image?: string | null;
  created_at?: string;
  updated_at?: string;
}
```

### 讲座相关类型

```typescript
// 讲座状态
type LectureStatus = 'pending' | 'approved' | 'rejected';

// 讲座基础信息
interface Lecture {
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
```

### 预约相关类型

```typescript
// 预约状态
type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired';

// 预约记录
interface BookingRecord {
  id: number;
  user_id: number;
  lecture_id: number;
  teacher_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  is_expired?: boolean;
}
```

## 🧩 组件类型

### 基础组件类型

```typescript
// 基础组件Props
interface BaseComponentProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  visible?: boolean;
  testId?: string;
}

// 加载状态Props
interface LoadingProps extends BaseComponentProps {
  loading: boolean;
  loadingText?: string;
  error?: string | null;
  onRetry?: () => void;
}

// 模态框Props
interface ModalProps extends BaseComponentProps {
  opened: boolean;
  onClose: () => void;
  title?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
}
```

### 业务组件类型

```typescript
// 讲师卡片Props
interface TeacherCardProps extends BaseComponentProps {
  lectureId: number;
  lectureTitle?: string;
  lectureDescription?: string;
  teacherName?: string;
  teacherImage?: string | null;
  onClick?: (lectureId: number) => void;
  hoverable?: boolean;
  shadow?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'none';
}

// 时间安排模态框Props
interface ScheduleModalProps extends BaseComponentProps {
  opened: boolean;
  onClose: () => void;
  lecture: BookableTeacher | null;
  disabled?: boolean;
  className?: string;
  onSuccess?: (schedules: LectureScheduleRecord[]) => void;
  onError?: (error: string) => void;
}
```

## 🔧 工具类型

### 通用工具类型

```typescript
// 可选字段类型
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 必需字段类型
type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// 部分更新类型
type PartialUpdate<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;
```

### 时间相关类型

```typescript
// 时间范围
interface TimeRange {
  start: string;
  end: string;
}

// 日期范围
interface DateRange {
  start: string;
  end: string;
}

// 时间冲突信息
interface TimeConflict {
  type: 'overlap' | 'adjacent' | 'duplicate';
  time: TimeRange;
  description: string;
  conflicting_booking_id?: number;
}
```

## 📝 使用指南

### 1. 导入类型

```typescript
// 导入核心类型
import type { User, Lecture, BookingRecord } from '@/types';

// 导入组件类型
import type { TeacherCardProps, ScheduleModalProps } from '@/types/components';

// 导入预约相关类型
import type { BookableTeacher, TimeRange } from '@/types/booking';
```

### 2. 组件类型使用

```typescript
// 使用组件Props类型
const TeacherCard: React.FC<TeacherCardProps> = ({ 
  lectureId, 
  lectureTitle, 
  onClick 
}) => {
  // 组件实现
};

// 使用状态类型
const [user, setUser] = useState<User | null>(null);
const [bookings, setBookings] = useState<BookingRecord[]>([]);
```

### 3. API响应类型

```typescript
// 使用API响应类型
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// 使用分页响应类型
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
}
```

## 🎨 类型设计原则

### 1. 一致性
- 所有类型定义都遵循相同的命名约定
- 使用统一的注释格式
- 保持类型结构的一致性

### 2. 可扩展性
- 使用接口继承来扩展基础类型
- 提供可选字段以支持不同的使用场景
- 使用泛型来创建可重用的类型

### 3. 类型安全
- 使用严格的类型定义
- 避免使用 `any` 类型
- 提供完整的类型覆盖

### 4. 文档化
- 为所有类型添加详细的注释
- 说明每个字段的用途和约束
- 提供使用示例

## 🔍 类型检查

### 启用严格模式

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### 类型断言

```typescript
// 安全的类型断言
const user = data as User;

// 类型守卫
function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'number' && typeof obj.name === 'string';
}
```

## 🚀 最佳实践

### 1. 类型定义
- 优先使用接口而不是类型别名
- 使用描述性的名称
- 添加必要的注释

### 2. 组件类型
- 继承基础组件类型
- 提供合理的默认值
- 使用可选字段来支持不同的使用场景

### 3. API类型
- 为所有API响应定义类型
- 使用泛型来创建可重用的响应类型
- 提供错误处理类型

### 4. 状态管理
- 为所有状态定义类型
- 使用联合类型来表示不同的状态
- 提供状态转换类型

## 📚 相关资源

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [React TypeScript 指南](https://react-typescript-cheatsheet.netlify.app/)
- [Mantine UI 类型定义](https://mantine.dev/guides/typescript/)
