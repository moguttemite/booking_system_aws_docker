import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Stack, 
  Title, 
  Box, 
  Group, 
  Button, 
  TextInput, 
  Select, 
  Loader, 
  Text,
  Divider,
  Card,
  Badge,
  ActionIcon,
  Tooltip,
  Table
} from "@mantine/core";
import { notifications } from '@mantine/notifications';
import { IconTrash, IconCalendar, IconClock } from '@tabler/icons-react';
import type { BookableTeacher } from "@/types/booking";
import useAuthStore from '@/store/useUserStore';
import { fetchLectureSchedules, createLectureSchedules, deleteLectureSchedule, fetchLectureBookings, type LectureScheduleRecord, type LectureBookingResponse } from '@/lib/api';
import { checkSessionAndShowModal } from '@/lib/sessionManager';
import { 
  generateTimeOptions, 
  generateTimeSlots, 
  getWeekDates, 
  formatDateDisplay, 
  getTodayString,
  validateScheduleInput,
  checkTimeConflicts,
  generateDateRange
} from '@/lib/teacherUtils';

// ==================== 类型定义 ====================

/**
 * 时间安排模态框组件的Props
 */
export interface ScheduleModalProps {
  /** 是否打开模态框 */
  opened: boolean;
  /** 关闭模态框的回调函数 */
  onClose: () => void;
  /** 讲座信息 */
  lecture: BookableTeacher | null;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 成功回调 */
  onSuccess?: (schedules: LectureScheduleRecord[]) => void;
  /** 错误回调 */
  onError?: (error: string) => void;
}

/**
 * 时间安排表单数据
 */
export interface ScheduleFormData {
  /** 开始日期 */
  startDate: string;
  /** 结束日期 */
  endDate: string;
  /** 开始时间 */
  startHour: string;
  /** 结束时间 */
  endHour: string;
}

/**
 * 时间槽状态
 */
export interface TimeSlotState {
  /** 是否可用 */
  available: boolean;
  /** 是否被选中 */
  selected: boolean;
  /** 是否被禁用 */
  disabled: boolean;
  /** 冲突信息 */
  conflict?: string;
}

/**
 * 周视图数据
 */
export interface WeekViewData {
  /** 日期 */
  date: Date;
  /** 是否为过去日期 */
  isPast: boolean;
  /** 时间槽状态映射 */
  timeSlots: Record<string, TimeSlotState>;
}

/**
 * 时间安排操作类型
 */
export type ScheduleAction = 'create' | 'update' | 'delete';

/**
 * 时间安排操作数据
 */
export interface ScheduleOperation {
  /** 操作类型 */
  action: ScheduleAction;
  /** 时间安排记录 */
  schedule: LectureScheduleRecord;
  /** 操作时间戳 */
  timestamp: number;
}

/**
 * 模态框状态
 */
export interface ScheduleModalState {
  /** 表单数据 */
  formData: ScheduleFormData;
  /** 当前时间安排 */
  currentSchedules: LectureScheduleRecord[];
  /** 当前预约 */
  currentReservations: LectureBookingResponse[];
  /** 周偏移量 */
  weekOffset: number;
  /** 待保存操作 */
  pendingOperations: ScheduleOperation[];
  /** 加载状态 */
  loading: {
    schedules: boolean;
    reservations: boolean;
    saving: boolean;
  };
  /** 错误信息 */
  error: string | null;
}

/**
 * 时间选项
 */
export interface TimeOption {
  /** 时间值 */
  value: string;
  /** 显示标签 */
  label: string;
}

/**
 * 时间槽配置
 */
export interface TimeSlotConfig {
  /** 开始时间 */
  start: string;
  /** 结束时间 */
  end: string;
  /** 间隔（分钟） */
  interval: number;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 错误信息 */
  error?: string;
  /** 警告信息 */
  warning?: string;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
  opened,
  onClose,
  lecture,
  disabled = false,
  className = "",
  onSuccess,
  onError
}) => {
  // 时间枠编辑相关状态
  const [formData, setFormData] = useState<ScheduleFormData>({
    startDate: '',
    endDate: '',
    startHour: '',
    endHour: ''
  });
  
  const [currentSchedules, setCurrentSchedules] = useState<LectureScheduleRecord[]>([]);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [currentReservations, setCurrentReservations] = useState<LectureBookingResponse[]>([]);
  const [pendingOperations, setPendingOperations] = useState<ScheduleOperation[]>([]);
  const [pendingSaveOperation, setPendingSaveOperation] = useState<LectureScheduleRecord[] | null>(null);
  
  const [loading, setLoading] = useState({
    schedules: false,
    reservations: false,
    saving: false
  });
  
  const [error, setError] = useState<string | null>(null);

  // 从formData中解构出需要的字段
  const { startDate, endDate, startHour, endHour } = formData;

  // 生成时间选项
  const timeOptions = generateTimeOptions();
  
  // 生成结束时间选项（基于开始时间）
  const endTimeOptions = startHour 
    ? timeOptions.filter(option => parseInt(option.value) > parseInt(startHour))
    : [];

  // 生成30分钟间隔的时间槽
  const timeSlots = generateTimeSlots();

  // 检查时间槽是否可用 - 第二步：根据lecture_schedules.json数据判断
  const isTimeSlotAvailable = (date: Date, timeSlot: string) => {
    // 修复日期格式问题：使用本地时间而不是UTC时间
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const hour = parseInt(timeSlot.split(':')[0]);
    const minute = parseInt(timeSlot.split(':')[1]);
    
    // 调试信息
    if (currentSchedules.length > 0) {
      console.log(`检查时间槽: ${dateStr} ${timeSlot}, 当前时间安排:`, currentSchedules);
    }
    
    const result = currentSchedules.some(schedule => {
      // 检查日期是否匹配
      if (schedule.available_date !== dateStr) {
        console.log(`日期不匹配: ${schedule.available_date} !== ${dateStr}`);
        return false;
      }
      
      // 解析时间安排的开始和结束时间
      const scheduleStart = parseInt(schedule.start_time.split(':')[0]);
      const scheduleEnd = parseInt(schedule.end_time.split(':')[0]);
      
      // 检查当前时间槽是否在时间安排范围内
      const isInRange = hour >= scheduleStart && hour < scheduleEnd;
      
      // 调试信息
      console.log(`时间槽 ${timeSlot} (${hour}:${minute}) 在 ${schedule.start_time}-${schedule.end_time} 范围内: ${isInRange}`);
      
      return isInRange;
    });
    
    console.log(`最终结果: ${dateStr} ${timeSlot} -> ${result ? '予約可' : '未設定'}`);
    return result;
  };

  // 检查时间槽是否被预约
  const getTimeSlotReservation = (date: Date, timeSlot: string) => {
    // 修复日期格式问题：使用本地时间而不是UTC时间
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const hour = parseInt(timeSlot.split(':')[0]);
    const minute = parseInt(timeSlot.split(':')[1]);
    
    // 查找匹配的预约记录
    const reservation = currentReservations.find(res => {
      // 检查日期是否匹配
      if (res.booking_date !== dateStr) return false;
      
      // 检查时间是否匹配
      const resStartHour = parseInt(res.start_time.split(':')[0]);
      const resStartMinute = parseInt(res.start_time.split(':')[1]);
      const resEndHour = parseInt(res.end_time.split(':')[0]);
      const resEndMinute = parseInt(res.end_time.split(':')[1]);
      
      // 检查当前时间槽是否在预约时间范围内
      const currentTimeMinutes = hour * 60 + minute;
      const resStartMinutes = resStartHour * 60 + resStartMinute;
      const resEndMinutes = resEndHour * 60 + resEndMinute;
      
      return currentTimeMinutes >= resStartMinutes && currentTimeMinutes < resEndMinutes;
    });
    
    return reservation;
  };

  // 处理开始日期变化
  const handleStartDateChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      startDate: value
    }));
    if (endDate && value && endDate < value) {
      setFormData(prev => ({
        ...prev,
        endDate: ''
      }));
    }
  };

  // 处理结束日期变化
  const handleEndDateChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      endDate: value
    }));
  };

  // 获取当前周信息
  const weekDates = getWeekDates(currentWeekOffset);
  const displayDate = weekDates[0];
  const currentYear = displayDate.getFullYear();
  const currentMonth = displayDate.getMonth() + 1;

  // 加载讲座时间安排
  useEffect(() => {
    if (opened && lecture) {
      setLoading(prev => ({ ...prev, schedules: true, reservations: true }));
      setFormData({
        startDate: '',
        endDate: '',
        startHour: '',
        endHour: ''
      });
      setCurrentWeekOffset(0);
      
      const loadSchedules = async () => {
        try {
          // 使用新的API直接获取特定讲座的时间安排
          const schedules = await fetchLectureSchedules(lecture.id);
          
          // 获取当前登录用户信息，用于权限验证
          const currentUser = useAuthStore.getState().user;
          const currentTeacherId = currentUser?.id;
          
          // 过滤：只显示当前讲师设置的时间安排
          const filteredSchedules = schedules.filter(s => 
            s.teacher_id === currentTeacherId
          );
          
          setCurrentSchedules(filteredSchedules);
          
          // 如果有时间安排，显示通知
          if (filteredSchedules.length > 0) {
            notifications.show({
              title: '時間枠読み込み完了',
              message: `${filteredSchedules.length}件の時間枠を読み込みました`,
              color: 'green'
            });
          }
        } catch (error) {
          console.error('時間枠読み込みエラー:', error);
          setCurrentSchedules([]);
          
          // 根据错误类型显示不同的消息
          let errorMessage = '時間枠の読み込みに失敗しました';
          if (error instanceof Error) {
            if (error.message.includes('指定された講座が見つかりません')) {
              errorMessage = 'この講座は存在しないか、削除されています。時間枠の編集はできません。';
            } else {
              errorMessage = error.message;
            }
          }
          
          notifications.show({
            title: 'エラー',
            message: errorMessage,
            color: 'red'
          });
        } finally {
          setLoading(prev => ({ ...prev, schedules: false }));
        }
      };

      const loadReservations = async () => {
        try {
          // 获取当前登录用户信息和token
          const currentUser = useAuthStore.getState().user;
          const token = useAuthStore.getState().token;
          
          if (!currentUser || !token) {
            notifications.show({
              title: 'エラー',
              message: 'ユーザー情報またはトークンが見つかりません',
              color: 'red'
            });
            return;
          }
          
          // 使用新的API获取预约数据
          const reservations = await fetchLectureBookings(lecture.id, token);
          console.log('获取到的预约数据:', reservations);
          setCurrentReservations(reservations);
          
          // 如果有预约记录，显示通知
          if (reservations.length > 0) {
            notifications.show({
              title: '予約記録読み込み完了',
              message: `${reservations.length}件の予約記録を読み込みました`,
              color: 'blue'
            });
          }
        } catch (error) {
          console.error('予約記録読み込みエラー:', error);
          setCurrentReservations([]);
          notifications.show({
            title: 'エラー',
            message: error instanceof Error ? error.message : '予約記録の読み込みに失敗しました',
            color: 'red'
          });
        } finally {
          setLoading(prev => ({ ...prev, reservations: false }));
        }
      };
      
      loadSchedules();
      loadReservations();
    }
  }, [opened, lecture]);

  // 监听登录状态变化，在重新登录后自动执行待保存的操作
  useEffect(() => {
    const handleTokenChange = () => {
      if (pendingSaveOperation) {
        // 用户重新登录后，自动执行待保存的操作
        executePendingSaveOperation();
      }
    };

    // 监听token变化（通过store订阅）
    const unsubscribe = useAuthStore.subscribe(
      (state) => state.token,
      (newToken, prevToken) => {
        // 如果token从空变为有值，说明用户重新登录了
        if (!prevToken && newToken && pendingSaveOperation) {
          handleTokenChange();
        }
      }
    );

    return unsubscribe;
  }, [pendingSaveOperation]);

  // 执行待保存的操作
  const executePendingSaveOperation = async () => {
    if (!pendingSaveOperation || !lecture) return;

    try {
      const token = useAuthStore.getState().token;
      if (!token) {
        notifications.show({
          title: 'エラー',
          message: '認証トークンが見つかりません',
          color: 'red'
        });
        return;
      }

      // 再次检查登录状态
      const isValid = await checkSessionAndShowModal(token);
      if (!isValid) {
        return; // 如果仍然无效，等待下次登录
      }

      // 执行保存操作
      const result = await createLectureSchedules(pendingSaveOperation, token);
      
      if (result.success) {
        // 添加到当前时间安排列表
        setCurrentSchedules(prev => [...prev, ...pendingSaveOperation]);
        
        // 显示成功消息
        const successMessage = result.created_count 
          ? `${result.created_count}件の時間枠を登録しました`
          : result.message;
        
        notifications.show({ 
          title: '保存成功', 
          message: successMessage, 
          color: 'green' 
        });
        
        // 清空表单
        setFormData({
          startDate: '',
          endDate: '',
          startHour: '',
          endHour: ''
        });
        
        // 清除待保存操作
        setPendingSaveOperation(null);
      } else {
        throw new Error(result.message || '保存に失敗しました');
      }
    } catch (err) {
      console.error('自動保存エラー:', err);
      notifications.show({ 
        title: 'エラー', 
        message: err instanceof Error ? err.message : '保存に失敗しました', 
        color: 'red' 
      });
      // 清除待保存操作，避免重复尝试
      setPendingSaveOperation(null);
    }
  };

  // 删除时间安排
  const handleDeleteSchedule = async (scheduleId: number) => {
    try {
      // 获取当前登录用户信息和token
      const currentUser = useAuthStore.getState().user;
      const token = useAuthStore.getState().token;
      
      if (!currentUser || !token) {
        notifications.show({
          title: 'エラー',
          message: 'ユーザー情報またはトークンが見つかりません',
          color: 'red'
        });
        return;
      }
      
      // 检查要删除的时间安排是否属于当前讲师
      const scheduleToDelete = currentSchedules.find(s => s.id === scheduleId);
      if (!scheduleToDelete) {
        notifications.show({
          title: 'エラー',
          message: '削除する時間枠が見つかりません',
          color: 'red'
        });
        return;
      }
      
      if (scheduleToDelete.teacher_id !== currentUser.id) {
        notifications.show({
          title: '権限エラー',
          message: '他の講師が設定した時間枠は削除できません',
          color: 'red'
        });
        return;
      }
      
      // 调用新的API删除记录
      const result = await deleteLectureSchedule(scheduleId, token);
      
      if (result.success) {
        // 从当前时间安排列表中移除
        setCurrentSchedules(prev => prev.filter(s => s.id !== scheduleId));
        notifications.show({
          title: '削除成功',
          message: result.message,
          color: 'green'
        });
      } else {
        throw new Error(result.message || '削除に失敗しました');
      }
    } catch (error) {
      console.error('削除エラー:', error);
      notifications.show({
        title: '削除失敗',
        message: error instanceof Error ? error.message : '時間枠の削除に失敗しました',
        color: 'red'
      });
    }
  };

  // 格式化日期显示
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    });
  };

  // 计算时间长度
  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    return endHour - startHour;
  };

  const handleSaveSchedule = async () => {
    if (!lecture) {
      notifications.show({ title: 'エラー', message: '講座情報が取得できません', color: 'red' });
      return;
    }

    // 获取当前登录用户信息
    const currentUser = useAuthStore.getState().user;
    if (!currentUser || currentUser.role !== 'teacher') {
      notifications.show({ title: 'エラー', message: '講師としてログインしてください', color: 'red' });
      return;
    }

    // 验证输入
    const validation = validateScheduleInput(startDate, endDate, startHour, endHour);
    if (!validation.isValid) {
      notifications.show({ title: 'エラー', message: validation.error!, color: 'red' });
      return;
    }
    
    // 生成日期范围
    const newDates = generateDateRange(startDate, endDate);
    
    // 检查时间冲突
    const conflicts = checkTimeConflicts(newDates, currentSchedules, lecture.id, startHour, endHour);
    
    if (conflicts.length > 0) {
      const conflictDates = conflicts.map(c => `${c.date} (${c.existingTime} と ${c.newTime} が重複)`).join('\n');
      notifications.show({ 
        title: '時間枠の重複エラー', 
        message: `以下の日付で時間枠が重複しています:\n${conflictDates}`, 
        color: 'red' 
      });
      return;
    }
    
    try {
      const dates = newDates;
      
      // 调试信息：确认lecture对象和用户信息
      console.log('保存时间安排 - lecture对象:', lecture);
      console.log('保存时间安排 - 当前用户:', currentUser);
      console.log('保存时间安排 - 使用teacher_id:', currentUser.id);
      
      // 创建新的时间安排记录
      const newSchedules: LectureScheduleRecord[] = dates.map((date, index) => ({
        id: Date.now() + index, // 生成唯一ID
        lecture_id: lecture.id,
        teacher_id: currentUser.id, // 使用当前登录用户的真实ID
        date: date,
        start: `${startHour}:00`, // 转换为 HH:MM 格式
        end: `${endHour}:00`,     // 转换为 HH:MM 格式
        created_at: new Date().toISOString()
      }));
      
      console.log('保存时间安排 - 新创建的时间安排:', newSchedules);
      
      // 获取token
      const token = useAuthStore.getState().token;
      if (!token) {
        notifications.show({
          title: 'エラー',
          message: '認証トークンが見つかりません',
          color: 'red'
        });
        return;
      }

      // 检查登录状态
      const isValid = await checkSessionAndShowModal(token);
      if (!isValid) {
        // 如果登录状态无效，将保存操作保存到待执行队列
        setPendingSaveOperation(newSchedules);
        notifications.show({
          title: 'ログインが必要です',
          message: 'ログイン後に自動的に保存されます',
          color: 'blue'
        });
        return;
      }

      // 调用新的API保存时间安排
      const result = await createLectureSchedules(newSchedules, token);
      
      if (result.success) {
        // 添加到当前时间安排列表
        setCurrentSchedules(prev => [...prev, ...newSchedules]);
        
        // 显示成功消息，包含创建的数量
        const successMessage = result.created_count 
          ? `${result.created_count}件の時間枠を登録しました`
          : result.message;
        
        notifications.show({ 
          title: '保存成功', 
          message: successMessage, 
          color: 'green' 
        });
        
        // 清空表单
        setFormData({
          startDate: '',
          endDate: '',
          startHour: '',
          endHour: ''
        });
      } else {
        throw new Error(result.message || '保存に失敗しました');
      }
      
    } catch (err) {
      console.error('保存エラー:', err);
      notifications.show({ 
        title: 'エラー', 
        message: err instanceof Error ? err.message : '保存中にエラーが発生しました', 
        color: 'red' 
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`予約可能時間編集 - ${lecture?.lecture_title}`}
      centered
      size="xl"
      styles={{
        body: {
          maxWidth: '1400px',
          width: '100%',
          padding: '24px'
        },
        header: {
          padding: '20px 24px 0 24px'
        },
        content: {
          maxHeight: '90vh',
          overflow: 'auto'
        }
      }}
    >
      <Stack gap="lg">
        {/* 已设置的时间安排列表 */}
        <Box>
          <Title order={4} mb="sm">
            <Group gap="xs">
              <IconCalendar size={20} />
              現在の予約可能時間枠 ({currentSchedules.length}件)
            </Group>
          </Title>
          
          {loading.schedules ? (
            <Card p="md" withBorder>
              <Group justify="center">
                <Loader size="sm" />
                <Text>時間枠を読み込み中...</Text>
              </Group>
            </Card>
          ) : currentSchedules.length === 0 ? (
            <Card p="md" withBorder>
              <Text c="dimmed" ta="center">まだ時間枠が設定されていません</Text>
            </Card>
          ) : (
            <Card p="md" withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>日付</Table.Th>
                    <Table.Th>時間</Table.Th>
                    <Table.Th>時間長</Table.Th>
                    <Table.Th>作成日</Table.Th>
                    <Table.Th>削除</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {currentSchedules
                    .sort((a, b) => new Date(a.available_date).getTime() - new Date(b.available_date).getTime())
                    .map((schedule) => (
                    <Table.Tr key={schedule.id}>
                      <Table.Td>
                        <Text fw={500}>{formatDate(schedule.available_date)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <IconClock size={14} />
                          <Text>{schedule.start_time} - {schedule.end_time}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge color="blue" variant="light">
                          {calculateDuration(schedule.start_time, schedule.end_time)}時間
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {new Date(schedule.created_at).toLocaleDateString('ja-JP')}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="削除">
                            <ActionIcon 
                              variant="light" 
                              color="red" 
                              size="sm"
                              onClick={() => handleDeleteSchedule(schedule.id)}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          )}
        </Box>

        <Divider />

        {/* 当前时间枠 - 周历视图 */}
        <Box>
          <Title order={4} mb="sm">週間カレンダー表示</Title>
          
          {/* 调试信息 - 显示当前加载的时间安排 */}
          {(currentSchedules.length > 0 || currentReservations.length > 0) && (
            <Card p="xs" mb="md" withBorder style={{ backgroundColor: '#f8f9fa' }}>
              <Text size="xs" c="dimmed" mb="xs">デバッグ情報 - 読み込まれた時間枠:</Text>
              <Group gap="xs" wrap="wrap">
                {currentSchedules
                  .filter(schedule => {
                    // 只显示当前周包含的时间安排
                    const scheduleDate = new Date(schedule.available_date + 'T00:00:00');
                    const weekStart = new Date(weekDates[0]);
                    const weekEnd = new Date(weekDates[6]);
                    weekEnd.setHours(23, 59, 59, 999); // 设置为当天的最后一刻
                    
                    const isInWeek = scheduleDate >= weekStart && scheduleDate <= weekEnd;
                    console.log(`检查时间安排: ${schedule.available_date}, 周开始: ${weekStart.toISOString()}, 周结束: ${weekEnd.toISOString()}, 是否在周内: ${isInWeek}`);
                    
                    return isInWeek;
                  })
                  .map((schedule, index) => (
                  <Badge key={index} size="xs" variant="outline">
                    {schedule.available_date}: {schedule.start_time}-{schedule.end_time}
                  </Badge>
                ))}
              </Group>
              
              <Text size="xs" c="dimmed" mb="xs" mt="sm">
                デバッグ情報 - 読み込まれた予約記録: {currentReservations.length}件
              </Text>
              {currentReservations.length > 0 && (
                <>
                  <Text size="xs" c="dimmed" mb="xs">現在の週の予約記録:</Text>
                  <Group gap="xs" wrap="wrap">
                    {currentReservations
                      .filter(reservation => {
                        // 只显示当前周包含的预约记录
                        const reservationDate = new Date(reservation.booking_date + 'T00:00:00');
                        const weekStart = new Date(weekDates[0]);
                        const weekEnd = new Date(weekDates[6]);
                        weekEnd.setHours(23, 59, 59, 999);
                        
                        const isInWeek = reservationDate >= weekStart && reservationDate <= weekEnd;
                        console.log(`预约记录 ${reservation.booking_date} 是否在当前周:`, isInWeek, {
                          reservationDate: reservationDate.toISOString(),
                          weekStart: weekStart.toISOString(),
                          weekEnd: weekEnd.toISOString()
                        });
                        
                        return isInWeek;
                      })
                      .map((reservation, index) => (
                      <Badge key={index} size="xs" variant="outline" color="red">
                        {reservation.booking_date}: {reservation.start_time}-{reservation.end_time} (ユーザー: {reservation.user_name})
                      </Badge>
                    ))}
                  </Group>
                </>
              )}
            </Card>
          )}
          
          <Box>
            {/* 周导航 */}
            <Group justify="space-between" mb="md">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentWeekOffset(prev => prev - 1)}
              >
                ← 前の週
              </Button>
              <Text fw={500} size="sm">
                {currentYear}年{currentMonth}月
              </Text>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentWeekOffset(prev => prev + 1)}
              >
                次の週 →
              </Button>
            </Group>

            {/* 周历网格 */}
            <Box style={{ overflowX: 'auto' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '80px repeat(7, 1fr)',
                gap: '1px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {/* 时间列标题 */}
                <div style={{ 
                  padding: '12px 8px', 
                  backgroundColor: '#f8f9fa', 
                  borderRight: '1px solid #e0e0e0',
                  fontWeight: 600,
                  fontSize: '12px',
                  textAlign: 'center'
                }}>
                  時間
                </div>
                
                {/* 日期列标题 */}
                {weekDates.map((date, index) => (
                  <div key={index} style={{ 
                    padding: '12px 8px', 
                    backgroundColor: '#f8f9fa', 
                    borderRight: index < 6 ? '1px solid #e0e0e0' : 'none',
                    fontWeight: 600,
                    fontSize: '12px',
                    textAlign: 'center'
                  }}>
                    {formatDateDisplay(date)}
                  </div>
                ))}

                {/* 时间槽行 */}
                {timeSlots.map((timeSlot, timeIndex) => (
                  <React.Fragment key={timeSlot}>
                    {/* 时间标签 */}
                    <div style={{ 
                      padding: '8px 4px', 
                      backgroundColor: '#f8f9fa', 
                      borderRight: '1px solid #e0e0e0',
                      borderTop: timeIndex > 0 ? '1px solid #e0e0e0' : 'none',
                      fontSize: '11px',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '30px'
                    }}>
                      {timeSlot}
                    </div>
                    
                    {/* 每天的时间槽 - 第二步：根据数据正确显示 */}
                    {weekDates.map((date, dateIndex) => {
                      const isAvailable = isTimeSlotAvailable(date, timeSlot);
                      const isPast = date < new Date() && date.toDateString() !== new Date().toDateString();
                      const reservation = getTimeSlotReservation(date, timeSlot);
                      
                      // 确定背景色和文本
                      let backgroundColor = '#f0f0f0'; // 默认灰色
                      let textColor = '#666';
                      let displayText = '未設定';
                      
                      if (isPast) {
                        backgroundColor = '#f5f5f5';
                        textColor = '#999';
                        displayText = '過去';
                      } else if (reservation) {
                        // 根据预约状态设置不同的颜色
                        if (reservation.status === 'cancelled') {
                          backgroundColor = '#f5f5f5'; // 灰色 - 已取消
                          textColor = '#999';
                          displayText = `キャンセル済 (${reservation.user_name})`;
                        } else if (reservation.status === 'pending') {
                          backgroundColor = '#fff3cd'; // 黄色 - 待确认
                          textColor = '#856404';
                          displayText = `待確認 (${reservation.user_name})`;
                        } else {
                          backgroundColor = '#ffe6e6'; // 淡红色 - 已确认
                          textColor = '#d32f2f';
                          displayText = `予約済 (${reservation.user_name})`;
                        }
                      } else if (isAvailable) {
                        backgroundColor = '#e8f5e8'; // 薄緑色
                        textColor = '#2d5a2d';
                        displayText = '予約可';
                      }
                      
                      return (
                        <div key={dateIndex} style={{ 
                          padding: '4px',
                          backgroundColor: backgroundColor,
                          borderRight: dateIndex < 6 ? '1px solid #e0e0e0' : 'none',
                          borderTop: timeIndex > 0 ? '1px solid #e0e0e0' : 'none',
                          minHeight: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: textColor
                        }}>
                          {displayText}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </Box>

            {/* 图例说明 */}
            <Group gap="md" mt="sm" style={{ fontSize: '12px' }}>
              <Group gap="xs">
                <div style={{ 
                  width: '16px', 
                  height: '16px', 
                  backgroundColor: '#e8f5e8', 
                  border: '1px solid #ccc',
                  borderRadius: '2px'
                }}></div>
                <Text size="xs">予約可能な時間帯</Text>
              </Group>
              <Group gap="xs">
                <div style={{ 
                  width: '16px', 
                  height: '16px', 
                  backgroundColor: '#ffe6e6', 
                  border: '1px solid #ccc',
                  borderRadius: '2px'
                }}></div>
                <Text size="xs">予約済みの時間帯</Text>
              </Group>
              <Group gap="xs">
                <div style={{ 
                  width: '16px', 
                  height: '16px', 
                  backgroundColor: '#f0f0f0', 
                  border: '1px solid #ccc',
                  borderRadius: '2px'
                }}></div>
                <Text size="xs">未設定の時間帯</Text>
              </Group>
              <Group gap="xs">
                <div style={{ 
                  width: '16px', 
                  height: '16px', 
                  backgroundColor: '#f5f5f5', 
                  border: '1px solid #ccc',
                  borderRadius: '2px'
                }}></div>
                <Text size="xs">過去の日付</Text>
              </Group>
            </Group>
          </Box>
        </Box>

        <Divider />

        {/* 添加新时间枠 */}
        <Box>
          <Title order={4} mb="sm">新しい時間枠を追加</Title>
          <Stack gap="md">
            <Group grow>
              <TextInput
                label="開始日 *"
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.currentTarget.value)}
                min={(() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  return tomorrow.toISOString().split('T')[0];
                })()}
                required
              />
              <TextInput
                label="終了日 *"
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.currentTarget.value)}
                min={startDate || (() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  return tomorrow.toISOString().split('T')[0];
                })()}
                required
              />
            </Group>
            
            <Group grow>
              <Select
                label="開始時間 *"
                placeholder="時間を選択"
                value={startHour}
                onChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    startHour: value || '',
                    endHour: ''
                  }));
                }}
                data={timeOptions}
                required
                clearable={false}
              />
              <Select
                label="終了時間 *"
                placeholder={startHour ? "時間を選択" : "開始時間を先に選択してください"}
                value={endHour}
                onChange={(value) => setFormData(prev => ({ ...prev, endHour: value || '' }))}
                data={endTimeOptions}
                required
                disabled={!startHour}
                clearable={false}
              />
            </Group>
            
            <Group justify="flex-end" gap="xs">
              <Button variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button onClick={handleSaveSchedule}>
                保存
              </Button>
            </Group>
          </Stack>
        </Box>
      </Stack>
    </Modal>
  );
};

export default ScheduleModal;
