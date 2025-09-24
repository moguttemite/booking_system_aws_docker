import type { BookableTeacher } from "@/types/booking";

// 获取讲座状态颜色
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'approved': return 'green';
    case 'pending': return 'yellow';
    case 'rejected': return 'red';
    default: return 'gray';
  }
};

// 获取讲座状态文本
export const getStatusText = (status: string): string => {
  switch (status) {
    case 'approved': return '承認済み';
    case 'pending': return '審査中';
    case 'rejected': return '却下';
    default: return '不明';
  }
};

// 检查是否为多讲师讲座
export const isMultiTeacherLecture = (lecture: BookableTeacher): boolean => {
  return lecture.teacher_id === -1;
};

// 获取我的讲座列表 - 使用后端API
export const fetchMyLectures = async (token: string): Promise<BookableTeacher[]> => {
  try {
    // 直接导入避免循环依赖
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    
    const res = await fetch(`${API_BASE}/api/v1/lectures/my-lectures`, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || "講座一覧の取得に失敗しました");
    }

    const response = await res.json();
    return response.lectures;
  } catch (error) {
    console.error('講座一覧取得エラー:', error);
    throw error;
  }
};


// 生成时间选项
export const generateTimeOptions = (startHour: number = 10, endHour: number = 20) => {
  const options = [];
  for (let i = startHour; i <= endHour; i++) {
    options.push({
      value: i.toString(),
      label: `${i}:00`
    });
  }
  return options;
};

// 生成30分钟间隔的时间槽
export const generateTimeSlots = (startHour: number = 10, endHour: number = 19) => {
  const timeSlots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return timeSlots;
};

// 获取当前周的日期
export const getWeekDates = (weekOffset: number = 0) => {
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const start = new Date(todayMidnight);
  const day = start.getDay();
  start.setDate(start.getDate() - day + weekOffset * 7);

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    weekDates.push(current);
  }
  return weekDates;
};

// 格式化日期显示
export const formatDateDisplay = (date: Date) => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${month}/${day} (${weekdays[date.getDay()]})`;
};

// 获取当前日期字符串（YYYY-MM-DD格式）
export const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// 验证时间安排输入
export const validateScheduleInput = (
  startDate: string,
  endDate: string,
  startHour: string,
  endHour: string
): { isValid: boolean; error?: string } => {
  if (!startDate || !endDate) {
    return { isValid: false, error: '開始日と終了日を選択してください' };
  }
  
  if (new Date(endDate) < new Date(startDate)) {
    return { isValid: false, error: '終了日は開始日より後でなければなりません' };
  }
  
  if (!startHour || !endHour) {
    return { isValid: false, error: '開始時間と終了時間を選択してください' };
  }
  
  if (parseInt(endHour) <= parseInt(startHour)) {
    return { isValid: false, error: '終了時間は開始時間より遅くしてください' };
  }
  
  return { isValid: true };
};

// 检查时间冲突
export const checkTimeConflicts = (
  newDates: string[],
  currentSchedules: any[],
  lectureId: number,
  startHour: string,
  endHour: string
) => {
  const conflicts = [];
  
  for (const newDate of newDates) {
    const existingSchedule = currentSchedules.find(schedule => 
      schedule.available_date === newDate &&
      schedule.lecture_id === lectureId
    );
    
    if (existingSchedule) {
      const existingStart = parseInt(existingSchedule.start_time.split(':')[0]);
      const existingEnd = parseInt(existingSchedule.end_time.split(':')[0]);
      
      if (!(parseInt(endHour) <= existingStart || parseInt(startHour) >= existingEnd)) {
        conflicts.push({
          date: newDate,
          existingTime: `${existingSchedule.start_time} - ${existingSchedule.end_time}`,
          newTime: `${startHour}:00 - ${endHour}:00`
        });
      }
    }
  }
  
  return conflicts;
};

// 生成日期范围内的所有日期
export const generateDateRange = (startDate: string, endDate: string): string[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates = [];
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d).toISOString().split('T')[0]);
  }
  
  return dates;
};
