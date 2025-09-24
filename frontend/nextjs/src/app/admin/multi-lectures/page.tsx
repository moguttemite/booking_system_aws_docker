"use client";
import { useState, useEffect } from "react";
import {
  Title,
  Table,
  Button,
  Modal,
  TextInput,
  Textarea,
  Group,
  Box,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  ActionIcon,
  Text,
  Alert,
  Badge,
  Tooltip,
  Select,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPencil, IconPlus, IconBook2, IconAlertCircle, IconX } from "@tabler/icons-react";
import { fetchAllTeachers, fetchLectureTeachers, updateLectureTeachers, type LectureTeacherRecord, fetchPublicTeachers, fetchMultiTeacherLectures, createMultiTeacherLecture, addTeacherToLecture, updateMultiTeacherLecture, fetchMultiTeacherLectureTeachers, updateMultiTeacherLectureTeachers, removeTeacherFromLecture } from "@/lib/api";
import type { User } from "@/types";
import useAuthStore from "@/store/useUserStore";
import { checkSessionAndShowModal } from "@/lib/sessionManager";
import { useErrorHandler } from "@/lib/errorHandler";

type MultiLecture = {
  id: number;
  title: string;
  description: string;
  teacher_ids: number[];
  status: "active" | "inactive";
  created_at: string;
};

const FALLBACK_TEACHERS: User[] = [
  { id: 8, name: "佐藤 太一", email: "teacher_a@gmail.com", role: "teacher" },
  { id: 9, name: "鈴木 花子", email: "teacher_b@gmail.com", role: "teacher" },
  { id: 10, name: "高橋 健吾", email: "teacher_c@gmail.com", role: "teacher" },
];

export default function MultiLecturesPage() {
  const { token, user } = useAuthStore();
  const { handleError, showSuccessNotification } = useErrorHandler();
  const [lectures, setLectures] = useState<MultiLecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState<MultiLecture | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // 多讲师选择相关状态
  const [allTeachers, setAllTeachers] = useState<User[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  
  // 删除讲师确认弹窗
  const [deleteTeacherModalOpen, setDeleteTeacherModalOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<{ index: number; teacherName: string } | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState(false);
  
  // 新增讲师选择状态
  const [showAddTeacherSelect, setShowAddTeacherSelect] = useState(false);
  const [newTeacherId, setNewTeacherId] = useState<number | null>(null);

  // 登录状态检测辅助函数
  const checkAuthAndPermission = async (): Promise<boolean> => {
    // 检查登录状态
    if (!token || !user) {
      notifications.show({
        title: "エラー",
        message: "ログインが必要です",
        color: "red",
      });
      return false;
    }

    // 检查管理员权限
    if (user.role !== 'admin') {
      notifications.show({
        title: "エラー",
        message: "管理者権限が必要です",
        color: "red",
      });
      return false;
    }

    // 检查会话有效性
    const isValidSession = await checkSessionAndShowModal(token);
    if (!isValidSession) {
      notifications.show({
        title: "エラー",
        message: "セッションが期限切れです。再度ログインしてください。",
        color: "red",
      });
      return false;
    }

    return true;
  };

  // 获取所有讲师数据
  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      
      const teachers = await fetchPublicTeachers();
      if (teachers && teachers.length > 0) {
        setAllTeachers(teachers);
        return;
      }
      
      setAllTeachers(FALLBACK_TEACHERS);
      notifications.show({
        title: "情報",
        message: "フォールバックデータを使用しています。",
        color: "blue",
      });
      
    } catch (error) {
      console.error("講師データ取得エラー:", error);
      setAllTeachers(FALLBACK_TEACHERS);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // 获取当前讲座的讲师数据
  const fetchCurrentLectureTeachers = async (lectureId: number): Promise<number[]> => {
    if (!token) {
      console.error("No token available for fetching lecture teachers");
      return [];
    }

    try {
      const teachers = await fetchMultiTeacherLectureTeachers(lectureId, token);
      return teachers.map(teacher => teacher.teacher_id);
    } catch (error) {
      console.error("Error fetching current lecture teachers:", error);
      return [];
    }
  };

  // データ読み込み
  useEffect(() => {
    const fetchLectures = async () => {
      try {
        setLoading(true);
        
        // 使用新的API函数获取多讲师讲座
        const multiTeacherLectures = await fetchMultiTeacherLectures();
        
        // データ形式を変換（暂时不获取讲师信息，在编辑时再获取）
        const formattedLectures: MultiLecture[] = multiTeacherLectures.map((lecture: any) => {
          return {
            id: lecture.id,
            title: lecture.lecture_title,
            description: lecture.lecture_description || "",
            teacher_ids: [], // 暂时设为空数组，编辑时再获取
            status: lecture.approval_status === "approved" ? "active" : "inactive",
            created_at: lecture.created_at || "未定",
          };
        });
        
        setLectures(formattedLectures);
      } catch (error) {
        console.error("講座データ取得エラー:", error);
        notifications.show({
          title: "エラー",
          message: "講座データの取得に失敗しました",
          color: "red",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLectures();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedTeacherIds([]);
    setEditingLecture(null);
    setShowAddTeacherSelect(false);
    setNewTeacherId(null);
    setDeleteTeacherModalOpen(false);
    setTeacherToDelete(null);
    setDeletingTeacher(false);
  };

  const handleCloseModal = () => {
    if (!submitting) {
      setModalOpen(false);
      resetForm();
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      notifications.show({
        title: "エラー",
        message: "講座タイトルを入力してください",
        color: "red",
      });
      return false;
    }
    if (!description.trim()) {
      notifications.show({
        title: "エラー",
        message: "講座説明を入力してください",
        color: "red",
      });
      return false;
    }
    if (selectedTeacherIds.length === 0) {
      notifications.show({
        title: "エラー",
        message: "少なくとも1人の講師を選択してください",
        color: "red",
      });
      return false;
    }
    return true;
  };

  const handleCreateLecture = async () => {
    if (!validateForm()) return;
    
    // 检查登录状态和权限
    const hasPermission = await checkAuthAndPermission();
    if (!hasPermission) return;

    try {
      setSubmitting(true);
      
      // 检查是否选择了讲师
      if (selectedTeacherIds.length === 0) {
        notifications.show({
          title: "エラー",
          message: "少なくとも1人の講師を選択してください",
          color: "red",
        });
        return;
      }

      // 第一步：创建讲座（使用第一个讲师作为主讲师）
      const mainTeacherId = selectedTeacherIds[0];
      const lectureData = {
        lecture_title: title.trim(),
        lecture_description: description.trim(),
        teacher_id: mainTeacherId,
        is_multi_teacher: true
      };

      const createResponse = await createMultiTeacherLecture(lectureData, token);
      const lectureId = createResponse.lecture_id;

      // 第二步：为其他讲师调用添加讲师API
      const additionalTeachers = selectedTeacherIds.slice(1);
      for (const teacherId of additionalTeachers) {
        await addTeacherToLecture(lectureId, teacherId, token);
      }

      // 第三步：更新本地状态
      const newLecture: MultiLecture = {
        id: lectureId,
        title: title.trim(),
        description: description.trim(),
        teacher_ids: selectedTeacherIds,
        status: createResponse.approval_status === "approved" ? "active" : "inactive",
        created_at: createResponse.created_at.split("T")[0],
      };

      setLectures([...lectures, newLecture]);
      resetForm();
      setModalOpen(false);

      showSuccessNotification(`複数講師講座「${title.trim()}」を作成しました`);
    } catch (err) {
      handleError(err, 'Lecture Creation', '講座の作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditLecture = async (lecture: MultiLecture) => {
    // 检查登录状态和权限
    const hasPermission = await checkAuthAndPermission();
    if (!hasPermission) return;

    try {
      // 获取讲师列表
      await fetchTeachers();
      
      // 获取当前讲座的讲师配置
      const currentTeachers = await fetchCurrentLectureTeachers(lecture.id);
      
      // 设置编辑状态
      setSelectedTeacherIds(currentTeachers);
      setEditingLecture(lecture);
      setTitle(lecture.title);
      setDescription(lecture.description);
      setModalOpen(true);
    } catch (error) {
      console.error("講座編集データ取得エラー:", error);
      notifications.show({
        title: "エラー",
        message: "講座の編集データを取得できませんでした",
        color: "red",
      });
    }
  };

  const handleUpdateLecture = async () => {
    if (!editingLecture || !validateForm()) return;
    
    // 检查登录状态和权限
    const hasPermission = await checkAuthAndPermission();
    if (!hasPermission) return;

    try {
      setSubmitting(true);
      
      // 第一步：更新讲座基本信息
      await updateMultiTeacherLecture(
        editingLecture.id,
        {
          lecture_title: title.trim(),
          lecture_description: description.trim(),
        },
        token!
      );

      // 第二步：更新讲师配置
      await updateMultiTeacherLectureTeachers(
        editingLecture.id,
        selectedTeacherIds,
        token!
      );

      // 第三步：更新本地状态
      const updatedLecture: MultiLecture = {
        ...editingLecture,
        title: title.trim(),
        description: description.trim(),
        teacher_ids: selectedTeacherIds,
      };
      
      setLectures(lectures.map(l => l.id === editingLecture.id ? updatedLecture : l));
      resetForm();
      setModalOpen(false);

      notifications.show({
        title: "更新完了",
        message: `講座「${title.trim()}」の情報を更新しました`,
        color: "green",
      });
    } catch (err) {
      console.error("講座更新エラー:", err);
      notifications.show({
        title: "エラー",
        message: err instanceof Error ? err.message : "講座の更新に失敗しました",
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };


  const formatDate = (dateString: string) => {
    if (dateString === "未定") {
      return "作成日未定";
    }
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const addTeacher = () => {
    setShowAddTeacherSelect(true);
    setNewTeacherId(null);
  };

  const confirmAddTeacher = () => {
    if (newTeacherId && newTeacherId !== 0) {
      setSelectedTeacherIds([...selectedTeacherIds, newTeacherId]);
      setShowAddTeacherSelect(false);
      setNewTeacherId(null);
    }
  };

  const cancelAddTeacher = () => {
    setShowAddTeacherSelect(false);
    setNewTeacherId(null);
  };

  const handleDeleteTeacher = (index: number) => {
    // 第一个讲师不可删除（主讲师）
    if (index === 0) {
      notifications.show({
        title: "削除不可",
        message: "最初の講師（主講師）は削除できません",
        color: "orange",
      });
      return;
    }

    const teacherId = selectedTeacherIds[index];
    // 如果讲师ID为0（未选择），直接删除，不需要确认
    if (teacherId === 0) {
      const newTeacherIds = selectedTeacherIds.filter((_, i) => i !== index);
      setSelectedTeacherIds(newTeacherIds);
      return;
    }

    // 已选择的讲师需要确认删除
    const teacherName = getTeacherName(teacherId);
    setTeacherToDelete({ index, teacherName });
    setDeleteTeacherModalOpen(true);
  };

  const confirmDeleteTeacher = async () => {
    if (!teacherToDelete || !editingLecture || !token) return;
    
    try {
      setDeletingTeacher(true);
      const teacherId = selectedTeacherIds[teacherToDelete.index];
      
      // 如果是编辑模式，调用API删除讲师
      if (editingLecture) {
        await removeTeacherFromLecture(editingLecture.id, teacherId, token);
        
        notifications.show({
          title: "削除完了",
          message: `講師「${teacherToDelete.teacherName}」を削除しました`,
          color: "green",
        });
      }
      
      // 更新本地状态
      const newTeacherIds = selectedTeacherIds.filter((_, index) => index !== teacherToDelete.index);
      setSelectedTeacherIds(newTeacherIds);
      
      // 关闭弹窗
      setDeleteTeacherModalOpen(false);
      setTeacherToDelete(null);
      
    } catch (error) {
      console.error("講師削除エラー:", error);
      notifications.show({
        title: "エラー",
        message: error instanceof Error ? error.message : "講師の削除に失敗しました",
        color: "red",
      });
    } finally {
      setDeletingTeacher(false);
    }
  };

  const updateTeacher = (index: number, teacherId: number) => {
    const newTeacherIds = [...selectedTeacherIds];
    newTeacherIds[index] = teacherId;
    setSelectedTeacherIds(newTeacherIds);
  };

  const getTeacherName = (teacherId: number) => {
    const teacher = allTeachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : `講師${teacherId}`;
  };

  return (
    <Box px="lg" pt="md">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconBook2 size={28} color="#444" />
          <Title order={2}>複数講師講座管理</Title>
        </Group>
        <Button
          leftSection={<IconPlus size={18} />}
          onClick={async () => {
            // 检查登录状态和权限
            const hasPermission = await checkAuthAndPermission();
            if (!hasPermission) return;

            await fetchTeachers();
            setModalOpen(true);
          }}
          color="blue"
          radius="md"
        >
          新規作成
        </Button>
      </Group>

      {loading ? (
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="md">
            <Skeleton height={20} width="30%" />
            <Skeleton height={200} />
          </Stack>
        </Paper>
      ) : lectures.length === 0 ? (
        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <Stack align="center" gap="md">
            <IconBook2 size={48} color="#ccc" />
            <Text size="lg" color="dimmed">
              複数講師講座が登録されていません
            </Text>
            <Text size="sm" color="dimmed">
              新規作成ボタンから講座を追加してください
            </Text>
          </Stack>
        </Paper>
      ) : (
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Table striped highlightOnHover withColumnBorders>
            <thead style={{ backgroundColor: "#f9fafb" }}>
              <tr>
                <th style={{ textAlign: "left", width: "30%" }}>
                  <Text size="sm">講座タイトル</Text>
                </th>
                <th style={{ textAlign: "left", width: "40%" }}>
                  <Text size="sm">説明</Text>
                </th>
                <th style={{ textAlign: "center", width: "20%" }}>
                  <Text size="sm">講師</Text>
                </th>
                <th style={{ textAlign: "center", width: "10%" }}>
                  <Text size="sm">作成日</Text>
                </th>
                <th style={{ textAlign: "center", width: "5%" }}>
                  <Text size="sm">操作</Text>
                </th>
              </tr>
            </thead>
            <tbody>
              {lectures.map((lecture) => (
                <tr key={lecture.id}>
                  <td style={{ textAlign: "left", padding: "12px 8px" }}>
                    <Text fw={500} size="sm">
                      {lecture.title}
                    </Text>
                  </td>
                  <td style={{ textAlign: "left", padding: "12px 8px" }}>
                    <Text size="sm" color="dimmed" lineClamp={2}>
                      {lecture.description}
                    </Text>
                  </td>
                  <td style={{ textAlign: "center", padding: "12px 8px" }}>
                    <Badge color="blue" variant="light">
                      複数講師
                    </Badge>
                  </td>
                  <td style={{ textAlign: "center", padding: "12px 8px" }}>
                    <Text size="sm" color="dimmed">
                      {formatDate(lecture.created_at)}
                    </Text>
                  </td>
                  <td style={{ textAlign: "center", padding: "12px 8px" }}>
                    <Group gap="xs" justify="center">
                      <Tooltip label="編集">
                        <ActionIcon
                          variant="outline"
                          color="blue"
                          onClick={() => handleEditLecture(lecture)}
                          size="sm"
                        >
                          <IconPencil size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Paper>
      )}

      {/* 作成・編集モーダル */}
      <Modal
        opened={modalOpen}
        onClose={handleCloseModal}
        title={editingLecture ? "講座編集" : "新規講座作成"}
        centered
        size="lg"
        radius="md"
        overlayProps={{ blur: 3, opacity: 0.15 }}
        closeOnClickOutside={!submitting}
        closeOnEscape={!submitting}
        styles={{
          body: { padding: 0 },
          header: { padding: '24px 24px 0 24px' }
        }}
      >
        <Stack gap="md" p="md">
          {/* 基本信息区域 */}
          <div>
            <Text size="md" fw={600} mb="md" c="dark.7">
              {editingLecture ? "講座情報の編集" : "新規講座の作成"}
            </Text>
            
            <Stack gap="md">
              <TextInput
                label="講座タイトル"
                placeholder="例：プログラミング基礎講座"
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
                withAsterisk
                maxLength={100}
                size="md"
                styles={{
                  label: { fontWeight: 500, marginBottom: 8 }
                }}
              />
              
              <Textarea
                label="講座説明"
                placeholder="講座の詳細な説明を入力してください"
                value={description}
                onChange={(e) => setDescription(e.currentTarget.value)}
                withAsterisk
                minRows={4}
                maxRows={6}
                size="md"
                styles={{
                  label: { fontWeight: 500, marginBottom: 8 }
                }}
              />
            </Stack>
          </div>
          
          <Divider />
          
          {/* 讲师选择区域 */}
          <div>
            <Group justify="space-between" align="center" mb="md">
              <Text size="md" fw={600} c="dark.7">
                講師選択
              </Text>
              <Badge color="blue" variant="light" size="sm">
                必須 *
              </Badge>
            </Group>
            
            {loadingTeachers ? (
              <Skeleton height={120} />
            ) : (
              <Stack gap="sm">
                {selectedTeacherIds.length === 0 ? (
                  <Paper p="md" withBorder style={{ borderStyle: 'dashed' }}>
                    <Stack align="center" gap="xs">
                      <IconBook2 size={24} color="var(--mantine-color-gray-4)" />
                      <Text size="sm" c="dimmed" ta="center">
                        講師が選択されていません
                      </Text>
                      <Text size="xs" c="dimmed" ta="center">
                        下のボタンから講師を追加してください
                      </Text>
                    </Stack>
                  </Paper>
                ) : (
                  <Stack gap="xs">
                    {selectedTeacherIds.map((teacherId, index) => (
                      <Paper key={index} p="sm" withBorder>
                        <Group gap="sm" align="center">
                          <Badge variant="light" color="blue" size="xs">
                            {index + 1}
                          </Badge>
                          <Text 
                            style={{ flex: 1 }} 
                            size="sm"
                            c={teacherId === 0 ? "dimmed" : "dark"}
                            truncate
                          >
                            {teacherId === 0 ? "講師未選択" : getTeacherName(teacherId)}
                          </Text>
                          <ActionIcon
                            variant="light"
                            color={index === 0 ? "gray" : "red"}
                            onClick={() => handleDeleteTeacher(index)}
                            size="sm"
                            disabled={index === 0}
                            title={index === 0 ? "最初の講師は削除できません" : "講師を削除"}
                          >
                            <IconX size={14} />
                          </ActionIcon>
                        </Group>
                      </Paper>
                    ))}
                    
                    {/* 新增讲师选择区域 */}
                    {showAddTeacherSelect && (
                      <Paper p="sm" withBorder style={{ borderColor: "var(--mantine-color-blue-4)" }}>
                        <Stack gap="sm">
                          <Text size="sm" fw={500} c="blue">
                            新しい講師を選択
                          </Text>
                          <Group gap="sm" align="center">
                            <Select
                              placeholder="講師を選択"
                              value={newTeacherId?.toString() || ""}
                              onChange={(value) => setNewTeacherId(value ? parseInt(value) : null)}
                              data={allTeachers
                                .filter(teacher => !selectedTeacherIds.includes(teacher.id))
                                .map(teacher => ({
                                  value: teacher.id.toString(),
                                  label: teacher.name
                                }))}
                              style={{ flex: 1 }}
                              size="sm"
                            />
                            <Button
                              size="xs"
                              color="blue"
                              onClick={confirmAddTeacher}
                              disabled={!newTeacherId || newTeacherId === 0}
                            >
                              追加
                            </Button>
                            <Button
                              size="xs"
                              variant="light"
                              color="gray"
                              onClick={cancelAddTeacher}
                            >
                              キャンセル
                            </Button>
                          </Group>
                        </Stack>
                      </Paper>
                    )}
                  </Stack>
                )}
                
              </Stack>
            )}
          </div>
          
          {submitting && (
            <Alert icon={<IconAlertCircle size={16} />} color="blue">
              処理中です。しばらくお待ちください。
            </Alert>
          )}
          
          {/* 按钮区域 */}
          <Group justify="space-between" gap="md">
            {!showAddTeacherSelect && (
              <Button
                variant="light"
                leftSection={<IconPlus size={14} />}
                onClick={addTeacher}
                size="sm"
                style={{ flex: 1 }}
              >
                講師を追加
              </Button>
            )}
            <Button
              size="md"
              onClick={editingLecture ? handleUpdateLecture : handleCreateLecture}
              color="indigo"
              radius="md"
              loading={submitting}
              disabled={submitting}
              style={{ flex: 1 }}
            >
              {editingLecture ? "更新する" : "講座を作成する"}
            </Button>
          </Group>
        </Stack>
      </Modal>


      {/* 講師削除確認モーダル */}
      <Modal
        opened={deleteTeacherModalOpen}
        onClose={() => !deletingTeacher && setDeleteTeacherModalOpen(false)}
        title="講師削除確認"
        centered
        size="sm"
        closeOnClickOutside={!deletingTeacher}
        closeOnEscape={!deletingTeacher}
      >
        <Stack gap="md">
          <Text>
            「{teacherToDelete?.teacherName}」をこの講座から削除しますか？
          </Text>
          <Text size="sm" c="dimmed">
            この操作は取り消すことができません。
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="outline"
              onClick={() => setDeleteTeacherModalOpen(false)}
              disabled={deletingTeacher}
            >
              キャンセル
            </Button>
            <Button
              color="red"
              onClick={confirmDeleteTeacher}
              loading={deletingTeacher}
              disabled={deletingTeacher}
            >
              削除する
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
