'use client';
import { useEffect, useState } from "react";
import { 
  Title, 
  Table, 
  Loader, 
  Center, 
  Paper, 
  Stack, 
  Text, 
  Badge,
  Alert,
  Group,
  TextInput,
  Select,
  Button,
  ActionIcon,
  Tooltip,
  Modal,
  Textarea,
  Pagination,
  Box,
  Flex,
  Menu,
  Divider
} from "@mantine/core";
import { 
  IconBook2, 
  IconUser, 
  IconCircleCheck, 
  IconClock, 
  IconX,
  IconSearch,
  IconFilter,
  IconPencil,
  IconTrash,
  IconEye,
  IconDotsVertical,
  IconPlus,
  IconRefresh
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import LectureReservationsModal from "./LectureReservationsModal";
import { 
  createLecture, 
  type LectureCreateData,
  fetchAllLectures,
  updateLecture,
  updateLectureApproval,
  deleteLecture,
  fetchPublicTeachers,
  type LectureListType,
  type LectureUpdateData,
  type LectureApprovalUpdateData,
  type TeacherType
} from '@/lib/api';
import useAuthStore from '@/store/useUserStore';
import { checkSessionAndShowModal } from '@/lib/sessionManager';

type LectureEditData = {
  lecture_title: string;
  lecture_description: string;
  approval_status: "approved" | "pending" | "rejected";
};

export default function LecturesPage() {
  const { user, token } = useAuthStore();
  const [lectures, setLectures] = useState<LectureListType[]>([]);
  const [filteredLectures, setFilteredLectures] = useState<LectureListType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(false);
  
  // 预约详情弹窗
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState<{ id: number, title: string } | null>(null);
  
  // 编辑弹窗
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState<LectureListType | null>(null);
  const [editData, setEditData] = useState<LectureEditData>({
    lecture_title: "",
    lecture_description: "",
    approval_status: "pending"
  });
  const [submitting, setSubmitting] = useState(false);
  
  // 删除确认弹窗
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [lectureToDelete, setLectureToDelete] = useState<LectureListType | null>(null);
  
  // 创建讲座弹窗
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createData, setCreateData] = useState({
    lecture_title: "",
    lecture_description: "",
    teacher_name: ""
  });
  const [creating, setCreating] = useState(false);
  
  // 搜索和筛选
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  
  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // 快速状态修改
  const [statusChanging, setStatusChanging] = useState<number | null>(null);
  
  // 讲师列表
  const [uniqueTeachers, setUniqueTeachers] = useState<TeacherType[]>([]);

  // 登录状态检测
  useEffect(() => {
    const checkSession = async () => {
      if (!token) {
        setError("認証トークンが見つかりません");
        setLoading(false);
        return;
      }

      try {
        setSessionChecking(true);
        // 简化登录状态检测，直接尝试获取数据
        setSessionChecked(true);
      } catch (error) {
        console.error('セッション確認エラー:', error);
        setSessionChecked(true);
      } finally {
        setSessionChecking(false);
      }
    };

    checkSession();
  }, [token]);

  // 获取讲座数据
  const fetchLectures = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllLectures();
      setLectures(data);
      setFilteredLectures(data);
    } catch (err) {
      console.error("講座データ取得エラー:", err);
      setError("講座データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 数据获取
  useEffect(() => {
    if (sessionChecked) {
      fetchLectures();
    }
  }, [sessionChecked]);

  // 搜索和筛选逻辑
  useEffect(() => {
    let filtered = lectures;

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(lecture =>
        lecture.lecture_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lecture.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lecture.lecture_description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 状态过滤
    if (statusFilter !== "all") {
      filtered = filtered.filter(lecture => lecture.approval_status === statusFilter);
    }

    // 讲师过滤
    if (teacherFilter !== "all") {
      filtered = filtered.filter(lecture => lecture.teacher_name === teacherFilter);
    }

    setFilteredLectures(filtered);
    setCurrentPage(1); // 重置到第一页
  }, [lectures, searchTerm, statusFilter, teacherFilter]);

  // 获取所有讲师列表
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const teachers = await fetchPublicTeachers();
        setUniqueTeachers(teachers);
      } catch (error) {
        console.error('講師リスト取得エラー:', error);
      }
    };
    fetchTeachers();
  }, []);

  // 获取状态信息
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "approved":
        return { label: "承認済み", color: "green", icon: IconCircleCheck };
      case "pending":
        return { label: "審査中", color: "yellow", icon: IconClock };
      case "rejected":
        return { label: "却下", color: "red", icon: IconX };
      default:
        return { label: "不明", color: "gray", icon: IconClock };
    }
  };

  // 分页计算
  const totalPages = Math.ceil(filteredLectures.length / itemsPerPage);
  const paginatedLectures = filteredLectures.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 编辑讲座
  const handleEditLecture = async (lecture: LectureListType) => {
    if (!token) {
      notifications.show({
        title: 'エラー',
        message: '認証トークンが見つかりません',
        color: 'red'
      });
      return;
    }

    try {
      // 检查登录状态
      const isValid = await checkSessionAndShowModal(token);
      if (!isValid) {
        notifications.show({
          title: 'エラー',
          message: 'セッションが期限切れです。再度ログインしてください。',
          color: 'red'
        });
        return;
      }

      setEditingLecture(lecture);
      setEditData({
        lecture_title: lecture.lecture_title,
        lecture_description: lecture.lecture_description || "",
        approval_status: lecture.approval_status as "approved" | "pending" | "rejected"
      });
      setEditModalOpen(true);
    } catch (error) {
      console.error('セッションチェックエラー:', error);
      notifications.show({
        title: 'エラー',
        message: 'セッションの確認に失敗しました',
        color: 'red'
      });
    }
  };

  // 更新讲座
  const handleUpdateLecture = async () => {
    if (!editingLecture || !token) return;

    try {
      setSubmitting(true);
      
      // 检查登录状态
      const isValid = await checkSessionAndShowModal(token);
      if (!isValid) {
        notifications.show({
          title: 'エラー',
          message: 'セッションが期限切れです。再度ログインしてください。',
          color: 'red'
        });
        return;
      }

      // 调用API更新讲座信息
      const updateData: LectureUpdateData = {
        lecture_title: editData.lecture_title,
        lecture_description: editData.lecture_description
      };

      await updateLecture(editingLecture.id, updateData, token);
      
      // 更新本地状态
      const updatedLectures = lectures.map(lecture =>
        lecture.id === editingLecture.id
          ? { ...lecture, ...editData }
          : lecture
      );
      
      setLectures(updatedLectures);
      setEditModalOpen(false);
      setEditingLecture(null);

      notifications.show({
        title: "更新完了",
        message: "講座情報を更新しました",
        color: "green"
      });
    } catch (error) {
      notifications.show({
        title: "エラー",
        message: error instanceof Error ? error.message : "講座の更新に失敗しました",
        color: "red"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 删除讲座
  const handleDeleteLecture = (lecture: LectureListType) => {
    setLectureToDelete(lecture);
    setDeleteModalOpen(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (!lectureToDelete || !token) return;

    try {
      // 检查登录状态
      const isValid = await checkSessionAndShowModal(token);
      if (!isValid) {
        notifications.show({
          title: 'エラー',
          message: 'セッションが期限切れです。再度ログインしてください。',
          color: 'red'
        });
        return;
      }

      // 调用API删除讲座
      const result = await deleteLecture(lectureToDelete.id, token);
      
      // 从本地状态中移除
      const updatedLectures = lectures.filter(lecture => lecture.id !== lectureToDelete.id);
      setLectures(updatedLectures);
      
      setDeleteModalOpen(false);
      setLectureToDelete(null);

      notifications.show({
        title: "削除完了",
        message: result.message,
        color: "green"
      });
    } catch (error) {
      console.error("講座削除エラー:", error);
      notifications.show({
        title: "エラー",
        message: error instanceof Error ? error.message : "講座の削除に失敗しました",
        color: "red"
      });
    }
  };

  // 快速修改承认状况
  const handleQuickStatusChange = async (lectureId: number, newStatus: "approved" | "pending" | "rejected") => {
    if (!token) {
      notifications.show({
        title: 'エラー',
        message: '認証トークンが見つかりません',
        color: 'red'
      });
      return;
    }

    try {
      setStatusChanging(lectureId);
      
      // 检查登录状态
      const isValid = await checkSessionAndShowModal(token);
      if (!isValid) {
        notifications.show({
          title: 'エラー',
          message: 'セッションが期限切れです。再度ログインしてください。',
          color: 'red'
        });
        return;
      }

      // 调用API更新审批状态
      const approvalData: LectureApprovalUpdateData = { approval_status: newStatus };
      await updateLectureApproval(lectureId, approvalData, token);
      
      // 更新本地状态
      const updatedLectures = lectures.map(lecture =>
        lecture.id === lectureId
          ? { ...lecture, approval_status: newStatus }
          : lecture
      );
      
      setLectures(updatedLectures);
      
      const statusLabels = {
        approved: "承認済み",
        pending: "審査中", 
        rejected: "却下"
      };
      
      notifications.show({
        title: "更新完了",
        message: `承認状況を「${statusLabels[newStatus]}」に変更しました`,
        color: "green"
      });
    } catch (error) {
      console.error("承認状況更新エラー:", error);
      notifications.show({
        title: "エラー",
        message: error instanceof Error ? error.message : "承認状況の更新に失敗しました",
        color: "red"
      });
    } finally {
      setStatusChanging(null);
    }
  };

  // 重置筛选
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTeacherFilter("all");
  };

  // 创建讲座
  const handleCreateLecture = async () => {
    if (!createData.lecture_title.trim()) {
      notifications.show({ title: 'エラー', message: '講座タイトルを入力してください', color: 'red' });
      return;
    }
    if (!createData.teacher_name.trim()) {
      notifications.show({ title: 'エラー', message: '講師を選択してください', color: 'red' });
      return;
    }
    if (!token) {
      notifications.show({ title: 'エラー', message: '認証トークンが見つかりません', color: 'red' });
      return;
    }

    try {
      setCreating(true);
      
      // 检查登录状态
      const isValid = await checkSessionAndShowModal(token);
      if (!isValid) {
        notifications.show({
          title: 'エラー',
          message: 'セッションが期限切れです。再度ログインしてください。',
          color: 'red'
        });
        return;
      }
      
      // 查找该讲师的真实teacher_id
      const selectedTeacher = uniqueTeachers.find(teacher => teacher.name === createData.teacher_name);
      
      if (!selectedTeacher) {
        notifications.show({ title: 'エラー', message: '選択した講師の情報が見つかりません', color: 'red' });
        return;
      }

      // 准备创建讲座的数据
      const lectureData: LectureCreateData = {
        lecture_title: createData.lecture_title.trim(),
        lecture_description: createData.lecture_description.trim() || undefined,
        teacher_id: selectedTeacher.id,
        is_multi_teacher: false
      };

      // 调用后端API创建讲座
      const response = await createLecture(lectureData, token);

      if (response) {
        // 创建本地讲座对象用于显示
        const newLecture: LectureListType = {
          id: response.lecture_id,
          teacher_id: selectedTeacher.id,
          teacher_name: createData.teacher_name,
          lecture_title: response.lecture_title,
          lecture_description: createData.lecture_description,
          approval_status: response.approval_status,
          is_multi_teacher: false,
          created_at: response.created_at,
          updated_at: response.created_at
        };

        // 添加到本地状态
        const updatedLectures = [...lectures, newLecture];
        setLectures(updatedLectures);
        
        // 重置表单
        setCreateData({
          lecture_title: "",
          lecture_description: "",
          teacher_name: ""
        });
        setCreateModalOpen(false);

        notifications.show({
          title: "作成完了",
          message: `新しい講座「${response.lecture_title}」を作成しました`,
          color: "green"
        });
      }
    } catch (error: any) {
      console.error("講座作成エラー:", error);
      notifications.show({
        title: "エラー",
        message: error.message || "講座の作成に失敗しました",
        color: "red"
      });
    } finally {
      setCreating(false);
    }
  };

  // 显示加载状态
  if (sessionChecking) {
    return (
      <Stack gap="md">
        <Title order={2}>講座一覧</Title>
        <Center>
          <Loader size="lg" />
        </Center>
        <Text ta="center" c="dimmed">セッションを確認中...</Text>
      </Stack>
    );
  }

  if (loading) {
    return (
      <Stack gap="md">
        <Title order={2}>講座一覧</Title>
        <Center>
          <Loader size="lg" />
        </Center>
        <Text ta="center" c="dimmed">データを読み込み中...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack gap="md">
        <Title order={2}>講座一覧</Title>
        <Alert color="red" title="エラー">
          {error}
          {error.includes("セッションが期限切れ") && (
            <Text size="sm" mt="xs">
              ログインし直してください。ページを再読み込みするか、管理者ダッシュボードに戻ってください。
            </Text>
          )}
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      {/* 页面标题 */}
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <IconBook2 size={28} color="#444" />
          <Title order={2}>講座一覧</Title>
          <Badge variant="light" color="blue">
            {filteredLectures.length}件
          </Badge>
        </Group>
                 <Group gap="sm">
           <Button
             leftSection={<IconRefresh size={16} />}
             variant="light"
             onClick={async () => {
               if (!token) {
                 setError("認証トークンが見つかりません");
                 return;
               }
               
               try {
                 setLoading(true);
                 setError(null);
                 
                 // 直接尝试获取数据
                 await fetchLectures();
               } catch (err) {
                 console.error("refresh lectures error", err);
                 setError(err instanceof Error ? err.message : "講座データの取得に失敗しました");
               } finally {
                 setLoading(false);
               }
             }}
             loading={loading}
           >
             更新
           </Button>
           <Button
             leftSection={<IconPlus size={16} />}
             onClick={() => setCreateModalOpen(true)}
           >
             新規講座を開設
           </Button>
         </Group>
      </Group>

      {/* 搜索和筛选区域 */}
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Group gap="md" align="flex-end">
            <TextInput
              placeholder="講座タイトル、講師名、説明で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              leftSection={<IconSearch size={16} />}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="承認状況"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || "all")}
              data={[
                { value: "all", label: "すべて" },
                { value: "approved", label: "承認済み" },
                { value: "pending", label: "審査中" },
                { value: "rejected", label: "却下" }
              ]}
              style={{ width: 150 }}
            />
            <Select
              placeholder="講師"
              value={teacherFilter}
              onChange={(value) => setTeacherFilter(value || "all")}
              data={[
                { value: "all", label: "すべての講師" },
                ...uniqueTeachers.map(teacher => ({ value: teacher.name, label: teacher.name }))
              ]}
              style={{ width: 200 }}
            />
            <Button
              variant="outline"
              leftSection={<IconFilter size={16} />}
              onClick={resetFilters}
            >
              リセット
            </Button>
          </Group>
        </Stack>
      </Paper>

      {/* 讲座列表 */}
      {filteredLectures.length === 0 ? (
        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <Stack align="center" gap="md">
            <IconBook2 size={48} color="#ccc" />
            <Text size="lg" color="dimmed">
              {searchTerm || statusFilter !== "all" || teacherFilter !== "all" 
                ? "検索条件に一致する講座がありません" 
                : "講座が登録されていません"}
            </Text>
            {(searchTerm || statusFilter !== "all" || teacherFilter !== "all") && (
              <Button variant="light" onClick={resetFilters}>
                フィルターをリセット
              </Button>
            )}
          </Stack>
        </Paper>
      ) : (
        <Paper shadow="sm" radius="md" withBorder>
          <Table highlightOnHover striped withColumnBorders>
            <thead style={{ backgroundColor: "#f9fafb" }}>
              <tr>
                <th style={{ textAlign: "left", width: "20%" }}>
                  <Group gap="xs">
                    <IconUser size={16} />
                    <Text size="sm">講師名</Text>
                  </Group>
                </th>
                <th style={{ textAlign: "left", width: "35%" }}>
                  <Group gap="xs">
                    <IconBook2 size={16} />
                    <Text size="sm">講座タイトル</Text>
                  </Group>
                </th>
                <th style={{ textAlign: "center", width: "15%" }}>
                  <Text size="sm">承認状況</Text>
                </th>
                <th style={{ textAlign: "center", width: "15%" }}>
                  <Text size="sm">作成日</Text>
                </th>
                <th style={{ textAlign: "center", width: "15%" }}>
                  <Text size="sm">操作</Text>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedLectures.map((lecture) => {
                const statusInfo = getStatusInfo(lecture.approval_status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <tr key={lecture.id}>
                    <td style={{ textAlign: "left", padding: "12px 8px" }}>
                      <Text fw={500} size="sm">
                        {lecture.teacher_name}
                      </Text>
                    </td>
                    <td style={{ textAlign: "left", padding: "12px 8px" }}>
                      <Text 
                        fw={500}
                        size="sm"
                        style={{ 
                          cursor: "pointer",
                          color: "#1976d2"
                        }}
                        onClick={() => {
                          setSelectedLecture({ 
                            id: lecture.id, 
                            title: lecture.lecture_title 
                          });
                          setReservationModalOpen(true);
                        }}
                      >
                        {lecture.lecture_title}
                      </Text>
                    </td>
                    <td style={{ textAlign: "center", padding: "12px 8px" }}>
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <Tooltip label="クリックして承認状況を変更">
                            <Badge 
                              color={statusInfo.color} 
                              variant="light"
                              leftSection={
                                statusChanging === lecture.id ? (
                                  <Loader size={12} />
                                ) : (
                                  <StatusIcon size={12} />
                                )
                              }
                              style={{ cursor: "pointer" }}
                            >
                              {statusChanging === lecture.id ? "更新中..." : statusInfo.label}
                            </Badge>
                          </Tooltip>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconCircleCheck size={14} />}
                            onClick={() => handleQuickStatusChange(lecture.id, "approved")}
                            fw={lecture.approval_status === "approved" ? 700 : 400}
                            style={{ 
                              color: lecture.approval_status === "approved" ? "#1976d2" : "inherit" 
                            }}
                            disabled={statusChanging === lecture.id}
                          >
                            承認済み
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconClock size={14} />}
                            onClick={() => handleQuickStatusChange(lecture.id, "pending")}
                            fw={lecture.approval_status === "pending" ? 700 : 400}
                            style={{ 
                              color: lecture.approval_status === "pending" ? "#f57c00" : "inherit" 
                            }}
                            disabled={statusChanging === lecture.id}
                          >
                            審査中
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconX size={14} />}
                            onClick={() => handleQuickStatusChange(lecture.id, "rejected")}
                            fw={lecture.approval_status === "rejected" ? 700 : 400}
                            style={{ 
                              color: lecture.approval_status === "rejected" ? "#d32f2f" : "inherit" 
                            }}
                            disabled={statusChanging === lecture.id}
                          >
                            却下
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </td>
                    <td style={{ textAlign: "center", padding: "12px 8px" }}>
                      <Text size="sm" color="dimmed">
                        {new Date(lecture.created_at).toLocaleDateString('ja-JP')}
                      </Text>
                    </td>
                    <td style={{ textAlign: "center", padding: "12px 8px" }}>
                      <Group gap="xs" justify="center">
                        <Tooltip label="予約詳細">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => {
                              setSelectedLecture({ 
                                id: lecture.id, 
                                title: lecture.lecture_title 
                              });
                              setReservationModalOpen(true);
                            }}
                            size="sm"
                          >
                            <IconEye size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <ActionIcon variant="light" size="sm">
                              <IconDotsVertical size={14} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconPencil size={14} />}
                              onClick={() => handleEditLecture(lecture)}
                            >
                              編集
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                              leftSection={<IconTrash size={14} />}
                              color="red"
                              onClick={() => handleDeleteLecture(lecture)}
                            >
                              削除
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Paper>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <Center>
          <Pagination
            total={totalPages}
            value={currentPage}
            onChange={setCurrentPage}
            size="md"
          />
        </Center>
      )}

      {/* 预约详情弹窗 */}
      {selectedLecture && (
        <LectureReservationsModal
          lectureId={selectedLecture.id}
          lectureTitle={selectedLecture.title}
          opened={reservationModalOpen}
          onClose={() => setReservationModalOpen(false)}
        />
      )}

      {/* 编辑弹窗 */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="講座編集"
        size="lg"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="講座タイトル"
            value={editData.lecture_title}
            onChange={(e) => setEditData({ ...editData, lecture_title: e.currentTarget.value })}
            withAsterisk
          />
          <Textarea
            label="講座説明"
            value={editData.lecture_description}
            onChange={(e) => setEditData({ ...editData, lecture_description: e.currentTarget.value })}
            withAsterisk
            minRows={3}
          />
          <Select
            label="承認状況"
            value={editData.approval_status}
            onChange={(value) => setEditData({ ...editData, approval_status: value as any })}
            data={[
              { value: "approved", label: "承認済み" },
              { value: "pending", label: "審査中" },
              { value: "rejected", label: "却下" }
            ]}
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateLecture} loading={submitting}>
              更新する
            </Button>
          </Group>
        </Stack>
      </Modal>

             {/* 创建讲座弹窗 */}
       <Modal
         opened={createModalOpen}
         onClose={() => setCreateModalOpen(false)}
         title="新規講座を開設"
         size="lg"
         centered
       >
         <Stack gap="md">
           <Select
             label="講師選択"
             placeholder="講師を選択してください"
             value={createData.teacher_name}
             onChange={(value) => setCreateData({ ...createData, teacher_name: value || "" })}
             data={uniqueTeachers.map(teacher => ({ value: teacher.name, label: teacher.name }))}
             withAsterisk
           />
           <TextInput
             label="講座タイトル"
             placeholder="例：AI入門講座"
             value={createData.lecture_title}
             onChange={(e) => setCreateData({ ...createData, lecture_title: e.currentTarget.value })}
             withAsterisk
           />
           <Textarea
             label="講座説明"
             placeholder="講座の内容を簡単に記述してください"
             value={createData.lecture_description}
             onChange={(e) => setCreateData({ ...createData, lecture_description: e.currentTarget.value })}
             minRows={3}
           />
           <Group justify="flex-end" gap="sm">
             <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
               キャンセル
             </Button>
             <Button onClick={handleCreateLecture} loading={creating}>
               講座を登録する
             </Button>
           </Group>
         </Stack>
       </Modal>

       {/* 删除确认弹窗 */}
       <Modal
         opened={deleteModalOpen}
         onClose={() => setDeleteModalOpen(false)}
         title="削除確認"
         size="sm"
         centered
       >
         <Stack gap="md">
           <Text>
             「{lectureToDelete?.lecture_title}」を削除しますか？
           </Text>
           <Text size="sm" color="red">
             この操作は取り消せません。
           </Text>
           <Group justify="flex-end" gap="sm">
             <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
               キャンセル
             </Button>
             <Button color="red" onClick={confirmDelete}>
               削除する
             </Button>
           </Group>
         </Stack>
       </Modal>
     </Stack>
   );
 }
