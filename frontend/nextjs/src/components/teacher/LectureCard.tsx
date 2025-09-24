import React from 'react';
import { 
  Card, 
  Group, 
  Title, 
  Text, 
  Badge, 
  ActionIcon, 
  Tooltip 
} from "@mantine/core";
import { IconEdit, IconClock } from '@tabler/icons-react';
import type { BookableTeacher } from "@/types/booking";
import { getStatusColor, getStatusText, isMultiTeacherLecture } from '@/lib/teacherUtils';

interface LectureCardProps {
  lecture: BookableTeacher;
  onEdit: (lecture: BookableTeacher) => void;
  onSchedule: (lecture: BookableTeacher) => void;
  onViewSchedule?: (lecture: BookableTeacher) => void;
}

const LectureCard: React.FC<LectureCardProps> = ({ 
  lecture, 
  onEdit, 
  onSchedule,
  onViewSchedule
}) => {
  // 检查是否为多讲师讲座
  const isMultiTeacher = isMultiTeacherLecture(lecture);

  return (
    <Card 
      shadow="sm" 
      padding="lg" 
      radius="md" 
      withBorder 
      style={{ 
        height: '280px',
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* 标题和状态区域 */}
      <Group justify="space-between" mb="md" style={{ flexShrink: 0 }}>
        <Title 
          order={4} 
          size="h5" 
          lineClamp={1} 
          style={{ 
            flex: 1, 
            marginRight: 8,
            fontSize: '1.1rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: 'var(--mantine-color-blue-6)'
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onViewSchedule) {
              onViewSchedule(lecture);
            }
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          {lecture.lecture_title}
        </Title>
        <Group gap="xs" style={{ flexShrink: 0 }}>
          {/* 多讲师讲座标识 */}
          {isMultiTeacher && (
            <Badge 
              color="blue" 
              variant="filled" 
              style={{ 
                fontSize: '0.7rem',
                padding: '2px 6px'
              }}
            >
              複数講師講座
            </Badge>
          )}
          <Badge 
            color={getStatusColor(lecture.approval_status)} 
            variant="light" 
            style={{ 
              fontSize: '0.75rem',
              padding: '4px 8px'
            }}
          >
            {getStatusText(lecture.approval_status)}
          </Badge>
        </Group>
      </Group>
      
      {/* 描述区域 - 固定高度，确保按钮始终可见 */}
      <div style={{ 
        flex: 1, 
        minHeight: '120px',
        maxHeight: '120px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <Text 
          size="sm" 
          c="dimmed" 
          style={{ 
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 5,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {lecture.lecture_description || '説明がありません'}
        </Text>
        
        {/* 渐变遮罩，提示有更多内容 */}
        {lecture.lecture_description && lecture.lecture_description.length > 100 && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '20px',
            background: 'linear-gradient(transparent, white)',
            pointerEvents: 'none'
          }} />
        )}
      </div>
      
      {/* 操作按钮区域 - 始终在底部 */}
      <Group gap="xs" style={{ 
        marginTop: '16px',
        flexShrink: 0,
        justifyContent: 'flex-start'
      }}>
        {/* 编辑按钮 - 暂时禁用 */}
        {!isMultiTeacher && (
          <Tooltip label="講座情報を編集（現在無効）">
            <ActionIcon 
              variant="light" 
              color="gray" 
              size="md"
              disabled
              style={{
                transition: 'all 0.2s ease',
                opacity: 0.5,
                cursor: 'not-allowed'
              }}
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
        )}
        
        {/* 时间安排按钮 - 根据讲座状态决定是否可用 */}
        {lecture.approval_status === 'approved' ? (
          <Tooltip label="時間枠を編集">
            <ActionIcon 
              variant="light" 
              color="green" 
              size="md"
              onClick={(e) => {
                e.stopPropagation();
                onSchedule(lecture);
              }}
              style={{
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <IconClock size={16} />
            </ActionIcon>
          </Tooltip>
        ) : (
          <Tooltip label={`${getStatusText(lecture.approval_status)}の講座は時間枠を編集できません`}>
            <ActionIcon 
              variant="light" 
              color="gray" 
              size="md"
              disabled
              style={{
                transition: 'all 0.2s ease',
                opacity: 0.5,
                cursor: 'not-allowed'
              }}
            >
              <IconClock size={16} />
            </ActionIcon>
          </Tooltip>
        )}
        
        {/* 多讲师讲座提示 */}
        {isMultiTeacher && (
          <Text size="xs" c="dimmed" style={{ marginLeft: 'auto' }}>
            管理者のみ編集可能
          </Text>
        )}
      </Group>
    </Card>
  );
};

export default LectureCard;
