// pages/teacher.tsx
'use client';
import { 
  Modal, 
  TextInput, 
  Textarea, 
  Button, 
  Box, 
  Title, 
  Loader, 
  Text, 
  Card, 
  Group, 
  Stack, 
  Grid,
  Paper
} from "@mantine/core";
import { 
  IconUser, 
  IconPlus, 
  IconBook2, 
  IconLogout
} from '@tabler/icons-react';

import LectureCard from '@/components/teacher/LectureCard';
import ScheduleModal from '@/components/teacher/ScheduleModal';
import ProfileEditModal from '@/components/teacher/ProfileEditModal';
import LectureScheduleViewModal from '@/components/LectureScheduleViewModal';
import { useTeacherDashboard } from '@/hooks/useTeacherDashboard';

const TeacherDashboard = () => {
  const {
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
  } = useTeacherDashboard();

  if (!hydrated) {
    return (
      <Box className="w-full max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-32">
          <Loader size="lg" />
          <Text ml="md">Loading...</Text>
        </div>
      </Box>
    );
  }

  // 显示登录状态检查加载状态
  if (sessionChecking) {
    return (
      <Box className="w-full max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-32">
          <Loader size="lg" />
          <Text ml="md">ログイン状態を確認中...</Text>
        </div>
      </Box>
    );
  }

  // 如果登录状态检查失败，显示等待状态
  if (!sessionChecked) {
    return (
      <Box className="w-full max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-32">
          <Loader size="lg" />
          <Text ml="md">セッション確認中...</Text>
        </div>
      </Box>
    );
  }

  return (
    <Box className="w-full max-w-6xl mx-auto p-6">
      {/* 头部 - 讲师信息展示区域 */}
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg" style={{ position: 'relative' }}>
        {profileLoading ? (
          <Group justify="center" py="xl">
            <Loader size="lg" />
            <Text>プロフィールを読み込み中...</Text>
          </Group>
        ) : (
          <>
            <Group gap="lg" align="flex-start">
              {/* 左侧 - 照片 */}
              <Box style={{ flexShrink: 0 }}>
                <Box
                  style={{
                    width: '200px',
                    height: '300px',
                    border: '2px solid var(--mantine-color-gray-3)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#f8f9fa'
                  }}
                >
                  <img
                    src={teacherProfile?.profile_image || '/default_avatar.png'}
                    alt={user?.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      objectPosition: 'center'
                    }}
                  />
                </Box>
              </Box>

              {/* 右侧 - 信息区域 */}
              <Box style={{ flex: 1 }}>
                <Stack gap="md">
                  {/* 标题和姓名 */}
                  <div>
                    <Title order={1} size="h2" mb="xs">
                      講師ページ - {user?.name}さん
                    </Title>
                  </div>

                  {/* 联系信息 */}
                  {teacherProfile?.phone && (
                    <div>
                      <Text size="sm" c="dimmed" mb="xs">連絡先</Text>
                      <Text size="md" fw={500}>{teacherProfile.phone}</Text>
                    </div>
                  )}

                  {/* 自我介绍 */}
                  {teacherProfile?.bio && (
                    <div>
                      <Text size="sm" c="dimmed" mb="xs">自己紹介</Text>
                      <Text 
                        size="md" 
                        style={{ 
                          lineHeight: 1.8,
                          minHeight: '80px',
                          padding: '12px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '6px',
                          border: '1px solid var(--mantine-color-gray-3)'
                        }}
                      >
                        {teacherProfile.bio}
                      </Text>
                    </div>
                  )}

                  {/* 空占位区域，确保内容区域有足够高度 */}
                  {!teacherProfile?.phone && !teacherProfile?.bio && (
                    <div style={{ minHeight: '120px' }}></div>
                  )}
                </Stack>
              </Box>
            </Group>

            {/* 固定在右下角的操作按钮 */}
            <Group 
              gap="xs" 
              style={{ 
                position: 'absolute',
                bottom: '24px',
                right: '24px',
                zIndex: 10,
                flexWrap: 'wrap',
                justifyContent: 'flex-end'
              }}
              className="sm:flex-row flex-col"
            >
              <Button
                variant="light"
                leftSection={<IconUser size={16} />}
                onClick={handleProfileEditClick}
                style={{
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                }}
              >
                プロフィール編集
              </Button>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setOpenModal(true)}
                style={{
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                }}
              >
                新規講座を開設
              </Button>
            </Group>
          </>
        )}
      </Card>


      {/* 讲座管理区域 */}
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg">
        <Group justify="space-between" mb="md">
          <Title order={2} size="h3">マイ講座</Title>
          <Text size="sm" c="dimmed">
            講座名をクリックすると、予約可能時間および各時間帯の予約状況を表示します(過去日時は非表示)。
          </Text>
        </Group>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader size="lg" />
            <Text ml="md">講座を読み込み中...</Text>
          </div>
        ) : lectures.length === 0 ? (
          <Paper p="xl" withBorder>
            <Stack align="center" py="xl">
              <IconBook2 size={48} color="var(--mantine-color-gray-4)" />
              <Text size="lg" c="dimmed">まだ講座がありません</Text>
              <Text size="sm" c="dimmed">新しい講座を作成して始めましょう</Text>
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={() => setOpenModal(true)}
              >
                最初の講座を作成
              </Button>
            </Stack>
          </Paper>
        ) : (
          <Grid gutter="lg" style={{ alignItems: 'stretch' }}>
            {lectures.map((lecture) => (
              <Grid.Col key={lecture.id} span={{ base: 12, md: 6, lg: 4 }}>
                <LectureCard
                  lecture={lecture}
                  onEdit={handleEditLecture}
                  onSchedule={handleEditSchedule}
                  onViewSchedule={handleViewSchedule}
                />
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Card>

      {/* 底部操作区域 */}
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Group justify="center">
          <Button
            color="red"
            variant="outline"
            leftSection={<IconLogout size={16} />}
            onClick={handleLogout}
            size="lg"
          >
            ログアウト
          </Button>
        </Group>
      </Card>

      {/* 创建讲座模态框 */}
      <Modal
        opened={openModal}
        onClose={() => setOpenModal(false)}
        title="新規講座を開設"
        centered
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="講座タイトル"
            placeholder="例：AI入門講座"
            value={newTitle}
            onChange={(e) => setNewTitle(e.currentTarget.value)}
            required
          />
          <Textarea
            label="講座説明"
            placeholder="講座の内容を簡単に記述してください"
            value={newDescription}
            onChange={(e) => setNewDescription(e.currentTarget.value)}
            autosize
            minRows={3}
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="outline" onClick={() => setOpenModal(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCreateLecture}>
              講座を登録する
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* 编辑讲座模态框 */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="講座情報を編集"
        centered
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="講座タイトル"
            value={editTitle}
            onChange={(e) => setEditTitle(e.currentTarget.value)}
            required
          />
          <Textarea
            label="講座説明"
            value={editDescription}
            onChange={(e) => setEditDescription(e.currentTarget.value)}
            autosize
            minRows={3}
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSaveEdit}>
              保存
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* 时间安排模态框 */}
      <ScheduleModal
        opened={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        lecture={schedulingLecture}
      />

      {/* 个人资料编辑模态框 */}
      <ProfileEditModal
        opened={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onProfileUpdate={handleProfileUpdate}
      />

      {/* 查看预约安排模态框 */}
      <LectureScheduleViewModal
        opened={scheduleViewModalOpen}
        onClose={() => setScheduleViewModalOpen(false)}
        lecture={viewingLecture}
      />
    </Box>
  );
};

export default TeacherDashboard;
