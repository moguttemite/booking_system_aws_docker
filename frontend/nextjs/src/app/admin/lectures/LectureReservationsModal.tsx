'use client';
import { Modal, Button, Group, Loader, Text, Alert } from "@mantine/core";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import { fetchAllUsers, fetchLectureBookings } from '@/lib/api';
import useAuthStore from '@/store/useUserStore';
import { getWeekOfMonth } from "@/lib/booking_tools";
import { checkSessionAndShowModal } from '@/lib/sessionManager';
import { useErrorHandler } from '@/lib/errorHandler';
import { withErrorHandling, withNetworkErrorHandling, withAuthErrorHandling } from '@/lib/apiErrorHandler';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import type { User } from "@/types";

const TIME_SLOTS: string[] = [];
for (let h = 10; h < 20; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

const WEEK_DAYS = ["日", "月", "火", "水", "木", "金", "土"];

function getWeekDates(baseDate: Date) {
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

type Props = {
  lectureId: number;
  lectureTitle: string;
  opened: boolean;
  onClose: () => void;
};

export default function LectureReservationsModal({ lectureId, lectureTitle, opened, onClose }: Props) {
  // 错误处理 hook
  const { handleError, handleApiError, handleNetworkError, handleAuthError, showSuccessNotification } = useErrorHandler();
  
  const [loading, setLoading] = useState(false);
  const [reservations, setReservations] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [baseDate, setBaseDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);
  
  console.log("Modal token and user:", { token: token ? token.substring(0, 20) + "..." : null, user });
  
  // 监听状态变化
  useEffect(() => {
    console.log("State changed:", { loading, dataLoaded, reservations: reservations.length, error });
  }, [loading, dataLoaded, reservations.length, error]);
  // 获取当前周是本月的第几周
  const weekOfMonth = getWeekOfMonth(baseDate);

  // 重置状态当弹窗关闭时
  useEffect(() => {
    if (!opened) {
      console.log("Modal closed, resetting states");
      setLoading(false);
      setReservations([]);
      setUsers([]);
      setError(null);
      setDataLoaded(false);
    }
  }, [opened]);

  // 获取用户信息
  useEffect(() => {
    if (!opened) return;
    
    const fetchUsers = async () => {
      try {
        if (!token) {
          console.log("No token for fetchAllUsers, setting empty users");
          setUsers([]);
          return;
        }
        
        const usersData = await withAuthErrorHandling(
          () => fetchAllUsers(token),
          'fetchAllUsers',
          { 
            showNotification: false, // 不显示通知，静默处理
            customMessage: 'ユーザー情報の取得に失敗しました'
          }
        );
        setUsers(usersData);
      } catch (err) {
        handleApiError(err, 'fetchAllUsers');
        // 如果获取用户数据失败，设置空数组
        setUsers([]);
      }
    };
    
    fetchUsers();
  }, [opened, token]); // 移除 handleApiError 依赖

  // 获取预约信息
  useEffect(() => {
    console.log("Reservations useEffect triggered:", { opened, lectureId, dataLoaded, token: !!token });
    if (!opened || !lectureId || dataLoaded) {
      console.log("Reservations useEffect early return:", { opened, lectureId, dataLoaded });
      return;
    }
    
    console.log("Starting to fetch reservations...");
    setLoading(true);
    setError(null);
    
    const fetchReservations = async () => {
      try {
        console.log("fetchReservations function called");
        // 如果没有token，直接设置空数据
        if (!token) {
          console.log("No token, setting empty reservations");
          setReservations([]);
          setError("認証トークンが見つかりません");
          setLoading(false);
          setDataLoaded(true);
          return;
        }
        
        console.log("Calling fetchLectureBookings with:", { lectureId, token: token.substring(0, 20) + "..." });
        
        // 添加超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log("Reservations request timeout - aborting");
          controller.abort();
        }, 5000); // 5秒超时
        
        // 调用真实API获取预约数据，包装错误处理
        console.log("Calling real API to fetch reservations...");
        const data = await withAuthErrorHandling(
          () => fetchLectureBookings(lectureId, token),
          'fetchLectureBookings',
          { 
            showNotification: true,
            customMessage: '予約情報の取得に失敗しました'
          }
        );
        clearTimeout(timeoutId);
        console.log("Reservations fetched successfully:", data);
        
        // 处理时间格式转换 (HH:MM:SS -> HH:MM)
        const processedData = data.map(booking => ({
          ...booking,
          start_time: booking.start_time.substring(0, 5), // "11:00:00" -> "11:00"
          end_time: booking.end_time.substring(0, 5)      // "13:00:00" -> "13:00"
        }));
        
        setReservations(processedData);
        setLoading(false);
        setDataLoaded(true);
        console.log("Real API data set and states updated");
        
      } catch (err) {
        handleApiError(err, 'fetchLectureBookings');
        
        // 如果API调用失败，使用模拟数据作为降级方案
        console.log("API failed, using mock data as fallback");
        const mockData = [
          {
            id: 1,
            user_id: 1,
            user_name: "テストユーザー1",
            booking_date: "2025-10-20",
            start_time: "10:00",
            end_time: "11:00",
            status: "confirmed"
          },
          {
            id: 2,
            user_id: 2,
            user_name: "テストユーザー2",
            booking_date: "2025-10-21",
            start_time: "14:00",
            end_time: "15:00",
            status: "pending"
          }
        ];
        
        setReservations(mockData);
        setError("予約情報の取得に失敗しました (フォールバック)");
        setLoading(false);
        setDataLoaded(true);
        console.log("Mock data set as fallback");
      }
    };
    
    fetchReservations();
  }, [lectureId, opened, dataLoaded]);

  // 根据user_id获取用户名
  const getUserName = (userId: number): string => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : `用户${userId}`;
  };

  const weekDates = getWeekDates(baseDate);
  const reservationMap: Record<string, string> = {};
  
  // 修复预约时间显示逻辑
  reservations.forEach(r => {
    const startTime = r.start_time;
    const endTime = r.end_time;
    const userName = r.user_name || getUserName(r.user_id);
    
    // 生成该预约时间段内的所有时间点
    const timeSlots = [];
    let currentTime = startTime;
    
    while (currentTime !== endTime) {
      timeSlots.push(currentTime);
      // 计算下一个时间点
      const [hour, minute] = currentTime.split(':').map(Number);
      let nextHour = hour;
      let nextMinute = minute + 30;
      
      if (nextMinute === 60) {
        nextHour += 1;
        nextMinute = 0;
      }
      
      currentTime = `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`;
    }
    
    // 为每个时间点设置用户名
    timeSlots.forEach(time => {
      const key = `${r.booking_date}_${time}`;
      reservationMap[key] = userName;
    });
  });

  // const weekNumber = Math.ceil((weekDates[6].getDate() - 1 + weekDates[6].getDay() + 1) / 7);
  const yearMonth = dayjs(weekDates[0]).format("YYYY年M月");

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`「${lectureTitle}」の予約状況`}
      centered
      fullScreen
      closeOnClickOutside={false}
      closeOnEscape={true}
      styles={{
        content: {
          padding: "32px",
          overflow: "auto", // 允许整个内容滚动
        },
      }}
    >
      <Group justify="center" mb="md">
        <Button size="xs" variant="light" onClick={() => {
          setBaseDate(prev => dayjs(prev).subtract(7, "day").toDate());
          getWeekOfMonth(baseDate);
        }}>
          &lt; 前の週
        </Button>
        <Text size="lg" fw={700}>
          {yearMonth} 第{weekOfMonth}週
        </Text>
        <Button size="xs" variant="light" onClick={() => {
          setBaseDate(prev => dayjs(prev).add(7, "day").toDate());
          getWeekOfMonth(baseDate);
        }}>
          次の週 &gt;
        </Button>
      </Group>

      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="text-center">
            <Loader size="lg" />
            <Text mt="md" c="dimmed">予約情報を読み込み中...</Text>
            <Text mt="xs" size="xs" c="dimmed">
              状態: loading={loading.toString()}, dataLoaded={dataLoaded.toString()}, reservations={reservations.length}
            </Text>
            <Button 
              mt="md" 
              variant="light" 
              color="red" 
              size="sm"
              onClick={() => {
                console.log("Force closing modal due to loading timeout");
                setLoading(false);
                setError("読み込みがタイムアウトしました");
              }}
            >
              強制終了
            </Button>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center min-h-[300px] gap-4">
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="エラーが発生しました"
            color="red"
            variant="light"
            className="w-full max-w-md"
          >
            <Text size="sm">{error}</Text>
          </Alert>
          <Button 
            leftSection={<IconRefresh size={16} />}
            variant="light" 
            color="red"
            onClick={() => {
              setError(null);
              setLoading(true);
              setDataLoaded(false);
              // 重新获取数据
              const fetchReservations = async () => {
                try {
                  if (!token) {
                    setError("認証トークンが見つかりません");
                    return;
                  }
                  const data = await withAuthErrorHandling(
                    () => fetchLectureBookings(lectureId, token),
                    'fetchLectureBookings',
                    { 
                      showNotification: false,
                      customMessage: '予約情報の取得に失敗しました'
                    }
                  );
                  setReservations(data);
                } catch (err) {
                  handleApiError(err, 'fetchLectureBookings');
                  setError("予約情報の取得に失敗しました");
                } finally {
                  setLoading(false);
                  setDataLoaded(true);
                }
              };
              fetchReservations();
            }}
          >
            再試行
          </Button>
        </div>
      ) : (
        <div className="overflow-auto">
          <div className="grid grid-cols-[80px_repeat(7,minmax(100px,1fr))] gap-3">
            {/* 左侧时间轴含 header 占位 */}
            <div className="flex flex-col gap-[4px] text-sm font-semibold text-right pr-2">
              <div className="h-[40px]" />
              {TIME_SLOTS.map((time, i) => (
                <div
                  key={i}
                  className="h-[40px] leading-[40px] text-gray-500 text-end pr-2"
                >
                  {time}
                </div>
              ))}
            </div>

            {/* 每天列 */}
            {weekDates.map((date, colIdx) => {
              const dateStr = dayjs(date).format("YYYY-MM-DD");
              return (
                <div key={colIdx} className="border rounded shadow-sm bg-white">
                  <div className="bg-gray-100 text-center font-bold py-2 border-b h-[40px]">
                    {dayjs(date).format("MM/DD")} ({WEEK_DAYS[date.getDay()]})
                  </div>
                  <div className="p-1 flex flex-col gap-[4px]">
                    {TIME_SLOTS.map((time, rowIdx) => {
                      const key = `${dateStr}_${time}`;
                      const user = reservationMap[key];
                      return (
                        <div
                          key={rowIdx}
                          className={`text-sm rounded px-2 py-[6px] text-center border h-[40px] overflow-hidden truncate flex items-center justify-center ${
                            user 
                              ? "bg-green-50 border-green-300 text-green-800 font-medium"
                              : "bg-white border-gray-200 text-transparent"
                          }`}
                          title={user || ""}
                        >
                          {user || "空"}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}