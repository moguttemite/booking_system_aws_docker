import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Stack, 
  Title, 
  Box, 
  Group, 
  Button, 
  Loader, 
  Text,
  Card,
  Badge,
  Table
} from "@mantine/core";
import { IconCalendar, IconClock, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import type { BookableTeacher } from "@/types/booking";
import useAuthStore from '@/store/useUserStore';
import { 
  generateTimeSlots, 
  getWeekDates, 
  formatDateDisplay, 
  getTodayString
} from '@/lib/teacherUtils';

interface LectureScheduleRecord {
  id: number;
  lecture_id: number;
  teacher_id: number;
  date: string;
  start: string;
  end: string;
  created_at: string;
  isOwnSchedule?: boolean;
}

interface LectureReservationRecord {
  user_id: number;
  lecture_id: number;
  teacher_id: number;
  status: string;
  reserved_date: string;
  start_time: string;
  end_time: string;
}

interface LectureScheduleViewModalProps {
  opened: boolean;
  onClose: () => void;
  lecture: BookableTeacher | null;
}

const LectureScheduleViewModal: React.FC<LectureScheduleViewModalProps> = ({
  opened,
  onClose,
  lecture
}) => {
  const [currentSchedules, setCurrentSchedules] = useState<LectureScheduleRecord[]>([]);
  const [currentReservations, setCurrentReservations] = useState<LectureReservationRecord[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // 生成30分钟间隔的时间槽
  const timeSlots = generateTimeSlots();

  // 获取当前周的日期
  const weekDates = getWeekDates(currentWeekOffset);

  // 检查时间槽是否可用
  const isTimeSlotAvailable = (date: Date, timeSlot: string) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const hour = parseInt(timeSlot.split(':')[0]);
    const minute = parseInt(timeSlot.split(':')[1]);
    
    // 检查是否有时间安排
    const hasSchedule = currentSchedules.some(schedule => {
      if (schedule.date !== dateStr) return false;
      
      const scheduleStart = parseInt(schedule.start.split(':')[0]);
      const scheduleEnd = parseInt(schedule.end.split(':')[0]);
      
      return hour >= scheduleStart && hour < scheduleEnd;
    });

    if (!hasSchedule) return false;

    // 检查是否已被预约
    const isReserved = currentReservations.some(reservation => {
      if (reservation.reserved_date !== dateStr) return false;
      
      const reservationStart = parseInt(reservation.start_time.split(':')[0]);
      const reservationEnd = parseInt(reservation.end_time.split(':')[0]);
      
      return hour >= reservationStart && hour < reservationEnd;
    });

    return !isReserved;
  };

  // 获取时间槽状态
  const getTimeSlotStatus = (date: Date, timeSlot: string) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const hour = parseInt(timeSlot.split(':')[0]);
    
    // 检查是否已被预约
    const isReserved = currentReservations.some(reservation => {
      if (reservation.reserved_date !== dateStr) return false;
      
      const reservationStart = parseInt(reservation.start_time.split(':')[0]);
      const reservationEnd = parseInt(reservation.end_time.split(':')[0]);
      
      return hour >= reservationStart && hour < reservationEnd;
    });

    if (isReserved) return 'reserved';
    
    // 检查是否有时间安排
    const hasSchedule = currentSchedules.some(schedule => {
      if (schedule.date !== dateStr) return false;
      
      const scheduleStart = parseInt(schedule.start.split(':')[0]);
      const scheduleEnd = parseInt(schedule.end.split(':')[0]);
      
      return hour >= scheduleStart && hour < scheduleEnd;
    });

    if (hasSchedule) return 'available';
    return 'unavailable';
  };

  // 获取预约用户信息
  const getReservedUser = (date: Date, timeSlot: string) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const hour = parseInt(timeSlot.split(':')[0]);
    
    // 查找该时间槽的预约记录
    const reservation = currentReservations.find(reservation => {
      if (reservation.reserved_date !== dateStr) return false;
      
      const reservationStart = parseInt(reservation.start_time.split(':')[0]);
      const reservationEnd = parseInt(reservation.end_time.split(':')[0]);
      
      return hour >= reservationStart && hour < reservationEnd;
    });

    return reservation;
  };

  // 加载时间安排数据
  useEffect(() => {
    if (!opened || !lecture) return;

    const loadSchedules = async () => {
      setLoadingSchedules(true);
      try {
        const response = await fetch('/api/lecture-schedules');
        if (response.ok) {
          const data = await response.json();
          const lectureSchedules = data.filter((schedule: LectureScheduleRecord) => 
            schedule.lecture_id === lecture.lecture_id
          );
          
          // 获取当前登录用户信息，用于标识自己的时间安排
          const currentUser = useAuthStore.getState().user;
          const currentTeacherId = currentUser?.id;
          
          // 为每个时间安排添加标识信息
          const schedulesWithOwnership = lectureSchedules.map((schedule: LectureScheduleRecord) => ({
            ...schedule,
            isOwnSchedule: schedule.teacher_id === currentTeacherId
          }));
          
          setCurrentSchedules(schedulesWithOwnership);
        }
      } catch (error) {
        console.error('時間枠読み込みエラー:', error);
      } finally {
        setLoadingSchedules(false);
      }
    };

    const loadReservations = async () => {
      setLoadingReservations(true);
      try {
        const response = await fetch('/lecture_reservations.json');
        if (response.ok) {
          const data = await response.json();
          const lectureReservations = data.filter((reservation: LectureReservationRecord) => 
            reservation.lecture_id === lecture.lecture_id
          );
          setCurrentReservations(lectureReservations);
        }
      } catch (error) {
        console.error('予約データ読み込みエラー:', error);
      } finally {
        setLoadingReservations(false);
      }
    };

    loadSchedules();
    loadReservations();
  }, [opened, lecture]);

  // 重置周偏移
  useEffect(() => {
    if (opened) {
      setCurrentWeekOffset(0);
    }
  }, [opened]);

  if (!lecture) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${lecture.lecture_title} - 予約状況`}
      size="100%"
      fullScreen
      centered
    >
      <Stack gap="md" p="xl">
        {/* 周导航 */}
        <Group justify="space-between" align="center">
          <Button
            variant="light"
            leftSection={<IconChevronLeft size={16} />}
            onClick={() => setCurrentWeekOffset(prev => prev - 1)}
          >
            前の週
          </Button>
          
          <Text fw={500}>
            {formatDateDisplay(weekDates[0])} - {formatDateDisplay(weekDates[6])}
          </Text>
          
          <Button
            variant="light"
            rightSection={<IconChevronRight size={16} />}
            onClick={() => setCurrentWeekOffset(prev => prev + 1)}
          >
            次の週
          </Button>
        </Group>

        {/* 加载状态 */}
        {(loadingSchedules || loadingReservations) && (
          <Box ta="center" py="xl">
            <Loader size="lg" />
            <Text mt="md">データを読み込み中...</Text>
          </Box>
        )}

        {/* 周历显示 */}
        {!loadingSchedules && !loadingReservations && (
          <Box style={{ flex: 1, minHeight: '60vh' }}>
            <Title order={4} mb="lg" ta="center">週間カレンダー表示</Title>
            
            <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-2">
              {/* 时间轴 */}
              <div className="flex flex-col">
                <div className="h-16 flex items-center justify-center text-base font-semibold text-gray-600">
                  時間
                </div>
                                 {timeSlots.map((timeSlot, index) => (
                   <div
                     key={index}
                     className="h-12 flex items-center justify-center text-sm text-gray-500 border-b border-gray-100"
                   >
                     {timeSlot}
                   </div>
                 ))}
              </div>

              {/* 每天列 */}
              {weekDates.map((date, dayIndex) => {
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                
                return (
                  <div key={dayIndex} className="flex flex-col">
                                         {/* 日期头部 */}
                     <div className={`h-16 flex items-center justify-center text-base font-semibold border-b ${
                       isPast ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-700'
                     }`}>
                       <div className="text-center">
                         <div>{formatDateDisplay(date)}</div>
                       </div>
                     </div>

                                         {/* 时间槽 */}
                     {timeSlots.map((timeSlot, timeIndex) => {
                       const status = isPast ? 'past' : getTimeSlotStatus(date, timeSlot);
                       const reservedUser = status === 'reserved' ? getReservedUser(date, timeSlot) : null;
                       
                       let bgColor = 'bg-white';
                       let textColor = 'text-gray-700';
                       let borderColor = 'border-gray-200';
                       
                       switch (status) {
                         case 'available':
                           bgColor = 'bg-green-50';
                           textColor = 'text-green-700';
                           borderColor = 'border-green-200';
                           break;
                         case 'reserved':
                           bgColor = 'bg-red-50';
                           textColor = 'text-red-700';
                           borderColor = 'border-red-200';
                           break;
                         case 'unavailable':
                           bgColor = 'bg-gray-50';
                           textColor = 'text-gray-400';
                           borderColor = 'border-gray-100';
                           break;
                         case 'past':
                           bgColor = 'bg-gray-100';
                           textColor = 'text-gray-400';
                           borderColor = 'border-gray-200';
                           break;
                       }

                       // 检查这个时间槽是否属于当前讲师
                       const isOwnTimeSlot = currentSchedules.some(schedule => 
                         schedule.date === date.toISOString().split('T')[0] &&
                         schedule.start <= timeSlot &&
                         schedule.end > timeSlot &&
                         schedule.isOwnSchedule
                       );
                       
                       return (
                         <div
                           key={timeIndex}
                           className={`h-12 flex flex-col items-center justify-center text-xs border-b ${borderColor} ${bgColor} ${textColor} relative`}
                         >
                           {status === 'available' && (
                             <div className="text-center">
                               <div>○</div>
                               {isOwnTimeSlot && (
                                 <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                               )}
                             </div>
                           )}
                           {status === 'reserved' && (
                             <div className="text-center">
                               <div>×</div>
                               <div className="text-xs opacity-75">ID:{reservedUser?.user_id}</div>
                               {isOwnTimeSlot && (
                                 <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                               )}
                             </div>
                           )}
                           {status === 'unavailable' && '-'}
                           {status === 'past' && '-'}
                         </div>
                       );
                     })}
                  </div>
                );
              })}
            </div>

                         {/* 图例 */}
             <Card mt="lg" p="md" withBorder>
               <Text size="md" fw={500} mb="sm" ta="center">凡例</Text>
               <Group gap="lg" justify="center">
                 <Group gap="xs">
                   <div className="w-5 h-5 bg-green-50 border border-green-200 rounded"></div>
                   <Text size="sm">○ 已设置预约时间</Text>
                 </Group>
                                   <Group gap="xs">
                    <div className="w-5 h-5 bg-red-50 border border-red-200 rounded flex flex-col items-center justify-center">
                      <div className="text-xs">×</div>
                      <div className="text-xs opacity-75">ID:1</div>
                    </div>
                    <Text size="sm">已被预约</Text>
                  </Group>
                 <Group gap="xs">
                   <div className="w-5 h-5 bg-gray-50 border border-gray-100 rounded"></div>
                   <Text size="sm">- 尚未设置预约时间</Text>
                 </Group>
                 <Group gap="xs">
                   <div className="w-5 h-5 bg-gray-100 border border-gray-200 rounded"></div>
                   <Text size="sm">- 无法预约</Text>
                 </Group>
               </Group>
             </Card>
          </Box>
        )}

        {/* 关闭按钮 */}
        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default LectureScheduleViewModal;
