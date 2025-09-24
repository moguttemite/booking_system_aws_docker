'use client';
import { useState } from 'react';
import { Box, Title, Text, Card, Stack, Button } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import ProfileEditModal from '@/components/teacher/ProfileEditModal';

const TestImageUploadPage = () => {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleProfileUpdate = (profile: any) => {
    console.log('プロフィール更新:', profile);
  };

  return (
    <Box p="xl">
      <Button
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        onClick={handleBack}
        mb="lg"
      >
        戻る
      </Button>

      <Card shadow="sm" padding="xl" radius="md" withBorder>
        <Stack gap="lg">
          <Title order={2}>講師プロフィール画像アップロードテスト</Title>
          
          <Text c="dimmed">
            このページでは、講師のプロフィール画像アップロード機能をテストできます。
            <br />
            講座の宣伝画像や講師の全身写真に適した設定になっています。
          </Text>

          <Box>
            <Text fw={500} mb="xs">テスト内容:</Text>
            <Stack gap="xs">
              <Text size="sm">• 画像ファイルの選択とプレビュー</Text>
              <Text size="sm">• 自動圧縮（1200x800px、85%品質）</Text>
              <Text size="sm">• ファイルサイズの表示</Text>
              <Text size="sm">• エラーハンドリング</Text>
              <Text size="sm">• 保存とファイルシステムへの書き込み</Text>
            </Stack>
          </Box>

          <Button
            size="lg"
            onClick={() => setModalOpen(true)}
          >
            プロフィール編集モーダルを開く
          </Button>
        </Stack>
      </Card>

      <ProfileEditModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        onProfileUpdate={handleProfileUpdate}
      />
    </Box>
  );
};

export default TestImageUploadPage;
