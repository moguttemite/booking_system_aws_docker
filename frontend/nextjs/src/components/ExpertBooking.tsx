"use client";
import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Image, Modal, Loader, Select, Button, Flex, Box, Badge, Text, Alert, Skeleton } from '@mantine/core';
import { IconAlertCircle, IconCalendar, IconClock, IconUser } from '@tabler/icons-react';

import { BookableTeacher } from '@/types/booking';
import { generateFinalBookableSlots, getAvailableEndTimes } from '@/lib/utils';
import { fetchLectureSchedulesOld as fetchLectureSchedules, fetchLectureReservations, fetchLectureTeachers, fetchBookableLectures, fetchLectureTeachersByLectureId, fetchTeacherProfile } from '@/lib/api';
import useAuthStore from '@/store/useUserStore';
import { SimplifiedReservationRecord } from '@/lib/api';
import { getWeekOfMonth, getWeekDates, getDateKey, formatDateDisplay, timeOptions } from '@/lib/booking_tools';
import { useErrorHandler } from '@/lib/errorHandler';
import { withErrorHandling, withNetworkErrorHandling, withAuthErrorHandling } from '@/lib/apiErrorHandler';

// 定义时间段映射类型
type SlotMap = Record<string, string[]>;

// 独立的内容区域组件，使用memo避免不必要的重新渲染
const BookingContent = memo(({ 
  selectedTeacher, 
  weekOffset, 
  weekDatesMemo, 
  yearMemo, 
  monthMemo, 
  weekOfMonthMemo, 
  allSlotsMemo, 
  availableTimes, 
  loading, 
  selected, 
  onOpenModal, 
  onPrevWeek, 
  onNextWeek 
}: {
  selectedTeacher: BookableTeacher | null;
  weekOffset: number;
  weekDatesMemo: any[];
  yearMemo: number;
  monthMemo: number;
  weekOfMonthMemo: number;
  allSlotsMemo: string[];
  availableTimes: SlotMap;
  loading: boolean;
  selected: string | null;
  onOpenModal: (date: Date, time: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}) => {
  const handlePrevWeek = useCallback(() => {
    onPrevWeek();
  }, [onPrevWeek]);

  const handleNextWeek = useCallback(() => {
    onNextWeek();
  }, [onNextWeek]);

  return (
    <>
      {/* 预约说明区域 */}
      <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded shadow-sm text-sm text-gray-800 whitespace-pre-line">
        ・予約枠：1時間  ・受付締切：1日前の17時まで  ・受付開始：30日前の0時から
      </div>

      {/* 信息提示，切换周 */}
      <div className="flex justify-between items-center mb-4 text-gray-700 font-medium">
        <Button variant="default" onClick={handlePrevWeek} disabled={loading}>
          ← 前の週
        </Button>
        <p className="text-base">{yearMemo}年{monthMemo}月 第{weekOfMonthMemo}週</p>
        <Button variant="default" onClick={handleNextWeek} disabled={loading}>
          次の週 →
        </Button>
      </div>

      {/* 周历 - 简化动画配置 */}
      <div className="flex justify-center gap-4 flex-wrap pb-2">
        {loading ? (
          <div className="mx-auto mt-10">
            <Loader size="lg" />
          </div>
        ) : (
          weekDatesMemo.map(({ date, isPast }, idx) => {
            const key = getDateKey(date);
            const reserved = availableTimes[key] || [];
            return (
              <div
                key={`date-${key}-${idx}`}
                className={`min-w-[120px] w-[120px] h-[380px] max-h-[380px] overflow-y-auto border rounded-lg p-3 shadow-sm transition-colors duration-200 ${
                  isPast 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white hover:shadow-md hover:bg-green-50'
                }`}
                style={{ willChange: 'auto' }}
              >
                <div className="text-sm font-semibold text-center w-full">{formatDateDisplay(date)}</div>
                <div className="mt-4 text-xs text-center">
                  {isPast ? '（過去日付のため予約不可）' : (
                    <ul className="space-y-1 mt-2">
                      {allSlotsMemo.map((time, i) => {
                        const isAvailable = !!selected && reserved.includes(time);
                        return (
                          <li
                            key={`${key}-${time}`}
                            className={`border rounded px-2 py-1 text-xs transition-colors duration-150 ${
                              isAvailable 
                                ? 'bg-green-100 hover:bg-green-200 cursor-pointer' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                            onClick={() => isAvailable && onOpenModal(date, time)}
                          >
                            {time}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
});

BookingContent.displayName = 'BookingContent';

// 讲座信息组件，独立缓存
const LectureInfo = memo(({ 
  selectedTeacher, 
  selectedTeacherName,
  selectedTeacherDetails,
  loading
}: { 
  selectedTeacher: BookableTeacher | null;
  selectedTeacherName?: string;
  selectedTeacherDetails: any;
  loading: boolean;
}) => {
  if (!selectedTeacher) return null;
  
  // 检查是否为多讲师讲座
  const isMultiTeacher = selectedTeacher.is_multi_teacher;
  
  return (
    <div className="flex items-start gap-6 mb-8 bg-white p-4 rounded-lg shadow-md">
             <div className="w-32 h-48 rounded-xl overflow-hidden flex-shrink-0">
                  {loading ? (
            <Skeleton height={192} radius="12px" />
          ) : (
            <Image 
              src={selectedTeacherDetails?.profile_image || "/default_avatar.png"} 
              alt="講師の写真" 
              width={128} 
              height={192} 
              style={{ objectFit: 'cover', borderRadius: '12px' }}
              loading="eager" // 预加载图片
            />
          )}
       </div>
      <div className="flex-1">
        {loading ? (
          <div className="space-y-2">
            <Skeleton height={20} width="60%" />
            <Skeleton height={16} width="80%" />
            <Skeleton height={16} width="70%" />
            <Skeleton height={16} width="90%" />
          </div>
        ) : (
          <>
                                                   <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>テーマ：{selectedTeacher.lecture_title || "（タイトル未設定）"}</li>
                <li>講演内容：{selectedTeacher.lecture_description || "内容未設定"}</li>
                <li>講師紹介：{selectedTeacherDetails?.bio || selectedTeacher.teacher_name + 'の講座です'}</li>
              </ol>
            
            {/* 讲师信息显示 */}
            {selectedTeacherName && (
              <div className={`mt-4 p-3 rounded-lg ${isMultiTeacher ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <Badge 
                    color={isMultiTeacher ? "blue" : "green"} 
                    variant="filled"
                  >
                    {isMultiTeacher ? "複数講師講座" : "単一講師講座"}
                  </Badge>
                  <Text size="sm" fw={600}>
                    選択講師：{selectedTeacherName}
                  </Text>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

LectureInfo.displayName = 'LectureInfo';

// 讲座选择组件，独立缓存
const LectureSelector = memo(({ 
  options, 
  selected, 
  onSelectedChange,
  teacherOptions,
  selectedTeacher,
  onTeacherChange,
  isMultiTeacherLecture,
  loading
}: { 
  options: { value: string; label: string }[];
  selected: string | null;
  onSelectedChange: (value: string | null) => void;
  teacherOptions: { value: string; label: string }[];
  selectedTeacher: string | null;
  onTeacherChange: (value: string | null) => void;
  isMultiTeacherLecture: boolean;
  loading: boolean;
}) => {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Flex align="center">
        <Box w={60} fw={600}>
          講座
        </Box>
        <Select
          className='w-[400px]'
          placeholder="講座を選んでください"
          data={options}
          value={selected}
          onChange={onSelectedChange}
          comboboxProps={{ withinPortal: true }}
          w={400}
          disabled={loading}
        />
      </Flex>
      
      {/* 讲师选择 - 仅多讲师讲座显示 */}
      {isMultiTeacherLecture && (
        <Flex align="center">
          <Select
            className='w-[200px]'
            placeholder="講師選択"
            data={teacherOptions}
            value={selectedTeacher}
            onChange={onTeacherChange}
            comboboxProps={{ withinPortal: true }}
            w={200}
            disabled={loading}
          />
        </Flex>
      )}
    </div>
  );
});

LectureSelector.displayName = 'LectureSelector';

const ExpertBooking = () => {
  // 错误处理 hook
  const { handleError, handleApiError, handleNetworkError, handleAuthError, showSuccessNotification } = useErrorHandler();
  
  // 预约页面的各种状态管理
  const [weekOffset, setWeekOffset] = useState(0); // 当前周的偏移量（用于切换前后周）
  const [modalOpen, setModalOpen] = useState(false); // 预约弹窗是否打开
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null); // 当前选中的预约时间段
  const [availableTimes, setAvailableTimes] = useState<SlotMap>({}); // 当前讲师本周可预约时间段映射
  const [loading, setLoading] = useState(false); // 数据加载中状态
  const [error, setError] = useState<string | null>(null); // 错误状态
  const [startTime, setStartTime] = useState(''); // 预约开始时间
  const [endTime, setEndTime] = useState(''); // 预约结束时间

  const [lectureOptions, setLectureOptions] = useState<{ value: string; label: string }[]>([]); // 讲座下拉框选项
  const [selectedLecture, setSelectedLecture] = useState<string | null>(null); // 当前选中的讲座
  const [bookableList, setBookableList] = useState<BookableTeacher[]>([]); // 可预约讲座列表
  
  // 多讲师讲座相关状态
  const [teacherOptions, setTeacherOptions] = useState<{ value: string; label: string }[]>([]); // 讲师下拉框选项
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null); // 当前选中的讲师
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>(''); // 当前选中讲师的姓名
  
  // 讲师详情状态
  const [selectedTeacherDetails, setSelectedTeacherDetails] = useState<any>(null);
  
  const [confirmModalOpen, setConfirmModalOpen] = useState(false); // 预约确认弹窗是否打开
  const user = useAuthStore((state) => state.user); // 当前登录用户信息
  const token = useAuthStore((state) => state.token); // 当前登录用户的token
  const [pendingReservation, setPendingReservation] = useState<{
    date: string;
    start: string;
    end: string;
    userName: string;
  } | null>(null); // 待提交的预约信息

  // 缓存数据
  const [dataCache, setDataCache] = useState<Record<string, SlotMap>>({});

  // 新增：预约提交状态管理
  const [isSubmitting, setIsSubmitting] = useState(false); // 预约提交中状态
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    message: string;
    booking_id?: number;
  } | null>(null); // 预约提交结果
  
  // 检查认证状态
  const isAuthenticated = useMemo(() => {
    return Boolean(user && token);
  }, [user, token]);

  // 组件初始化函数
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 获取可预约讲座列表 - 使用后端API，包装错误处理
        const data: BookableTeacher[] = await withNetworkErrorHandling(
          () => fetchBookableLectures(),
          'fetchBookableLectures',
          { 
            showNotification: true,
            customMessage: '講座データの取得に失敗しました'
          }
        );
        
        // 只显示已批准的讲座
        const approvedData = data.filter(item => item.approval_status === "approved");
        
        setBookableList(approvedData);
        
        // 处理讲座下拉选项
        const formatted = approvedData.map((item, idx) => {
          let label = `${item.lecture_title || "タイトル未定"}`;
          
          if (item.is_multi_teacher) {
            label += ` (複数講師講座)`;
          } else {
            label += ` (${item.teacher_name})`;
          }
          
          return {
            value: `${idx}`,
            label: label,
          };
        });

        setLectureOptions(formatted);
      } catch (error) {
        handleApiError(error, 'fetchBookableLectures');
        setError('講座データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // 移除 handleApiError 依赖，因为它是稳定的函数
  
  // 获取当前选中的讲座信息
  const selectedLectureData = selectedLecture ? bookableList[parseInt(selectedLecture)] : null;

  // 检查是否为多讲师讲座 - 使用useMemo优化
  const isMultiTeacherLecture = useMemo(() => {
    return Boolean(selectedLectureData && selectedLectureData.is_multi_teacher);
  }, [selectedLectureData]);

    // 当选择讲座时，如果是多讲师讲座，设置讲师选项
  useEffect(() => {
    const fetchTeachers = async () => {
      if (isMultiTeacherLecture && selectedLectureData) {
        try {
          // 从后端API获取该讲座的所有讲师，包装错误处理
          const teachers = await withNetworkErrorHandling(
            () => fetchLectureTeachersByLectureId(selectedLectureData.id),
            'fetchLectureTeachersByLectureId',
            { 
              showNotification: false, // 不显示通知，静默处理
              customMessage: '講師データの取得に失敗しました'
            }
          );
          
          // 过滤掉无效的讲师记录，确保teacher_id和teacher_name都存在
          const validTeachers = teachers.filter(teacher => 
            teacher && 
            typeof teacher.teacher_id === 'number' && 
            teacher.teacher_name && 
            typeof teacher.teacher_name === 'string'
          );
          
          // 转换为下拉选项格式，使用teacher_id作为value，teacher_name作为label
          const teacherOptionsData = validTeachers.map(teacher => ({
            value: teacher.teacher_id.toString(),
            label: teacher.teacher_name,
          }));
         
          setTeacherOptions(teacherOptionsData);
          setSelectedTeacher(null); // 重置讲师选择
          setSelectedTeacherName(''); // 重置讲师姓名
        } catch (error) {
          handleApiError(error, 'fetchLectureTeachersByLectureId');
          // 如果API调用失败，使用空数组
          setTeacherOptions([]);
          setSelectedTeacher(null);
          setSelectedTeacherName('');
        }
      } else {
        setTeacherOptions([]);
        setSelectedTeacher(null);
        setSelectedTeacherName('');
      }
    };

    fetchTeachers();
  }, [selectedLecture, selectedLectureData, isMultiTeacherLecture]); // 移除 handleApiError 依赖

    // 当allTeachers数据加载完成后，更新讲师选项
  useEffect(() => {
    const fetchTeachers = async () => {
              if (isMultiTeacherLecture && selectedLectureData) {
          try {
                         // 从后端API获取该讲座的所有讲师
             const teachers = await fetchLectureTeachersByLectureId(selectedLectureData.id);
             
             // 过滤掉无效的讲师记录，确保teacher_id和teacher_name都存在
             const validTeachers = teachers.filter(teacher => 
               teacher && 
               typeof teacher.teacher_id === 'number' && 
               teacher.teacher_name && 
               typeof teacher.teacher_name === 'string'
             );
             
             // 转换为下拉选项格式，使用teacher_id作为value，teacher_name作为label
             const teacherOptionsData = validTeachers.map(teacher => ({
               value: teacher.teacher_id.toString(),
               label: teacher.teacher_name,
             }));
             
             setTeacherOptions(teacherOptionsData);
          } catch (error) {
            console.error('講師データの取得に失敗しました:', error);
            // 如果API调用失败，使用空数组
            setTeacherOptions([]);
          }
        }
    };

    fetchTeachers();
  }, [isMultiTeacherLecture, selectedLectureData]);

  // 当选择讲座或讲师时，获取讲师详情
  useEffect(() => {
    const fetchTeacherDetails = async () => {
      try {
        let teacherId: number;
        
        if (isMultiTeacherLecture && selectedTeacher) {
          // 多讲师讲座：使用选择的讲师ID
          teacherId = parseInt(selectedTeacher);
          const teacherOption = teacherOptions.find(option => option.value === selectedTeacher);
          setSelectedTeacherName(teacherOption?.label || '');
        } else if (!isMultiTeacherLecture && selectedLectureData) {
          // 单讲师讲座：直接使用讲座数据中的teacher_id
          if (selectedLectureData.teacher_id) {
            teacherId = selectedLectureData.teacher_id;
            setSelectedTeacherName(selectedLectureData.teacher_name);
          } else {
            // 如果没有teacher_id，跳过详情获取
            console.warn('讲座数据中没有teacher_id:', selectedLectureData);
            setSelectedTeacherDetails(null);
            setSelectedTeacherName(selectedLectureData.teacher_name);
            return;
          }
        } else {
          // 没有选择讲座或讲师
          setSelectedTeacherName('');
          setSelectedTeacherDetails(null);
          return;
        }
        
        // 获取讲师详情，包装错误处理
        const teacherDetails = await withNetworkErrorHandling(
          () => fetchTeacherProfile(teacherId),
          'fetchTeacherProfile',
          { 
            showNotification: false, // 不显示通知，静默处理
            customMessage: '講師詳細情報の取得に失敗しました'
          }
        );
        setSelectedTeacherDetails(teacherDetails);
      } catch (error) {
        handleApiError(error, 'fetchTeacherProfile');
        setSelectedTeacherDetails(null);
      }
    };
    
    fetchTeacherDetails();
  }, [selectedLecture, selectedTeacher, selectedLectureData, isMultiTeacherLecture, teacherOptions]); // 移除 handleApiError 依赖

  // 当讲座或讲师选择发生变化时，重置周偏移到当前周
  useEffect(() => {
    // 只有当讲座或讲师选择发生变化时，才重置周偏移
    if (selectedLecture !== null || selectedTeacher !== null) {
      setWeekOffset(0);
    }
  }, [selectedLecture, selectedTeacher]);

  // 获取当前周的日期信息
  const weekDates = getWeekDates(weekOffset);

  // 获取当前周的开始日期
  const startDate = weekDates[0].date;

  // 获取当前周的开始日期
  const year = startDate.getFullYear();
  const month = startDate.getMonth() + 1;

  // 获取当前周是本月的第几周
  const weekOfMonth = getWeekOfMonth(startDate);

  // 优化：使用useMemo缓存计算结果，减少不必要的重新渲染
  const weekDatesMemo = useMemo(() => weekDates, [weekOffset]);
  const yearMemo = useMemo(() => year, [weekOffset]);
  const monthMemo = useMemo(() => month, [weekOffset]);
  const weekOfMonthMemo = useMemo(() => weekOfMonth, [weekOffset]);

  // 优化：缓存allSlots数组，避免每次渲染都重新计算
  const allSlotsMemo = useMemo(() => {
    return Array.from({ length: 21 }, (_, i) => {
      const hour = 10 + Math.floor(i / 2);
      const min = i % 2 === 0 ? '00' : '30';
      return `${String(hour).padStart(2, '0')}:${min}`;
    });
  }, []);

  // 优化：缓存周切换函数，避免重新创建
  const handlePrevWeek = useCallback(() => {
    setWeekOffset((prev) => prev - 1);
  }, []);

  const handleNextWeek = useCallback(() => {
    setWeekOffset((prev) => prev + 1);
  }, []);

  // 优化：缓存openModal函数，避免重新创建
  const openModal = useCallback((date: Date, time: string) => {
    // 20:00 不能预约  --  后续有可能增加其他限制比如某事件之后没有可预约的连续时间段
    if (time === "20:00") {
      setSelectedSlot({ date: getDateKey(date), time });
      setStartTime(time);
      setEndTime(""); // 不设置结束时间
      setModalOpen(true); // 弹窗照样弹出，但不允许操作
      return;
    }

    
    setSelectedSlot({ date: getDateKey(date), time });
    setStartTime(time);
    const nextIdx = timeOptions.findIndex((t) => t === time) + 1;
    if (nextIdx < timeOptions.length) {
      setEndTime(timeOptions[nextIdx]);
    } else {
      setEndTime(''); // 超出范围
    }

    // 打开预约模态框
    setModalOpen(true);
  }, []);

  // 优化：使用useCallback缓存函数，减少重新渲染
  const fetchAvailableTimes = useCallback(async (lectureId: number) => {
    try {
      const schedules = await withNetworkErrorHandling(
        () => fetchLectureSchedules(lectureId),
        'fetchLectureSchedules',
        { 
          showNotification: false,
          customMessage: '講座スケジュールの取得に失敗しました'
        }
      );
      
      const reservations = await withNetworkErrorHandling(
        () => fetchLectureReservations(lectureId),
        'fetchLectureReservations',
        { 
          showNotification: false,
          customMessage: '予約情報の取得に失敗しました'
        }
      );
      
      const finalMap = generateFinalBookableSlots(schedules, reservations);
      return finalMap;
    } catch (err) {
      handleApiError(err, 'fetchAvailableTimes');
      return {};
    }
  }, []); // 移除 handleApiError 依赖

  // 获取当前周的可预约时间段 - 优化加载逻辑，避免闪烁
  useEffect(() => {
    const loadTimes = async () => {
      if (!selectedLectureData) {
        setAvailableTimes({});
        return;
      }

      // 如果是多讲师讲座，需要选择讲师才能显示时间
      if (isMultiTeacherLecture && !selectedTeacher) {
        setAvailableTimes({});
        return;
      }
      
      // 生成缓存键
      const cacheKey = `${selectedLectureData.id}-${selectedTeacher || 'single'}`;
      
      // 检查缓存中是否已有数据
      if (dataCache[cacheKey]) {
        setAvailableTimes(dataCache[cacheKey]);
        setLoading(false);
        return;
      }
      
      // 如果没有缓存数据，设置loading状态
      setLoading(true);
      
      try {
        // 获取当前选择的讲师ID
        const currentTeacherId = selectedTeacher ? parseInt(selectedTeacher) : 0;
        const finalMap = await fetchAvailableTimes(selectedLectureData.id);
        
        // 更新状态和缓存
        setAvailableTimes(finalMap);
        setDataCache(prev => ({ ...prev, [cacheKey]: finalMap }));
        setError(null); // 清除之前的错误
      } catch (error) {
        console.error("Failed to load available times:", error);
        setAvailableTimes({});
        setError("予約可能時間の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    // 使用较短的防抖延迟，减少闪烁
    const timeoutId = setTimeout(loadTimes, 50);
    return () => clearTimeout(timeoutId);
  }, [selectedLectureData, selectedTeacher, fetchAvailableTimes, isMultiTeacherLecture, dataCache]);

  // 当讲座或讲师改变时，清空当前显示的数据
  useEffect(() => {
    // 清空当前显示的数据，但保留缓存
    setAvailableTimes({});
  }, [selectedLectureData?.id, selectedTeacher]);

  // 认证状态检查函数
  const checkAuthStatus = useCallback(async (token: string): Promise<boolean> => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const res = await fetch(`${apiBase}/check-auth-status`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        // 认证失败，清除认证状态
        useAuthStore.getState().logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('認証状態チェックエラー:', error);
      // 网络错误时也清除认证状态
      useAuthStore.getState().logout();
      return false;
    }
  }, []);

  // 生成可用的开始时间点（后面还有半小时可预约的时间点，且大于等于 minStartTime）
  const getAvailableStartTimes = useCallback((availableTimes: string[], minStartTime?: string): string[] => {
    return availableTimes.filter((time, idx) => {
      if (minStartTime && time < minStartTime) return false;
      const [h, m] = time.split(":").map(Number);
      let nextH = h, nextM = m + 30;
      if (nextM === 60) { nextH += 1; nextM = 0; }
      const nextStr = `${String(nextH).padStart(2, '0')}:${nextM === 0 ? '00' : '30'}`;
      return availableTimes.includes(nextStr);
    });
  }, []);

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-6 mt-16 bg-gray-50 rounded-xl shadow-md">
             {/* 标题 */}
       <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-800 tracking-wide">
         ご予約内容の選択
       </h1>
       
       
      
                     
       
               {!isAuthenticated && (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            title="認証エラー" 
            color="red" 
            variant="light"
            className="mb-4"
          >
            <div className="space-y-2">
              <div>ログインが必要です。再度ログインしてください。</div>
              <Button 
                size="xs" 
                color="blue" 
                variant="outline"
                onClick={() => {
                  // 清除当前认证状态
                  useAuthStore.getState().logout();
                                     // 重定向到登录页面
                   window.location.href = '/';
                }}
              >
                ログインページへ
              </Button>
            </div>
          </Alert>
        )}
       
       {/* 错误显示 */}
       {error && (
         <Alert 
           icon={<IconAlertCircle size={16} />} 
           title="エラー" 
           color="red" 
           variant="light"
           className="mb-4"
         >
           {error}
         </Alert>
       )}
      
      {/* 讲座选择 - 独立组件 */}
      <LectureSelector 
        options={lectureOptions}
        selected={selectedLecture}
        onSelectedChange={setSelectedLecture}
        teacherOptions={teacherOptions}
        selectedTeacher={selectedTeacher}
        onTeacherChange={setSelectedTeacher}
        isMultiTeacherLecture={isMultiTeacherLecture}
        loading={loading}
      />

      {/* 讲座信息 - 独立组件 */}
      {/* 多讲师讲座需要选择讲师后才显示，单讲师讲座直接显示 */}
      {selectedLectureData && (
        !isMultiTeacherLecture || (isMultiTeacherLecture && selectedTeacher)
      ) && (
        <LectureInfo 
          selectedTeacher={selectedLectureData} 
          selectedTeacherName={
            selectedLectureData 
              ? isMultiTeacherLecture 
                ? selectedTeacherName 
                : selectedLectureData.teacher_name
              : undefined
          }
          selectedTeacherDetails={selectedTeacherDetails}
          loading={loading}
        />
      )}

      {/* 多讲师讲座但未选择讲师的提示 */}
      {selectedLectureData && isMultiTeacherLecture && !selectedTeacher && !loading && (
        <div className="text-center py-12">
          <IconUser size={48} className="mx-auto text-gray-400 mb-4" />
          <Text size="lg" c="dimmed" mb="md">
            講師を選択してください
          </Text>
          <Text size="sm" c="dimmed">
            上記の講師選択から、予約したい講師を選んでください
          </Text>
        </div>
      )}

      {/* 空状态显示 */}
      {!selectedLectureData && !loading && (
        <div className="text-center py-12">
          <IconCalendar size={48} className="mx-auto text-gray-400 mb-4" />
          <Text size="lg" c="dimmed" mb="md">
            講座を選択してください
          </Text>
          <Text size="sm" c="dimmed">
            上記の講座選択から、予約したい講座を選んでください
          </Text>
        </div>
      )}

      {/* 独立的内容区域组件 */}
      {/* 多讲师讲座需要选择讲师后才显示，单讲师讲座直接显示 */}
      {selectedLectureData && (
        !isMultiTeacherLecture || (isMultiTeacherLecture && selectedTeacher)
      ) && (
        <BookingContent
          selectedTeacher={selectedLectureData}
          weekOffset={weekOffset}
          weekDatesMemo={weekDatesMemo}
          yearMemo={yearMemo}
          monthMemo={monthMemo}
          weekOfMonthMemo={weekOfMonthMemo}
          allSlotsMemo={allSlotsMemo}
          availableTimes={availableTimes}
          loading={loading}
          selected={selectedLecture}
          onOpenModal={openModal}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
        />
      )}

      {/* 预约模态框 */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <IconCalendar size={20} />
            <span>予約</span>
          </div>
        }
        centered
        size="md"
      >
        <div className="space-y-4">
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            color="blue" 
            variant="light"
            className="text-sm"
          >
            前日の17時まで仮決め可。以降は全額請求となります。
          </Alert>
          
          {selectedSlot && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <IconCalendar size={16} />
              <span>日付: {selectedSlot.date}</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <IconClock size={16} className="text-gray-600" />
              <label className="text-sm font-medium">開始時間：</label>
              <Select
                key={startTime}
                value={startTime}
                onChange={(value) => {
                  const newStart = value || '';
                  setStartTime(newStart);
                  const newEndOptions = getAvailableEndTimes(newStart, availableTimes[selectedSlot?.date || ''] || []);
                  setEndTime(newEndOptions.length > 0 ? newEndOptions[0] : '');
                }}
                placeholder="開始時間を選択"
                data={availableTimes[selectedSlot?.date || ''] || []}
                styles={{ dropdown: { zIndex: 9999 } }}
                className="flex-1"
                w={200}
              />
            </div>

            {/* 20:00 禁止预约提示 */}
            {startTime === "20:00" ? (
              <Alert 
                icon={<IconAlertCircle size={16} />} 
                color="orange" 
                variant="light"
                className="text-sm"
              >
                この講座は <strong>20:00</strong> までです。それ以降の時間は予約できません。
              </Alert>
            ) : (
              <div className="flex items-center gap-3">
                <IconClock size={16} className="text-gray-600" />
                <label className="text-sm font-medium">終了時間：</label>
                <Select
                  value={endTime}
                  onChange={(value) => setEndTime(value || '')}
                  placeholder="終了時間を選択"
                  data={getAvailableEndTimes(startTime, availableTimes[selectedSlot?.date || ''] || []).map(t => ({ label: t, value: t }))}
                  styles={{ dropdown: { zIndex: 9999 } }}
                  className="flex-1"
                  w={200}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              color="blue"
              radius="md"
              size="md"
              leftSection={<IconUser size={16} />}
                               onClick={async () => {
                   // 在打开预约确认窗口之前，先检查认证状态
                   try {
                     const token = useAuthStore.getState().token;
                     if (!token) {
                       alert('認証トークンがありません。再度ログインしてください。');
                       return;
                     }
                     
                     // 检查用户ID是否有效
                     const currentUser = useAuthStore.getState().user;
                     
                     if (!currentUser?.id || currentUser.id === 0) {
                       alert('ユーザーIDが無効です。ログイン情報が不完全です。再度ログインしてください。');
                       useAuthStore.getState().logout();
                       window.location.href = '/';
                       return;
                     }
                     
                     // 使用认证状态检查函数
                     const isAuthValid = await checkAuthStatus(token);
                     if (!isAuthValid) {
                       alert('認証が無効です。再度ログインしてください。');
                       window.location.href = '/';
                       return;
                     }
                     
                     // 认证成功，继续预约流程
                     const userName = currentUser.name;
                     setPendingReservation({
                       date: selectedSlot?.date || '',
                       start: startTime,
                       end: endTime,
                       userName: userName || '',
                     });
                     setConfirmModalOpen(true);
                     setModalOpen(false);
                   } catch (error) {
                     console.error('認証状態チェックエラー:', error);
                     alert('認証状態の確認に失敗しました。再度ログインしてください。');
                     useAuthStore.getState().logout();
                     window.location.href = '/';
                   }
                 }}
            >
              講座を予約する
            </Button>
          </div>
        </div>
      </Modal>

      {/* 预约确认模态框 */}
      <Modal
        opened={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <IconCalendar size={20} />
            <span>予約確認</span>
          </div>
        }
        centered
        size="md"
      >
        {pendingReservation && (
          <div className="space-y-4">
            <Alert 
              icon={<IconAlertCircle size={16} />} 
              color="blue" 
              variant="light"
              className="text-sm"
            >
              以下の内容で予約を確定しますか？
            </Alert>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <IconCalendar size={16} className="text-gray-600" />
                <span className="font-medium">日付・時間：</span>
                <span>{pendingReservation.date}　{pendingReservation.start}～{pendingReservation.end}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <IconUser size={16} className="text-gray-600" />
                <span className="font-medium">申込者：</span>
                <span>{pendingReservation.userName}</span>
              </div>
            </div>
            
            <Alert 
              icon={<IconAlertCircle size={16} />} 
              color="orange" 
              variant="light"
              className="text-sm"
            >
              <div className="font-medium mb-2">キャンセルポリシー</div>
              <div className="space-y-1 text-xs">
                <div>・予約前日までのキャンセル：無料</div>
                <div>・予約当日のキャンセル：全額請求</div>
              </div>
            </Alert>
            
                         {/* 认证状态检查 */}
             {!isAuthenticated && (
               <Alert 
                 icon={<IconAlertCircle size={16} />}
                 color="red"
                 variant="light"
                 className="text-sm"
               >
                 <div className="font-medium mb-2">認証エラー</div>
                 <div className="text-sm">
                   ログインが必要です。再度ログインしてください。
                 </div>
                 <Button 
                   size="xs" 
                   color="blue" 
                   variant="outline"
                   className="mt-2"
                   onClick={() => {
                     useAuthStore.getState().logout();
                     window.location.href = '/';
                   }}
                 >
                   ログインページへ
                 </Button>
               </Alert>
             )}
            
            {/* 提交结果显示 */}
            {submissionResult && (
              <Alert 
                icon={submissionResult.success ? <IconAlertCircle size={16} /> : <IconAlertCircle size={16} />}
                color={submissionResult.success ? "green" : "red"}
                variant="light"
                className="text-sm"
              >
                <div className="font-medium mb-2">
                  {submissionResult.success ? '予約完了' : '予約エラー'}
                </div>
                <div className="text-sm">
                  {submissionResult.message}
                  {submissionResult.success && submissionResult.booking_id && (
                    <div className="mt-1 text-xs text-gray-600">
                      予約ID: {submissionResult.booking_id}
                    </div>
                  )}
                </div>
              </Alert>
            )}

            <div className="flex gap-3 justify-center pt-2">
              <Button
                color="blue"
                size="md"
                leftSection={isSubmitting ? <Loader size={16} /> : <IconCalendar size={16} />}
                disabled={isSubmitting}
                                 onClick={async () => {
                   if (!pendingReservation || !selectedLectureData || !user) {
                     console.error('预约数据验证失败:', { pendingReservation, selectedLectureData, user });
                     alert('予約データが不完全です。ログイン状態を確認してください。');
                     return;
                   }
                   
                   // 检查认证状态
                   if (!token) {
                     console.error('认证token不存在');
                     alert('認証トークンがありません。再度ログインしてください。');
                     return;
                   }
                   
                   // 再次检查认证状态（双重保险）
                   const isAuthValid = await checkAuthStatus(token);
                   if (!isAuthValid) {
                     alert('認証が無効です。再度ログインしてください。');
                     window.location.href = '/';
                     return;
                   }
                  
                  
                  
                                     // 检查用户ID是否有效
                   
                   if (!user?.id || user.id === 0) {
                     alert('ユーザーIDが無効です。ログイン情報が不完全です。再度ログインしてください。');
                     // 清除无效的认证状态
                     useAuthStore.getState().logout();
                     window.location.href = '/';
                     return;
                   }
                  
                  // 检查是否选择了讲师（多讲师讲座必须选择，单讲师讲座使用讲座数据中的讲师ID）
                  let teacherId: number;
                  if (isMultiTeacherLecture) {
                    // 多讲师讲座：必须选择讲师
                    if (!selectedTeacher) {
                      alert('講師を選択してください');
                      return;
                    }
                    teacherId = parseInt(selectedTeacher);
                  } else {
                    // 单讲师讲座：使用讲座数据中的讲师ID
                    if (!selectedLectureData.teacher_id) {
                      alert('講座データに講師IDがありません');
                      return;
                    }
                    teacherId = selectedLectureData.teacher_id;
                  }
                  
                  // 根据后端API格式构建payload
                  const payload = {
                    user_id: user.id,
                    lecture_id: selectedLectureData.id,
                    teacher_id: teacherId,
                    reserved_date: pendingReservation.date,
                    start_time: pendingReservation.start,
                    end_time: pendingReservation.end,
                  };
                  
                                     try {
                     setIsSubmitting(true);
                     
                     // 调用后端API
                     const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/bookings/register`, {
                       method: 'POST',
                       headers: { 
                         'Content-Type': 'application/json',
                         'Authorization': `Bearer ${token}` // 如果需要认证
                       },
                       body: JSON.stringify(payload),
                     });
                     
                     let result;
                     try {
                       const responseText = await res.text();
                       result = responseText ? JSON.parse(responseText) : {};
                     } catch (parseError) {
                       console.error('响应解析失败:', parseError);
                       result = {};
                     }
                    
                    if (res.ok && result.message) {
                      // 预约成功，设置成功结果
                      setSubmissionResult({
                        success: true,
                        message: result.message,
                        booking_id: result.booking_id
                      });
                      
                      // 显示成功通知
                      showSuccessNotification(
                        result.message,
                        '予約登録成功'
                      );
                      
                      // 预约成功后，重新获取最新的可预约时间数据
                      const newAvailableTimes = await fetchAvailableTimes(selectedLectureData.id);
                      
                      // 更新状态和缓存
                      setAvailableTimes(newAvailableTimes);
                      const cacheKey = `${selectedLectureData.id}-${selectedTeacher || 'single'}`;
                      setDataCache(prev => ({ ...prev, [cacheKey]: newAvailableTimes }));
                      
                      // 清除相关状态
                      setSelectedSlot(null);
                      setStartTime('');
                      setEndTime('');
                      setPendingReservation(null);
                      
                      // 延迟关闭确认弹窗，让用户看到成功消息
                      setTimeout(() => {
                        setConfirmModalOpen(false);
                        setSubmissionResult(null);
                      }, 2000);
                                         } else {
                       // 显示错误消息，特别处理认证错误
                       let errorMessage = '予約登録に失敗しました';
                       
                       if (res.status === 401) {
                         if (result.detail) {
                           errorMessage = `認証エラー：${result.detail}`;
                         } else if (result.message) {
                           errorMessage = `認証エラー：${result.message}`;
                         } else {
                           errorMessage = '認証エラー：ログインが必要です。再度ログインしてください。';
                         }
                         console.error('认证失败，状态码:', res.status, '响应:', result);
                       } else if (res.status === 403) {
                         errorMessage = '権限がありません。この操作を実行する権限がありません。';
                       } else if (res.status >= 500) {
                         errorMessage = 'サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。';
                       } else if (result.detail) {
                         errorMessage = result.detail;
                       } else if (result.message) {
                         errorMessage = result.message;
                       }
                       
                       setSubmissionResult({
                         success: false,
                         message: errorMessage
                       });
                     }
                    
                    setIsSubmitting(false);
                  } catch (err) {
                    handleApiError(err, 'createBooking');
                    setSubmissionResult({
                      success: false,
                      message: '予約登録中にエラーが発生しました'
                    });
                    setIsSubmitting(false);
                  }
                }}
              >
                {isSubmitting ? '予約登録中...' : '予約登録'}
              </Button>
              <Button
                color="gray"
                variant="outline"
                size="md"
                onClick={() => setConfirmModalOpen(false)}
              >
                キャンセル
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExpertBooking;
