// utils/generateFinalBookableSlots.ts

import { AvailableTimeRecord, BookedTimeRecord } from "@/lib/api";
import { generateHalfHourSlots } from "@/lib/booking_tools";


/**
 * 生成该讲座在某周内各天可预约时间段
 * @param schedules 该讲座所有讲师设置的可预约时间
 * @param reservations 所有用户的预约记录
 * @param lectureId 当前讲座的 ID
 * @returns 以日期为 key，值为该日期下实际可预约的时间段数组
 */
export function generateFinalBookableSlots(
  schedules: AvailableTimeRecord[],
  reservations: BookedTimeRecord[],
): Record<string, string[]> {
  const finalMap: Record<string, string[]> = {};
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // 处理每个可预约日期
  for (const schedule of schedules) {
    // 跳过过去的日期
    if (schedule.booking_date <= todayStr) continue;

    // 直接使用后端返回的时间格式（已经是"HH:MM"）
    const startTime = schedule.start_time;
    const endTime = schedule.end_time;

    // 生成该日期的所有时间段
    const allSlots = generateHalfHourSlots(startTime, endTime);

    // 找出该日期已预约的时间段
    const bookedTimes = reservations
      .filter((r) => r.booking_date === schedule.booking_date)
      .flatMap((r) => generateHalfHourSlots(r.start_time, r.end_time));

    // 过滤掉已预约的时间段，得到可预约的时间段
    const availableSlots = allSlots.filter((slot) => !bookedTimes.includes(slot));

    // 只添加有可预约时间段的日期
    if (availableSlots.length > 0) {
      finalMap[schedule.booking_date] = availableSlots;
    }
  }

  return finalMap;
}


/**
 * 根据开始时间，获取该开始时间下所有可预约的终了时间
 * @param startTime 开始时间
 * @param availableStartTimes 所有可预约的开始时间
 * @returns 所有可预约的终了时间
 */
export function getAvailableEndTimes(
  startTime: string,
  availableStartTimes: string[]
): string[] {
  const result: string[] = [];
  if (!availableStartTimes.includes(startTime)) return result;

  let [h, m] = startTime.split(":").map(Number);
  let current = startTime;

  while (true) {
    // 推进 30 分钟（= 下一段的起点）
    m += 30;
    if (m === 60) {
      h += 1;
      m = 0;
    }
    const next = `${String(h).padStart(2, '0')}:${m === 0 ? '00' : '30'}`;

    // 判断当前段是否连续
    if (!availableStartTimes.includes(current)) break;

    result.push(next);  // next 是“当前段的终了时间”
    current = next;     // 移动到下一段
  }

  return result;
}
