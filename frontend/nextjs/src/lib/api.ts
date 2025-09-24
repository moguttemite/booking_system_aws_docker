import { BookableTeacher } from "@/types/booking";
import { handleApiAuthError } from "./sessionManager";
import { handleApiError, handleNetworkError, handleAuthError } from "./apiErrorHandler";
import type {
  User,
  UserUpdateData,
  UserBooking,
  UserBookingsResponse,
  UserProfile,
  TeacherProfile,
  TeacherProfileUpdateData,
  TeacherProfileUpdateResponse,
  Lecture,
  LectureCreateData,
  LectureUpdateData,
  LectureApprovalUpdateData,
  MultiLecture,
  LectureScheduleRecord,
  LectureScheduleResponse,
  LectureBookingResponse,
  BookingCreateData,
  CarouselItem,
  CarouselManagementItem,
  ApiResponse
} from "@/types";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// 获取可预约讲座列表 - 后端API
export const fetchBookableLectures = async (): Promise<BookableTeacher[]> => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/lectures/`);
    if (!res.ok) {
      throw new Error('講座データの取得に失敗しました');
    }
    
    return await res.json();
  } catch (error) {
    handleNetworkError(error, 'fetchBookableLectures');
  }
};


// 获取多讲师讲座列表 - 后端API
export const fetchMultiTeacherLectures = async (): Promise<any[]> => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/lectures/`);
    if (!res.ok) {
      throw new Error('講座データの取得に失敗しました');
    }
    
    const allLectures = await res.json();
    // 过滤出多讲师讲座
    const multiTeacherLectures = allLectures.filter((lecture: any) => lecture.is_multi_teacher === true);
    
    return multiTeacherLectures;
  } catch (error) {
    console.error('多讲师講座データ取得エラー:', error);
    throw new Error('多讲师講座データの取得に失敗しました');
  }
};

// 创建多讲师讲座 - 后端API
export const createMultiTeacherLecture = async (
  lectureData: {
    lecture_title: string;
    lecture_description: string;
    teacher_id: number;
    is_multi_teacher: boolean;
  },
  token: string
): Promise<{
  message: string;
  lecture_id: number;
  lecture_title: string;
  approval_status: string;
  created_at: string;
}> => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/lectures`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(lectureData)
    });

    if (!res.ok) {
      if (handleApiAuthError(res, token)) {
        throw new Error("セッションが期限切れです。再度ログインしてください。");
      }
      throw new Error('講座の作成に失敗しました');
    }

    return await res.json();
  } catch (error) {
    console.error('講座作成エラー:', error);
    throw error;
  }
};

// 为多讲师讲座添加讲师 - 后端API
export const addTeacherToLecture = async (
  lectureId: number,
  teacherId: number,
  token: string
): Promise<{
  message: string;
  lecture_id: number;
  affected_teacher_id: number;
}> => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/lectures/${lectureId}/teachers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ teacher_id: teacherId })
    });

    if (!res.ok) {
      if (handleApiAuthError(res, token)) {
        throw new Error("セッションが期限切れです。再度ログインしてください。");
      }
      throw new Error('講師の追加に失敗しました');
    }

    return await res.json();
  } catch (error) {
    console.error('講師追加エラー:', error);
    throw error;
  }
};

// 更新多讲师讲座信息 - 后端API
export const updateMultiTeacherLecture = async (
  lectureId: number,
  lectureData: {
    lecture_title: string;
    lecture_description: string;
  },
  token: string
): Promise<{
  message: string;
  lecture_id: number;
}> => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/lectures/${lectureId}/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(lectureData)
    });

    if (!res.ok) {
      if (handleApiAuthError(res, token)) {
        throw new Error("セッションが期限切れです。再度ログインしてください。");
      }
      throw new Error('講座の更新に失敗しました');
    }

    return await res.json();
  } catch (error) {
    console.error('講座更新エラー:', error);
    throw error;
  }
};

// 获取多讲师讲座的讲师列表 - 后端API
export const fetchMultiTeacherLectureTeachers = async (
  lectureId: number,
  token: string
): Promise<{ teacher_id: number; teacher_name: string }[]> => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/lectures/${lectureId}/teachers`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      if (handleApiAuthError(res, token)) {
        throw new Error("セッションが期限切れです。再度ログインしてください。");
      }
      throw new Error('講師データの取得に失敗しました');
    }

    return await res.json();
  } catch (error) {
    console.error('講師データ取得エラー:', error);
    throw error;
  }
};

// 删除多讲师讲座中的讲师 - 后端API
export const removeTeacherFromLecture = async (
  lectureId: number,
  teacherId: number,
  token: string
): Promise<{
  message: string;
  lecture_id: number;
  affected_teacher_id: number | null;
}> => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/lectures/${lectureId}/teachers/${teacherId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      if (handleApiAuthError(res, token)) {
        throw new Error("セッションが期限切れです。再度ログインしてください。");
      }
      throw new Error('講師の削除に失敗しました');
    }

    return await res.json();
  } catch (error) {
    console.error('講師削除エラー:', error);
    throw error;
  }
};

// 更新多讲师讲座的讲师配置 - 后端API
export const updateMultiTeacherLectureTeachers = async (
  lectureId: number,
  teacherIds: number[],
  token: string
): Promise<{
  message: string;
  lecture_id: number;
  updated_teachers: number[];
}> => {
  try {
    // 第一步：获取当前讲师列表
    const currentTeachers = await fetchMultiTeacherLectureTeachers(lectureId, token);
    const currentTeacherIds = currentTeachers.map(t => t.teacher_id);

    // 第二步：删除不在新列表中的讲师（除了第一个讲师，因为它是主讲师）
    const teachersToRemove = currentTeacherIds.filter((id, index) => 
      index > 0 && !teacherIds.includes(id)
    );
    for (const teacherId of teachersToRemove) {
      await removeTeacherFromLecture(lectureId, teacherId, token);
    }

    // 第三步：添加新的讲师
    const teachersToAdd = teacherIds.filter(id => !currentTeacherIds.includes(id));
    for (const teacherId of teachersToAdd) {
      await addTeacherToLecture(lectureId, teacherId, token);
    }

    return {
      message: "講師配置を更新しました",
      lecture_id: lectureId,
      updated_teachers: teacherIds
    };
  } catch (error) {
    console.error('講師配置更新エラー:', error);
    throw error;
  }
};

// 轮播图管理相关API

// 获取轮播图管理列表 - 后端API
export const fetchCarouselManagementList = async (token: string): Promise<{
  lecture_id: number;
  lecture_title: string;
  display_order: number;
  is_active: boolean;
}[]> => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/lectures/carousel/management`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      if (handleApiAuthError(res, token)) {
        throw new Error("セッションが期限切れです。再度ログインしてください。");
      }
      throw new Error('輪播図管理データの取得に失敗しました');
    }

    return await res.json();
  } catch (error) {
    console.error('輪播図管理データ取得エラー:', error);
    throw error;
  }
};

// 获取所有已批准的讲座 - 后端API
export const fetchApprovedLectures = async (): Promise<{
  id: number;
  lecture_title: string;
  teacher_name: string;
  teacher_image: string;
  lecture_description: string;
  approval_status: string;
}[]> => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/lectures/`);

    if (!res.ok) {
      throw new Error('講座データの取得に失敗しました');
    }

    const allLectures = await res.json();
    // 筛选已批准的讲座
    const approvedLectures = allLectures.filter((lecture: any) => 
      lecture.approval_status === 'approved'
    );

    return approvedLectures.map((lecture: any) => ({
      id: lecture.id,
      lecture_title: lecture.lecture_title,
      teacher_name: lecture.teacher_name,
      teacher_image: lecture.teacher_image || '/default_avatar.png',
      lecture_description: lecture.lecture_description,
      approval_status: lecture.approval_status
    }));
  } catch (error) {
    console.error('講座データ取得エラー:', error);
    throw error;
  }
};

// 批量更新轮播图配置 - 后端API
export const updateCarouselBatch = async (
  carouselList: {
    lecture_id: number;
    display_order: number;
    is_active: boolean;
  }[],
  token: string
): Promise<{
  message: string;
  updated_count: number;
}> => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/lectures/carousel/batch`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        carousel_list: carouselList
      })
    });

    if (!res.ok) {
      if (handleApiAuthError(res, token)) {
        throw new Error("セッションが期限切れです。再度ログインしてください。");
      }
      throw new Error('輪播図設定の更新に失敗しました');
    }

    return await res.json();
  } catch (error) {
    console.error('輪播図設定更新エラー:', error);
    throw error;
  }
};

// 获取轮播图显示数据 - 后端API（前端显示用，无需认证）
export const fetchCarouselDisplayData = async (): Promise<{
  lecture_id: number;
  lecture_title: string;
  lecture_description: string;
  teacher_name: string;
  teacher_image: string | null;
  display_order: number;
}[]> => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/lectures/carousel`);

    if (!res.ok) {
      throw new Error('輪播図データの取得に失敗しました');
    }

    return await res.json();
  } catch (error) {
    console.error('輪播図データ取得エラー:', error);
    throw error;
  }
};

// 获取多讲师讲座的所有讲师
export const fetchLectureTeachersByLectureId = async (lectureId: number): Promise<{ teacher_id: number; teacher_name: string }[]> => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/lectures/${lectureId}/teachers`);
    if (!res.ok) {
      throw new Error('講師データの取得に失敗しました');
    }
    
    const data = await res.json();
    
    // 验证返回数据的结构
    if (!Array.isArray(data)) {
      console.warn('API返回的数据不是数组:', data);
      return [];
    }
    
    // 记录原始数据用于调试
    console.log('API返回的原始讲师数据:', data);
    
    // 直接返回后端数据结构，不做转换
    return data;
  } catch (error) {
    console.error('講師データ取得エラー:', error);
    throw new Error('講師データの取得に失敗しました');
  }
};

// Login API
// 发送登录请求，返回用户信息和访问令牌
// data: { email: string, password: string }
// 返回: { id: number, name: string, role: string, token: string }
export async function loginApi(data: { email: string; password: string }) {
  const res = await fetch(`${API_BASE}/api/v1/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "ログインに失敗しました");
  }
  return await res.json(); // { id, name, role, token }
}

// 用户信息管理相关API



// 获取指定用户信息（通过用户ID）
export async function fetchUserById(userId: number, token: string): Promise<User> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/users/${userId}`, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      // 检查是否是认证问题
      if (handleApiAuthError(res, token)) {
        throw new Error("セッションが期限切れです。再度ログインしてください。");
      }
      
      const errorData = await res.json();
      throw new Error(errorData.detail || "ユーザー情報の取得に失敗しました");
    }

    return await res.json();
  } catch (error) {
    handleAuthError(error, 'fetchUserById');
  }
}

// 更新当前用户信息
export async function updateCurrentUser(
  updateData: UserUpdateData, 
  token: string,
  userId: number
): Promise<User> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || "ユーザー情報の更新に失敗しました");
    }

    return await res.json();
  } catch (error) {
    console.error("ユーザー情報更新エラー:", error);
    throw error;
  }
}

// 更新用户资料（新的API端点）
export async function updateUserProfile(
  updateData: { name: string },
  token: string
): Promise<{ message: string; updated_fields: string[] }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/users/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || "ユーザー资料の更新に失敗しました");
    }

    return await res.json();
  } catch (error) {
    console.error("ユーザー资料更新エラー:", error);
    throw error;
  }
}

// 修改密码
// 密码修改相关类型已移至 types/index.ts

export async function changePassword(
  passwordData: { current_password: string; new_password: string },
  token: string
): Promise<{ message: string; success?: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/users/password`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(passwordData)
    });

    if (!res.ok) {
      const errorData = await res.json();
      // 改进错误处理：直接返回错误信息，不抛出异常
      const errorMessage = errorData.detail || "パスワードの変更に失敗しました";
      return {
        message: errorMessage,
        success: false
      };
    }

    const responseData = await res.json();
    return {
      ...responseData,
      success: true
    };
  } catch (error) {
    console.error("パスワード変更エラー:", error);
    // 网络错误等异常情况仍然抛出
    throw error;
  }
}




// 后端返回的某讲座的可预约时间（保留用于其他功能）
export type LectureScheduleResponseOld = {
  id: number;
  lecture_id: number;
  teacher_id: number;
  lecture_title: string;
  teacher_name: string;
  booking_date: string;     // 后端返回的字段名
  start_time: string;       // 后端返回的格式 "HH:MM:SS"
  end_time: string;         // 后端返回的格式 "HH:MM:SS"
  created_at: string;       // ISO datetime string
};

// 预约功能专用的简化类型
export type AvailableTimeRecord = {
  booking_date: string;     // "YYYY-MM-DD"
  start_time: string;       // "HH:MM"
  end_time: string;         // "HH:MM"
};

export type BookedTimeRecord = {
  booking_date: string;     // "YYYY-MM-DD"
  start_time: string;       // "HH:MM"
  end_time: string;         // "HH:MM"
};

// 获取讲座可预约时间 - 用于预约功能 - 原始的可预约时间
export const fetchLectureSchedulesOld = async (
  lectureId: number
): Promise<AvailableTimeRecord[]> => {
  try {
    // 暂时使用旧的API端点，直到新的端点完全实现
    const url = `${API_BASE}/api/v1/schedules/?lecture_id=${lectureId}`;
    const res = await fetch(url);
  if (!res.ok) {
    throw new Error('スケジュールの取得に失敗しました');
  }
    const data: LectureScheduleResponseOld[] = await res.json();
    
    // 转换为 AvailableTimeRecord 格式
    return data.map(item => ({
      booking_date: item.booking_date,
      start_time: item.start_time.substring(0, 5), // 从 "HH:MM:SS" 转换为 "HH:MM"
      end_time: item.end_time.substring(0, 5)     // 从 "HH:MM:SS" 转换为 "HH:MM"
    }));
  } catch (error) {
    console.error('スケジュール取得エラー:', error);
    throw error;
  }
};

// 获取讲座已预约时间 - 用于预约功能  - 已经被预约的时间
export const fetchLectureReservations = async (
  lectureId: number
): Promise<BookedTimeRecord[]> => {
  try {
    // 暂时使用旧的API端点，直到新的端点完全实现
    const url = `${API_BASE}/api/v1/bookings/lecture/${lectureId}/booked-times`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('予約データの取得に失敗しました');
    }
    const data: BookedTimeRecord[] = await res.json();
    return data;
  } catch (error) {
    console.error('予約データ取得エラー:', error);
    throw error;
  }
};

// 用户提交预约 -> lecture_reservations
export type ReservationPayload = {
  user_id: number;
  lecture_id: number;
  teacher_id?: number; // 讲师ID - 可选字段
  reserved: string;     // e.g. "2025-07-28"
  start_time: string;   // e.g. "11:00"
  end_time: string;     // e.g. "12:00"
};

// 获取预约记录表中的数据
export type SimplifiedReservationRecord = {
  user_id: number;
  lecture_id: number;
  teacher_id: number;     // 讲师ID - 预约的讲师唯一标识
  status: string;
  reserved_date: string;
  start_time: string;
  end_time: string;
};


// 提交预约
// 返回 { success: boolean, message?: string }
export const submitLectureReservation  = async (
    payload: ReservationPayload
  ): Promise<{ success: boolean; message?: string }> => {
  try {
    // 模拟读取 lecture_reservations.json
    const res = await fetch('/lecture_reservations.json');
    const existing: SimplifiedReservationRecord[] = await res.json();

    // 检查是否已存在相同的预约记录
    const newRecord: SimplifiedReservationRecord = {
      user_id: payload.user_id,
      lecture_id: payload.lecture_id,
      teacher_id: payload.teacher_id || 0, // 添加讲师ID，如果没有则默认为0
      status: 'reserved',
      reserved_date: payload.reserved,
      start_time: payload.start_time,
      end_time: payload.end_time,
    };

    const updated = [...existing, newRecord];

    // 模拟写入（真实环境下用 POST 替代）
    console.log('✅ 新しい予約:', newRecord);
    console.log('📄 lecture_reservations.json を更新:', updated);

    return { success: true };
  } catch (error) {
    console.error('❌ 予約登録エラー:', error);
    return { success: false, message: '予約登録に失敗しました。' };
  }
};



/**
 * 获取特定讲座的所有已被预约的时间段
 */
export const fetchReservedLectureSchedules = async (
  lectureId: number
): Promise<BookedTimeRecord[]> => {
  try {
    const res = await fetch("/lecture_reservations.json");

    if (!res.ok) {
      throw new Error("予約データの取得に失敗しました");
    }

    const data: SimplifiedReservationRecord[] = await res.json();

    // 筛选指定 lecture_id 的预约记录
    const filtered = data.filter(
      (record) => record.lecture_id === lectureId && record.status === "reserved"
    );

    // 映射为 BookedTimeRecord 格式
    const schedules: BookedTimeRecord[] = filtered.map((record) => ({
      booking_date: record.reserved_date,
      start_time: record.start_time,
      end_time: record.end_time,
    }));

    return schedules;
  } catch (error) {
    console.error("予約済み時間の取得エラー:", error);
    return [];
  }
};



// 讲师页面所需要的API
// 获取当前用户的 teacher_id
export const fetchMyTeacherProfile = async (teacherName: string, token?: string): Promise<{ teacher_id: number }> => {
  try {
    // 如果没有传入 token，尝试从 localStorage 获取
    let authToken = token;
    if (!authToken) {
      const authStorage = localStorage.getItem("auth-storage");
      if (!authStorage) {
        throw new Error("認証トークンが見つかりません");
      }
      
      const authData = JSON.parse(authStorage);
      authToken = authData.state?.token;
      
      if (!authToken) {
        throw new Error("認証トークンが見つかりません");
      }
    }

    // 从后端获取所有讲师信息
    const teachers = await fetchPublicTeachers();
    
    // 根据用户名查找对应的讲师
    const teacher = teachers.find(t => t.name === teacherName);
    
    if (!teacher) {
      // 如果找不到对应的讲师，尝试使用用户ID查找
      // 从auth storage中获取用户ID
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        const authData = JSON.parse(authStorage);
        const userId = authData.state?.user?.id;
        
        if (userId) {
          const teacherById = teachers.find(t => t.id === userId);
          if (teacherById) {
            console.log(`ユーザーID ${userId} で講師を見つけました: ${teacherById.name}`);
            return { teacher_id: teacherById.id };
          }
        }
      }
      
      throw new Error(`講師 "${teacherName}" が見つかりません`);
    }
    
    return { teacher_id: teacher.id };
    
  } catch (error) {
    console.error("講師情報取得エラー:", error);
    throw new Error("講師情報の取得に失敗しました");
  }
};


// 模拟 POST 写入 lecture
export const appendBookableLecture = async (lecture: BookableTeacher) => {
  const res = await fetch('/api/bookable/append', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lecture),
  });

  if (!res.ok) {
    throw new Error('講座登録に失敗しました');
  }

  return await res.json();
};




// 获取后端用户列表
export async function fetchAllUsers(token: string): Promise<User[]> {
  try {
    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const res = await fetch(`${API_BASE}/api/v1/users/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
      signal: controller.signal
  });
    
    clearTimeout(timeoutId);
    
  if (!res.ok) {
      if (handleApiAuthError(res, token)) {
        throw new Error("セッションが期限切れです。再度ログインしてください。");
  }
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "ユーザー一覧の取得に失敗しました");
    }
    
  return await res.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('リクエストがタイムアウトしました。再度お試しください。');
    }
    console.error('ユーザー一覧取得エラー:', error);
    throw error;
  }
}

// 获取所有讲师
export async function fetchAllTeachers(token: string): Promise<User[]> {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9000";
    if (!API_BASE) {
      throw new Error("API_BASE environment variable is not set");
    }
    
    console.log("Making request to:", `${API_BASE}/users/all-teachers`);
    
    const res = await fetch(`${API_BASE}/users/all-teachers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    
    console.log("Response status:", res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("API Error Response:", errorText);
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    
    const data = await res.json();
    console.log("Received teachers data:", data);
    return data;
  } catch (error) {
    console.error("fetchAllTeachers error:", error);
    throw new Error("講師一覧の取得に失敗しました");
  }
}

// 讲师类型定义
export type TeacherType = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  profile_image?: string;
};

// 获取所有讲师（公开端点，不需要认证）
export async function fetchPublicTeachers(): Promise<TeacherType[]> {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    if (!API_BASE) {
      throw new Error("API_BASE environment variable is not set");
    }
    
    const res = await fetch(`${API_BASE}/api/v1/teachers/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("API Error Response:", errorText);
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("fetchPublicTeachers error:", error);
    throw new Error("講師一覧の取得に失敗しました");
  }
}

// 讲座管理相关类型定义
export type LectureListType = {
  id: number;
  lecture_title: string;
  lecture_description?: string;
  approval_status: string;
  teacher_name: string;
  teacher_id: number;
  is_multi_teacher: boolean;
  created_at: string;
  updated_at?: string;
};

// 类型定义已移至 types/index.ts

// 获取所有讲座（公开端点，不需要认证）
export async function fetchAllLectures(): Promise<LectureListType[]> {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    if (!API_BASE) {
      throw new Error("API_BASE environment variable is not set");
    }
    
    const res = await fetch(`${API_BASE}/api/v1/lectures/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("API Error Response:", errorText);
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("fetchAllLectures error:", error);
    throw new Error("講座一覧の取得に失敗しました");
  }
}

// 更新讲座信息（管理员）
export async function updateLecture(
  lectureId: number,
  updateData: LectureUpdateData,
  token: string
): Promise<{ message: string }> {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    if (!API_BASE) {
      throw new Error("API_BASE environment variable is not set");
    }
    
    const res = await fetch(`${API_BASE}/api/v1/lectures/${lectureId}/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });
    
    if (!res.ok) {
      if (handleApiAuthError(res, token)) {
        throw new Error("セッションが期限切れです。再度ログインしてください。");
      }
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "講座の更新に失敗しました");
    }
    
    return await res.json();
  } catch (error) {
    console.error("updateLecture error:", error);
    throw error;
  }
}

// 更新讲座审批状态（管理员）
export async function updateLectureApproval(
  lectureId: number,
  approvalData: LectureApprovalUpdateData,
  token: string
): Promise<{ message: string }> {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    if (!API_BASE) {
      throw new Error("API_BASE environment variable is not set");
    }
    
    const res = await fetch(`${API_BASE}/api/v1/lectures/${lectureId}/approval`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(approvalData),
    });
    
    if (!res.ok) {
      if (handleApiAuthError(res, token)) {
        throw new Error("セッションが期限切れです。再度ログインしてください。");
      }
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "承認状況の更新に失敗しました");
    }
    
    return await res.json();
  } catch (error) {
    console.error("updateLectureApproval error:", error);
    throw error;
  }
}

// 删除讲座（管理员）
export async function deleteLecture(
  lectureId: number,
  token: string
): Promise<{ title: string; message: string }> {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    if (!API_BASE) {
      throw new Error("API_BASE environment variable is not set");
    }
    
    const res = await fetch(`${API_BASE}/api/v1/lectures/${lectureId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    
    if (!res.ok) {
      if (handleApiAuthError(res, token)) {
        throw new Error("セッションが期限切れです。再度ログインしてください。");
      }
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "講座の削除に失敗しました");
    }
    
    return await res.json();
  } catch (error) {
    console.error("deleteLecture error:", error);
    throw error;
  }
}

// 获取讲座-讲师对应关系
export type LectureTeacherRecord = {
  lecture_id: number;
  teacher_ids: number[];
};

export async function fetchLectureTeachers(): Promise<LectureTeacherRecord[]> {
  const res = await fetch('/lecture_teachers.json');
  if (!res.ok) {
    throw new Error("講座-講師対応データの取得に失敗しました");
  }
  
  const rawData = await res.json();
  console.log("Raw lecture_teachers data:", rawData);
  
  // 将原始数据转换为LectureTeacherRecord格式
  // 原始数据格式: [{lecture_id: 1, teacher_ids: 8}, {lecture_id: 1, teacher_ids: 9}]
  // 目标格式: [{lecture_id: 1, teacher_ids: [8, 9]}]
  
  const lectureMap = new Map<number, number[]>();
  
  rawData.forEach((item: any) => {
    const lectureId = item.lecture_id;
    const teacherId = item.teacher_ids;
    
    if (!lectureMap.has(lectureId)) {
      lectureMap.set(lectureId, []);
    }
    lectureMap.get(lectureId)!.push(teacherId);
  });
  
  const result: LectureTeacherRecord[] = Array.from(lectureMap.entries()).map(([lectureId, teacherIds]) => ({
    lecture_id: lectureId,
    teacher_ids: teacherIds
  }));
  
  console.log("Converted lecture_teachers data:", result);
  return result;
}

// 更新讲座-讲师对应关系
export async function updateLectureTeachers(lectureId: number, teacherIds: number[]): Promise<void> {
  try {
    console.log("Updating lecture teachers via API:", { lectureId, teacherIds });
    
    const response = await fetch('/api/lecture-teachers', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lectureId,
        teacherIds
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log("Lecture teachers updated successfully:", result);
    
  } catch (error) {
    console.error("講座-講師対応更新エラー:", error);
    throw new Error("講座-講師対応の更新に失敗しました");
  }
}



// 讲师资料相关类型定义已移至 types/index.ts

// 获取讲师详情（返回后端提供的所有数据）
export const fetchTeacherProfile = async (teacherId: number): Promise<TeacherProfile> => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/teachers/${teacherId}`, {
      method: "GET",
      headers: {
        "accept": "application/json"
      }
    });
    
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('指定された講師が見つかりません');
      }
      throw new Error('講師プロフィールの取得に失敗しました');
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('講師プロフィール取得エラー:', error);
    throw error;
  }
};

// 讲师资料更新相关类型已移至 types/index.ts

// 更新讲师资料
export const updateTeacherProfile = async (
  teacherId: number,
  updateData: TeacherProfileUpdateData,
  token: string
): Promise<TeacherProfileUpdateResponse> => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/teachers/${teacherId}/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    if (!res.ok) {
      // 检查是否是认证问题
      if (handleApiAuthError(res, token)) {
        throw new Error("セッションが期限切れです。再度ログインしてください。");
      }
      
      const errorData = await res.json();
      throw new Error(errorData.detail || "講師プロフィールの更新に失敗しました");
    }

    return await res.json();
  } catch (error) {
    console.error("講師プロフィール更新エラー:", error);
    throw error;
  }
};

// 讲座创建相关类型定义
// 类型定义已移至 types/index.ts

export type LectureCreateResponse = {
  message: string;
  lecture_id: number;
  lecture_title: string;
  approval_status: string;
  created_at: string;
};

// 创建讲座
export const createLecture = async (
  lectureData: LectureCreateData,
  token: string
): Promise<LectureCreateResponse> => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/lectures/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(lectureData)
    });

    if (!res.ok) {
      // 检查是否是认证问题
      if (handleApiAuthError(res, token)) {
        throw new Error("セッションが期限切れです。再度ログインしてください。");
      }
      
      const errorData = await res.json();
      throw new Error(errorData.detail || "講座の作成に失敗しました");
    }

    return await res.json();
  } catch (error) {
    console.error("講座作成エラー:", error);
    throw error;
  }
};

// 取消预约响应类型
export type CancelBookingResponse = {
  message: string;
  booking_id: number;
};

// 取消预约
export async function cancelBooking(bookingId: number, token: string): Promise<CancelBookingResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/bookings/cancel/${bookingId}`, {
      method: "PUT",
      headers: {
        "accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      // 检查是否是认证问题
      if (handleApiAuthError(res, token)) {
        throw new Error("セッションが期限切れです。再度ログインしてください。");
      }
      
      const errorData = await res.json();
      throw new Error(errorData.detail || "予約のキャンセルに失敗しました");
    }

    return await res.json();
  } catch (error) {
    console.error("予約キャンセルエラー:", error);
    throw error;
  }
}

// 获取用户预约信息
export async function fetchUserBookings(token: string): Promise<UserBookingsResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/bookings/my-bookings`, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      // 检查是否是认证问题
      if (handleApiAuthError(res, token)) {
        throw new Error("セッションが期限切れです。再度ログインしてください。");
      }
      
      const errorData = await res.json();
      throw new Error(errorData.detail || "予約情報の取得に失敗しました");
    }

    return await res.json();
  } catch (error) {
    console.error("予約情報取得エラー:", error);
    throw error;
  }
}

// 讲师讲座管理相关API
// 获取当前讲师的所有讲座
export type TeacherLecturesResponse = {
  message: string;
  total_count: number;
  lectures: BookableTeacher[];
};

export async function fetchMyLectures(token: string): Promise<TeacherLecturesResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/lectures/my-lectures`, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      // 检查是否是认证问题
      if (handleApiAuthError(res, token)) {
        throw new Error("セッションが期限切れです。再度ログインしてください。");
      }
      
      const errorData = await res.json();
      throw new Error(errorData.detail || "講座一覧の取得に失敗しました");
    }

    return await res.json();
  } catch (error) {
    console.error("講座一覧取得エラー:", error);
    throw error;
  }
}

// ==================== 讲座时间安排相关API ====================

// 后端响应类型
// 类型定义已移至 types/index.ts

// ==================== 讲座预约相关API ====================

// 讲座预约响应类型已移至 types/index.ts

// 前端使用类型
// 类型定义已移至 types/index.ts

// 数据转换函数
export const convertScheduleResponse = (response: LectureBookingResponse[]): LectureScheduleRecord[] => {
  return response.map(schedule => ({
    id: schedule.id,
    lecture_id: schedule.lecture_id,
    teacher_id: schedule.teacher_id,
    available_date: schedule.booking_date,
    start_time: schedule.start_time.substring(0, 5), // "10:00:00" → "10:00"
    end_time: schedule.end_time.substring(0, 5),     // "20:00:00" → "20:00"
    is_available: !schedule.is_expired,
    created_at: schedule.created_at,
    updated_at: schedule.created_at // 使用created_at作为updated_at
  }));
};

// 获取特定讲座的时间安排
export const fetchLectureSchedules = async (lectureId: number): Promise<LectureScheduleRecord[]> => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/schedules/lecture/${lectureId}`, {
      method: "GET",
      headers: {
        "accept": "application/json"
      }
    });
    
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('指定された講座が見つかりません');
      }
      throw new Error('時間枠の取得に失敗しました');
    }
    
    const responseData: LectureBookingResponse[] = await res.json();
    
    // 如果返回空数组，直接返回空数组
    if (!responseData || responseData.length === 0) {
      return [];
    }
    
    return convertScheduleResponse(responseData);
  } catch (error) {
    console.error('講座時間枠取得エラー:', error);
    throw error;
  }
};

// 创建时间安排
export const createLectureSchedules = async (
  schedules: LectureScheduleRecord[],
  token: string
): Promise<{ success: boolean; message: string; created_count?: number }> => {
  try {
    // 转换数据格式为后端期望的格式
    const backendSchedules = schedules.map(schedule => ({
      lecture_id: schedule.lecture_id,
      teacher_id: schedule.teacher_id,
      date: schedule.available_date,
      start: schedule.start_time,
      end: schedule.end_time
    }));

    const res = await fetch(`${API_BASE}/api/v1/schedules/lecture-schedules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ schedules: backendSchedules })
    });
    
    if (!res.ok) {
      if (handleApiAuthError(res, token)) {
        throw new Error("セッションが期限切れです。再度ログインしてください。");
      }
      const errorData = await res.json();
      throw new Error(errorData.detail || "時間枠の作成に失敗しました");
    }
    
    const result = await res.json();
    return {
      success: result.success || true,
      message: result.message || "時間枠を作成しました",
      created_count: result.created_count
    };
  } catch (error) {
    console.error('時間枠作成エラー:', error);
    throw error;
  }
};

// 删除时间安排
export const deleteLectureSchedule = async (
  scheduleId: number,
  token: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/schedules/${scheduleId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      if (handleApiAuthError(res, token)) {
        throw new Error("セッションが期限切れです。再度ログインしてください。");
      }
      const errorData = await res.json();
      throw new Error(errorData.detail || "時間枠の削除に失敗しました");
    }
    
    const result = await res.json();
    return {
      success: true,
      message: result.message || "時間枠を削除しました"
    };
  } catch (error) {
    console.error('時間枠削除エラー:', error);
    throw error;
  }
};

// 获取特定讲座的预约用户列表
export const fetchLectureBookings = async (
  lectureId: number,
  token: string
): Promise<LectureBookingResponse[]> => {
  try {
    const url = `${API_BASE}/api/v1/bookings/lecture/${lectureId}`;
    
    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 5000); // 5秒超时
    
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      if (handleApiAuthError(res, token)) {
        throw new Error("セッションが期限切れです。再度ログインしてください。");
      }
      if (res.status === 404) {
        throw new Error('指定された講座が見つかりません');
      }
      throw new Error('予約一覧の取得に失敗しました');
    }
    
    const responseData: LectureBookingResponse[] = await res.json();
    return responseData;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('リクエストがタイムアウトしました。再度お試しください。');
    }
    console.error('講座予約一覧取得エラー:', error);
    throw error;
  }
};

