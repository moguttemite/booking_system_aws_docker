"use client";
import { useState, useEffect } from "react";
import { 
  Title, 
  Table, 
  Button,
  Modal,
  Paper, 
  Skeleton, 
  Group, 
  Text, 
  Badge,
  Stack,
  Alert,
  Box,
  Avatar,
  Divider,
  Loader
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { 
  IconUser, 
  IconMail, 
  IconAlertCircle,
  IconPhone,
  IconFileText,
  IconRefresh
} from "@tabler/icons-react";
import { fetchPublicTeachers, TeacherType } from "@/lib/api";
import useAuthStore from "@/store/useUserStore";
import { checkSessionAndShowModal } from "@/lib/sessionManager";

const FALLBACK_TEACHERS: TeacherType[] = [
  { id: 8, name: "佐藤 太一", email: "teacher_a@gmail.com", phone: "090-1234-5678", bio: "経験豊富な講師です。" },
  { id: 9, name: "鈴木 花子", email: "teacher_b@gmail.com", phone: "090-2345-6789", bio: "専門分野に精通しています。" },
  { id: 10, name: "高橋 健吾", email: "teacher_c@gmail.com", phone: "090-3456-7890", bio: "実践的な指導を行います。" },
];

export default function TeachersPage() {
  const { user, token } = useAuthStore();
  const [teachers, setTeachers] = useState<TeacherType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherType | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(false);

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
        const isValid = await checkSessionAndShowModal(token);
        if (isValid) {
          setSessionChecked(true);
        } else {
          setError("セッションが期限切れです。再度ログインしてください。");
          setLoading(false);
        }
      } catch (error) {
        console.error('セッション確認エラー:', error);
        setError("セッションの確認に失敗しました");
        setLoading(false);
      } finally {
        setSessionChecking(false);
      }
    };

    checkSession();
  }, [token]);

  // 获取讲师数据
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const teachersData = await fetchPublicTeachers();
      if (teachersData && teachersData.length > 0) {
        setTeachers(teachersData);
        return;
      }
      
      // 如果API失败，使用备用数据
      setTeachers(FALLBACK_TEACHERS);
      notifications.show({
        title: "情報",
        message: "フォールバックデータを使用しています。",
        color: "blue",
      });
      
    } catch (error) {
      console.error("講師データ取得エラー:", error);
      setError("講師データの取得に失敗しました");
      setTeachers(FALLBACK_TEACHERS);
    } finally {
      setLoading(false);
    }
  };

  // 数据获取
  useEffect(() => {
    if (sessionChecked && token) {
      fetchTeachers();
    }
  }, [sessionChecked, token]);

  const handleDetailClick = (teacher: TeacherType) => {
    setSelectedTeacher(teacher);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTeacher(null);
  };

  const handleRefresh = async () => {
    if (!token) {
      setError("認証トークンが見つかりません");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // 先检查登录状态
      const isValid = await checkSessionAndShowModal(token);
      if (!isValid) {
        setError("セッションが期限切れです。再度ログインしてください。");
        return;
      }
      
      // 登录状态有效，继续获取数据
      await fetchTeachers();
    } catch (err) {
      console.error("refresh teachers error", err);
      setError(err instanceof Error ? err.message : "講師データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 显示加载状态
  if (sessionChecking) {
    return (
      <Box px="lg" pt="md">
        <Group gap="xs" mb="md">
          <IconUser size={28} color="#444" />
          <Title order={2}>講師一覧</Title>
        </Group>
        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text size="lg" c="dimmed">
              セッションを確認中...
            </Text>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box px="lg" pt="md">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconUser size={28} color="#444" />
          <Title order={2}>講師一覧</Title>
        </Group>
        <Button
          variant="outline"
          leftSection={<IconRefresh size={16} />}
          onClick={handleRefresh}
          loading={loading}
        >
          更新
        </Button>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
          {error}
          {error.includes("セッションが期限切れ") && (
            <Text size="sm" mt="xs">
              ログインし直してください。ページを再読み込みするか、管理者ダッシュボードに戻ってください。
            </Text>
          )}
        </Alert>
      )}

      {loading ? (
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="md">
            <Skeleton height={20} width="30%" />
            <Skeleton height={200} />
          </Stack>
        </Paper>
      ) : teachers.length === 0 ? (
        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <Stack align="center" gap="md">
            <IconUser size={48} color="#ccc" />
            <Text size="lg" color="dimmed">
              講師が登録されていません
            </Text>
            <Text size="sm" color="dimmed">
              講師データを確認してください
            </Text>
          </Stack>
        </Paper>
      ) : (
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Table striped highlightOnHover withColumnBorders>
            <thead style={{ backgroundColor: "#f9fafb" }}>
              <tr>
                <th style={{ textAlign: "left", width: "30%" }}>
                  <Group gap="xs">
                    <IconUser size={16} />
                    <Text size="sm">講師名</Text>
                  </Group>
                </th>
                <th style={{ textAlign: "left", width: "35%" }}>
                  <Group gap="xs">
                    <IconMail size={16} />
                    <Text size="sm">メールアドレス</Text>
                  </Group>
                </th>
                <th style={{ textAlign: "left", width: "25%" }}>
                  <Group gap="xs">
                    <IconPhone size={16} />
                    <Text size="sm">電話番号</Text>
                  </Group>
                </th>
                <th style={{ textAlign: "center", width: "10%" }}>
                  <Text size="sm">詳細</Text>
                </th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td style={{ textAlign: "left", padding: "12px 8px" }}>
                    <Group gap="sm">
                      <Avatar size="sm" radius="xl" color="blue">
                        {teacher.name.charAt(0)}
                      </Avatar>
                      <Text fw={500} size="sm">
                        {teacher.name}
                      </Text>
                    </Group>
                  </td>
                  <td style={{ textAlign: "left", padding: "12px 8px" }}>
                    <Text size="sm" color="dimmed">
                      {teacher.email}
                    </Text>
                  </td>
                  <td style={{ textAlign: "left", padding: "12px 8px" }}>
                    <Text size="sm" color="dimmed">
                      {teacher.phone || "未設定"}
                    </Text>
                  </td>
                  <td style={{ textAlign: "center", padding: "12px 8px" }}>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleDetailClick(teacher)}
                    >
                      詳細
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Paper>
      )}

      {/* 詳細モーダル */}
      <Modal
        opened={modalOpen}
        onClose={handleCloseModal}
        title="講師詳細"
        centered
        size="lg"
        radius="md"
      >
        {selectedTeacher && (
          <Stack gap="md">
            {/* 講師基本情報 */}
            <Group gap="md">
              <Avatar size="xl" radius="xl" color="blue">
                {selectedTeacher.profile_image ? (
                  <img 
                    src={selectedTeacher.profile_image} 
                    alt={selectedTeacher.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  selectedTeacher.name.charAt(0)
                )}
              </Avatar>
              <Stack gap="xs" style={{ flex: 1 }}>
                <Text size="xl" fw={600}>
                  {selectedTeacher.name}
                </Text>
                <Group gap="md">
                  <Badge color="blue" variant="light" size="lg">
                    講師
                  </Badge>
                  <Text size="sm" color="dimmed">
                    ID: {selectedTeacher.id}
                  </Text>
                </Group>
              </Stack>
            </Group>

            <Divider />

            {/* 連絡先情報 */}
            <Stack gap="sm">
              <Text size="lg" fw={500}>
                連絡先情報
              </Text>
              <Group gap="md">
                <Group gap="xs">
                  <IconMail size={16} color="#666" />
                  <Text size="sm" fw={500}>メール:</Text>
                </Group>
                <Text size="sm">{selectedTeacher.email}</Text>
              </Group>
              <Group gap="md">
                <Group gap="xs">
                  <IconPhone size={16} color="#666" />
                  <Text size="sm" fw={500}>電話:</Text>
                </Group>
                <Text size="sm">
                  {selectedTeacher.phone || "未設定"}
                </Text>
              </Group>
            </Stack>

            {/* 自己紹介 */}
            {selectedTeacher.bio && (
              <>
                <Divider />
                <Stack gap="sm">
                  <Group gap="xs">
                    <IconFileText size={16} color="#666" />
                    <Text size="lg" fw={500}>
                      自己紹介
                    </Text>
                  </Group>
                  <Paper p="md" radius="md" bg="gray.0">
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedTeacher.bio}
                    </Text>
                  </Paper>
                </Stack>
              </>
            )}

            {/* アクション */}
            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={handleCloseModal}>
                閉じる
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}
