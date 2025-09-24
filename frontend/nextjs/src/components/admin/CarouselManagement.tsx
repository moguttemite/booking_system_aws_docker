"use client";
import { useState, useEffect } from 'react';
import {
  Card,
  Title,
  Button,
  Group,
  Stack,
  Text,
  ActionIcon,
  Paper,
  Badge,
  Modal,
  Select,
  TextInput,
  Divider,
  Loader,
  Switch
} from '@mantine/core';
import { 
  IconPlus, 
  IconTrash, 
  IconArrowUp, 
  IconArrowDown,
  IconDeviceFloppy, 
  IconX,
  IconArrowsUpDown
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { fetchCarouselManagementList, fetchApprovedLectures, updateCarouselBatch } from '@/lib/api';
import useAuthStore from '@/store/useUserStore';
import { checkSessionAndShowModal } from '@/lib/sessionManager';
// 暂时不使用拖拽功能，使用按钮排序

interface CarouselItem {
  lecture_id: number;
  display_order: number;
  is_active: boolean;
}

interface Lecture {
  id: number;
  lecture_title: string;
  teacher_name: string;
  teacher_image: string;
  lecture_description: string;
  approval_status: string;
}

interface CarouselItemWithDetails extends CarouselItem {
  lecture_title: string;
  teacher_name: string;
  teacher_image: string;
}

const CarouselManagement = () => {
  const { token, user } = useAuthStore();
  const [carouselItems, setCarouselItems] = useState<CarouselItemWithDetails[]>([]);
  const [availableLectures, setAvailableLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedLectureId, setSelectedLectureId] = useState<string>('');

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!token || !user) {
      notifications.show({
        title: 'エラー',
        message: 'ログインが必要です',
        color: 'red'
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 检查会话有效性
      const isValidSession = await checkSessionAndShowModal(token);
      if (!isValidSession) {
        notifications.show({
          title: 'エラー',
          message: 'セッションが期限切れです。再度ログインしてください。',
          color: 'red'
        });
        setLoading(false);
        return;
      }

      // 并行加载轮播图配置和讲座数据
      const [carouselData, lecturesData] = await Promise.all([
        fetchCarouselManagementList(token),
        fetchApprovedLectures()
      ]);

      setAvailableLectures(lecturesData);

      // 合并轮播图配置和讲座信息
      const itemsWithDetails = carouselData.map(item => {
        const lecture = lecturesData.find(l => l.id === item.lecture_id);
        return {
          ...item,
          lecture_title: lecture?.lecture_title || '講座が見つかりません',
          teacher_name: lecture?.teacher_name || '講師が見つかりません',
          teacher_image: lecture?.teacher_image || '/default_avatar.png'
        };
      });

      // 按display_order排序
      itemsWithDetails.sort((a, b) => a.display_order - b.display_order);
      setCarouselItems(itemsWithDetails);

    } catch (error) {
      console.error('データ読み込みエラー:', error);
      notifications.show({
        title: 'エラー',
        message: error instanceof Error ? error.message : 'データの読み込みに失敗しました',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  // 添加讲座到轮播图
  const handleAddLecture = () => {
    if (!selectedLectureId) {
      notifications.show({
        title: 'エラー',
        message: '講座を選択してください',
        color: 'red'
      });
      return;
    }

    const lectureId = parseInt(selectedLectureId);
    const lecture = availableLectures.find(l => l.id === lectureId);
    
    if (!lecture) {
      notifications.show({
        title: 'エラー',
        message: '選択された講座が見つかりません',
        color: 'red'
      });
      return;
    }

    // 检查是否已经添加（双重保险）
    if (carouselItems.some(item => item.lecture_id === lectureId)) {
      notifications.show({
        title: 'エラー',
        message: 'この講座は既に追加されています',
        color: 'red'
      });
      return;
    }

    const newItem: CarouselItemWithDetails = {
      lecture_id: lectureId,
      display_order: carouselItems.length + 1,
      is_active: true,
      lecture_title: lecture.lecture_title,
      teacher_name: lecture.teacher_name,
      teacher_image: lecture.teacher_image
    };

    setCarouselItems([...carouselItems, newItem]);
    setSelectedLectureId('');
    setAddModalOpen(false);

    notifications.show({
      title: '成功',
      message: '講座を輪播図に追加しました',
      color: 'green'
    });
  };

     // 删除轮播图项目
   const handleDeleteItem = (index: number) => {
     setCarouselItems(carouselItems.filter((_, i) => i !== index));
     notifications.show({
       title: '成功',
       message: '項目を削除しました',
       color: 'green'
     });
   };

  // 上移项目
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    
    const items = [...carouselItems];
    const temp = items[index];
    items[index] = items[index - 1];
    items[index - 1] = temp;

    // 更新display_order
    const updatedItems = items.map((item, idx) => ({
      ...item,
      display_order: idx + 1
    }));

    setCarouselItems(updatedItems);
  };

     // 下移项目
   const handleMoveDown = (index: number) => {
     if (index === carouselItems.length - 1) return;
     
     const items = [...carouselItems];
     const temp = items[index];
     items[index] = items[index + 1];
     items[index + 1] = temp;

     // 更新display_order
     const updatedItems = items.map((item, idx) => ({
       ...item,
       display_order: idx + 1
     }));

     setCarouselItems(updatedItems);
   };

   // 切换激活状态
   const handleToggleActive = (index: number) => {
     const updatedItems = [...carouselItems];
     updatedItems[index] = {
       ...updatedItems[index],
       is_active: !updatedItems[index].is_active
     };
     setCarouselItems(updatedItems);
   };

  // 保存配置
  const handleSave = async () => {
    if (!token || !user) {
      notifications.show({
        title: 'エラー',
        message: 'ログインが必要です',
        color: 'red'
      });
      return;
    }

    setSaving(true);
    try {
      // 检查会话有效性
      const isValidSession = await checkSessionAndShowModal(token);
      if (!isValidSession) {
        notifications.show({
          title: 'エラー',
          message: 'セッションが期限切れです。再度ログインしてください。',
          color: 'red'
        });
        setSaving(false);
        return;
      }

      // 准备保存的数据
      const carouselList = carouselItems.map(item => ({
        lecture_id: item.lecture_id,
        display_order: item.display_order,
        is_active: item.is_active
      }));

      // 调用后端API保存配置
      const result = await updateCarouselBatch(carouselList, token);
      console.log('保存成功:', result);

      notifications.show({
        title: '成功',
        message: result.message || '輪播図設定を保存しました',
        color: 'green'
      });

    } catch (error) {
      console.error('保存エラー:', error);
      notifications.show({
        title: 'エラー',
        message: error instanceof Error ? error.message : '設定の保存に失敗しました',
        color: 'red'
      });
    } finally {
      setSaving(false);
    }
  };

  // 取消修改
  const handleCancel = () => {
    loadData(); // 重新加载原始数据
    notifications.show({
      title: 'キャンセル',
      message: '変更をキャンセルしました',
      color: 'blue'
    });
  };

  if (loading) {
    return (
      <Card p="xl">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Loader size="lg" />
          <Text ml="md">データを読み込み中...</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card p="xl" withBorder>
      <Stack gap="lg">
        {/* 标题和添加按钮 */}
        <Group justify="space-between" align="center">
          <div>
            <Title order={3} mb="xs">ホームページ輪播図設定</Title>
            <Text size="sm" c="dimmed">
              ホームページの輪播図に表示する講座を管理します
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setAddModalOpen(true)}
            variant="light"
          >
            講座を追加
          </Button>
        </Group>

        <Divider />

        {/* 轮播图项目列表 */}
        {carouselItems.length === 0 ? (
          <Paper p="xl" withBorder>
            <Stack align="center" py="xl">
              <IconArrowsUpDown size={48} color="var(--mantine-color-gray-4)" />
              <Text size="lg" c="dimmed">輪播図に追加された講座がありません</Text>
              <Text size="sm" c="dimmed">右上の「講座を追加」ボタンから講座を追加してください</Text>
            </Stack>
          </Paper>
        ) : (
          <>
            <Stack gap="sm">
              {carouselItems.map((item, index) => (
                <Paper
                  key={`${item.lecture_id}-${item.display_order}`}
                  p="md"
                  withBorder
                  style={{
                    backgroundColor: 'var(--mantine-color-gray-0)'
                  }}
                >
                  <Group justify="space-between" align="center">
                    <Group gap="md">
                      <Badge variant="light" color="blue">
                        {item.display_order}
                      </Badge>
                      <div>
                        <Text fw={500} size="sm">
                          {item.lecture_title}
                        </Text>
                        <Text size="xs" c="dimmed">
                          講師: {item.teacher_name}
                        </Text>
                      </div>
                    </Group>
                    <Group gap="xs" align="center">
                      <Switch
                        checked={item.is_active}
                        onChange={() => handleToggleActive(index)}
                        size="sm"
                        label={item.is_active ? "有効" : "無効"}
                        labelPosition="left"
                      />
                      <ActionIcon
                        color="blue"
                        variant="light"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <IconArrowUp size={16} />
                      </ActionIcon>
                      <ActionIcon
                        color="blue"
                        variant="light"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === carouselItems.length - 1}
                      >
                        <IconArrowDown size={16} />
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() => handleDeleteItem(index)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Paper>
              ))}
            </Stack>

            {/* 操作按钮 - 修复对齐问题 */}
            <Group justify="flex-end" gap="md" mt="lg">
              <Button
                variant="outline"
                leftSection={<IconX size={16} />}
                onClick={handleCancel}
              >
                キャンセル
              </Button>
              <Button
                leftSection={<IconDeviceFloppy size={16} />}
                onClick={handleSave}
                loading={saving}
                disabled={carouselItems.length === 0}
              >
                保存
              </Button>
            </Group>
          </>
        )}
      </Stack>

      {/* 添加讲座模态框 */}
      <Modal
        opened={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="講座を輪播図に追加"
        centered
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            承認済みの講座から選択してください
          </Text>
          
          <Select
            label="講座を選択"
            placeholder="講座を選択してください"
            data={availableLectures
              .filter(lecture => !carouselItems.some(item => item.lecture_id === lecture.id))
              .map(lecture => ({
                value: lecture.id.toString(),
                label: `${lecture.lecture_title} (${lecture.teacher_name})`
              }))}
            value={selectedLectureId}
            onChange={(value) => setSelectedLectureId(value || '')}
            searchable
            clearable
          />

          <Group justify="flex-end" gap="xs">
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAddLecture}>
              追加
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  );
};

export default CarouselManagement;
