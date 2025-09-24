import { useState, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/useUserStore';
import { fetchMyTeacherProfile, fetchTeacherProfile, createLecture, type TeacherProfile, type LectureCreateData } from '@/lib/api';
import type { BookableTeacher } from "@/types/booking";
import { fetchMyLectures } from '@/lib/teacherUtils';
import { checkSessionAndShowModal } from '@/lib/sessionManager';

type LectureScheduleRecord = {
  id: number;
  lecture_id: number;
  teacher_id: number;
  date: string;
  start: string;
  end: string;
  created_at: string;
};

export const useTeacherDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const { logout } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lectures, setLectures] = useState<BookableTeacher[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(false);
  
  // 讲师资料状态
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // 模态框状态
  const [openModal, setOpenModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState<BookableTeacher | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // 时间枠编辑相关
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [schedulingLecture, setSchedulingLecture] = useState<BookableTeacher | null>(null);
  
  // 查看预约安排弹窗相关
  const [scheduleViewModalOpen, setScheduleViewModalOpen] = useState(false);
  const [viewingLecture, setViewingLecture] = useState<BookableTeacher | null>(null);

  // 初始化
  useEffect(() => {
    setHydrated(true);
  }, []);

  // 登录状态检查
  useEffect(() => {
    if (!hydrated || !user || user.role !== "teacher") return;
    
    const checkSession = async () => {
      const token = useAuthStore.getState().token;
      if (!token) {
        router.push("/");
        return;
      }
      
      setSessionChecking(true);
      try {
        const isValid = await checkSessionAndShowModal(token);
        if (isValid) {
          setSessionChecked(true);
        } else {
          // 登录状态无效，等待用户重新登录或重定向
          setSessionChecked(false);
        }
      } catch (error) {
        console.error("セッションチェックエラー:", error);
        setSessionChecked(false);
      } finally {
        setSessionChecking(false);
      }
    };
    
    checkSession();
  }, [user, router, hydrated]);

  // 角色验证
  useEffect(() => {
    if (!hydrated) return;
    
    if (!user) {
      router.push("/");
      return;
    }
    
    if (user.role !== "teacher") {
      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/bookings");
      }
      return;
    }
  }, [user, router, hydrated]);

  // 获取讲师资料
  const fetchTeacherProfileData = async () => {
    if (!user) return;
    
    setProfileLoading(true);
    try {
      const profile = await fetchTeacherProfile(user.id);
      setTeacherProfile(profile);
    } catch (error) {
      console.error('プロフィール読み込みエラー:', error);
      // 如果获取失败，使用默认值
      setTeacherProfile({
        id: user.id,
        name: user.name,
        email: user.email || '',
        phone: null,
        bio: null,
        profile_image: null
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // 加载讲座数据 - 只有在登录检查通过后才执行
  useEffect(() => {
    if (!hydrated || !user || user.role !== "teacher" || !sessionChecked) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = useAuthStore.getState().token;
        if (!token) {
          throw new Error("認証トークンが見つかりません");
        }
        
        const myLectures = await fetchMyLectures(token);
        setLectures(myLectures);
      } catch (error) {
        console.error("講座データ取得エラー:", error);
        notifications.show({ 
          title: 'エラー', 
          message: '講座データの取得に失敗しました', 
          color: 'red' 
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, hydrated, sessionChecked]);

  // 加载讲师资料 - 只有在登录检查通过后才执行
  useEffect(() => {
    if (!hydrated || !user || user.role !== "teacher" || !sessionChecked) return;
    fetchTeacherProfileData();
  }, [user, hydrated, sessionChecked]);


  // 创建讲座
  const handleCreateLecture = async () => {
    if (!newTitle.trim()) {
      notifications.show({ title: 'エラー', message: '講座タイトルを入力してください', color: 'red' });
      return;
    }

    try {
      const token = useAuthStore.getState().token;
      
      if (!token) {
        notifications.show({ title: 'エラー', message: '認証トークンが見つかりません', color: 'red' });
        return;
      }
      
      // 准备创建讲座的数据
      const lectureData: LectureCreateData = {
        lecture_title: newTitle.trim(),
        lecture_description: newDescription.trim() || undefined,
        teacher_id: user?.id, // 讲师创建讲座时，teacher_id为当前用户ID
        is_multi_teacher: false // 讲师不能创建多讲师讲座
      };

      // 调用后端API创建讲座
      const response = await createLecture(lectureData, token);

      if (response) {
        notifications.show({ 
          title: '講座作成成功', 
          message: `新しい講座「${response.lecture_title}」を登録しました`, 
          color: 'green' 
        });
        
        // 重新获取讲座列表
        const updatedLectures = await fetchMyLectures(token);
        setLectures(updatedLectures);
        
        // 清空表单并关闭模态框
        setNewTitle('');
        setNewDescription('');
        setOpenModal(false);
      }

    } catch (err: any) {
      console.error("講座登録エラー:", err);
      notifications.show({ 
        title: 'エラー', 
        message: err.message || '講座の作成中にエラーが発生しました', 
        color: 'red' 
      });
    }
  };

  // 编辑讲座 - 暂时禁用
  const handleEditLecture = (lecture: BookableTeacher) => {
    // 暂时禁用编辑功能
    notifications.show({
      title: '機能無効',
      message: '講座の編集機能は現在無効です',
      color: 'orange'
    });
    return;
    
    // 以下代码暂时被禁用
    // setEditingLecture(lecture);
    // setEditTitle(lecture.lecture_title);
    // setEditDescription(lecture.lecture_description);
    // setEditModalOpen(true);
  };

  // 保存编辑 - 暂时禁用
  const handleSaveEdit = async () => {
    // 暂时禁用保存功能
    notifications.show({
      title: '機能無効',
      message: '講座の保存機能は現在無効です',
      color: 'orange'
    });
    return;
    
    // 以下代码暂时被禁用
    // if (!editingLecture) return;
    // try {
    //   const updatedLecture = {
    //     ...editingLecture,
    //     lecture_title: editTitle,
    //     lecture_description: editDescription,
    //   };

    //   await fetch('/api/bookable', {
    //     method: 'PUT',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(updatedLecture),
    //   });

    //   setLectures((prev) =>
    //     prev.map((lec) =>
    //       lec.id === updatedLecture.id ? updatedLecture : lec
    //     )
    //   );

    //   notifications.show({ title: '編集成功', message: '講座情報を更新しました', color: 'green' });
    //   setEditModalOpen(false);
    //   setEditingLecture(null);
    // } catch (err) {
    //   notifications.show({ title: '編集失敗', message: '講座情報の更新に失敗しました', color: 'red' });
    //   console.error("講座編集エラー:", err);
    // }
  };

  // 编辑时间安排
  const handleEditSchedule = async (lecture: BookableTeacher) => {
    if (!user || !token) {
      notifications.show({
        title: 'エラー',
        message: 'ユーザー情報またはトークンが見つかりません',
        color: 'red'
      });
      return;
    }

    // 检查讲座状态，只允许编辑已批准的讲座
    if (lecture.approval_status !== 'approved') {
      notifications.show({
        title: 'エラー',
        message: '承認済みの講座のみ時間枠を編集できます。この講座は承認待ちまたは却下されています。',
        color: 'red'
      });
      return;
    }

    try {
      // 检查登录状态
      const isValid = await checkSessionAndShowModal(token);
      if (isValid) {
        setSchedulingLecture(lecture);
        setScheduleModalOpen(true);
      } else {
        notifications.show({
          title: 'エラー',
          message: 'セッションが期限切れです。再度ログインしてください。',
          color: 'red'
        });
      }
    } catch (error) {
      console.error('セッションチェックエラー:', error);
      notifications.show({
        title: 'エラー',
        message: 'セッションの確認に失敗しました',
        color: 'red'
      });
    }
  };

  // 查看预约安排
  const handleViewSchedule = (lecture: BookableTeacher) => {
    setViewingLecture(lecture);
    setScheduleViewModalOpen(true);
  };

  // 处理资料编辑按钮点击
  const handleProfileEditClick = async () => {
    if (!user || !token) {
      notifications.show({
        title: 'エラー',
        message: 'ユーザー情報またはトークンが見つかりません',
        color: 'red'
      });
      return;
    }

    try {
      // 检查登录状态
      const isValid = await checkSessionAndShowModal(token);
      if (isValid) {
        // 登录状态有效，打开编辑窗口
        setProfileModalOpen(true);
      } else {
        // 登录状态无效，不打开编辑窗口
        notifications.show({
          title: 'エラー',
          message: 'セッションが期限切れです。再度ログインしてください。',
          color: 'red'
        });
      }
    } catch (error) {
      console.error('セッションチェックエラー:', error);
      notifications.show({
        title: 'エラー',
        message: 'セッションの確認に失敗しました',
        color: 'red'
      });
    }
  };

  // 处理资料更新
  const handleProfileUpdate = (profile: TeacherProfile) => {
    setTeacherProfile(profile);
    console.log('プロフィール更新:', profile);
  };

  // 登出
  const handleLogout = () => {
    logout();
    router.push("/");
    notifications.show({
      title: "ログアウト成功",
      message: "ログアウトしました",
      color: "blue",
    });
  };

  return {
    // 状态
    user,
    loading,
    lectures,
    hydrated,
    sessionChecked,
    sessionChecking,
    teacherProfile,
    profileLoading,
    
    // 模态框状态
    openModal,
    setOpenModal,
    newTitle,
    setNewTitle,
    newDescription,
    setNewDescription,
    
    editModalOpen,
    setEditModalOpen,
    editingLecture,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    
    profileModalOpen,
    setProfileModalOpen,
    
    scheduleModalOpen,
    setScheduleModalOpen,
    schedulingLecture,
    
    // 查看预约安排弹窗状态
    scheduleViewModalOpen,
    setScheduleViewModalOpen,
    viewingLecture,
    
    // 方法
    handleCreateLecture,
    handleEditLecture,
    handleSaveEdit,
    handleEditSchedule,
    handleViewSchedule,
    handleProfileEditClick,
    handleProfileUpdate,
    handleLogout,
  };
};
