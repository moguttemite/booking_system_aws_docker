// 获取当前日期是本月的第几周
export const getWeekOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    // 当前日期所在周的周日
    const dayOfWeek = date.getDay(); // 0=周日
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - dayOfWeek);

    // 如果本周的周日不是本月的，说明这周属于上个月
    if (sunday.getMonth() !== month) {
      // 递归往下找，直到找到本月的第一周
      // 这里返回0，表示这周属于上个月
      return 0;
    }

    // 计算本月1号的周日
    const firstDay = new Date(year, month, 1);
    const firstDayWeek = firstDay.getDay();
    const firstSunday = new Date(firstDay);
    firstSunday.setDate(firstDay.getDate() - firstDayWeek);

    // 计算当前周是本月的第几周
    const diff = Math.floor((sunday.getTime() - firstSunday.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return diff + 1;
  };

/**
 * 根据日期对象生成唯一的日期字符串 key，格式为 "YYYY-MM-DD"
 * 用于在预约数据等地方做唯一标识。
 * @param date Date对象
 * @returns 形如 "2025-07-06" 的字符串
 */
export const getDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * 获取指定 weekOffset（相对于本周的偏移量）对应的那一周的所有日期信息
 * 每周从周日开始，返回该周7天的日期和是否为过去日期
 * @param offset 相对于本周的周数偏移（0为本周，-1为上周，1为下周）
 * @returns 包含7天日期和是否为过去日的数组
 */
export const getWeekDates = (offset: number): { date: Date; isPast: boolean }[] => {
  const now = new Date();  // 当前真实时间
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 获取本周的起始日（周日）
  const start = new Date(todayMidnight);
  const day = start.getDay();
  start.setDate(start.getDate() - day + offset * 7);

  // 生成本周7天的日期信息
  return Array.from({ length: 7 }, (_, i) => {
    const current = new Date(start);
    current.setDate(start.getDate() + i);

    const currentMidnight = new Date(current.getFullYear(), current.getMonth(), current.getDate());

    return {
      date: current,
      isPast: currentMidnight.getTime() <= todayMidnight.getTime(),
    };
  });
};

/**
 * 格式化日期显示，返回形如 "7月23日（水）" 的字符串
 * @param date Date对象
 * @returns 形如 "7月23日（水）" 的字符串
 */
export const formatDateDisplay = (date: Date) =>
    date.toLocaleDateString('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    });

/**
 * 生成从 start 到 end 的所有半小时时间点
 * 支持参数为字符串（"10:00"）或数字（10）
 */
export function generateHalfHourSlots(start: string | number, end: string | number): string[] {
  // 转为字符串格式
  const startStr = typeof start === 'number' ? `${String(start).padStart(2, '0')}:00` : start;
  const endStr = typeof end === 'number' ? `${String(end).padStart(2, '0')}:00` : end;

  const slots: string[] = [];
  let [sh, sm] = startStr.split(":").map(Number);
  const [eh, em] = endStr.split(":").map(Number);

  while (sh < eh || (sh === eh && sm < em)) {
    slots.push(`${String(sh).padStart(2, '0')}:${sm === 0 ? '00' : '30'}`);
    sm += 30;
    if (sm === 60) {
      sm = 0;
      sh += 1;
    }
  }
  return slots;
}

export const timeOptions = Array.from({ length: 21 }, (_, i) => {
    const hour = 10 + Math.floor(i / 2);
    const min = i % 2 === 0 ? '00' : '30';
    return `${String(hour).padStart(2, '0')}:${min}`;
});