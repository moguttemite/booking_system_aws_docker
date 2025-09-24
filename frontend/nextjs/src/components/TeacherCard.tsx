"use client";

import React, { useEffect, useState } from "react";
import { Skeleton } from "@mantine/core";
import type { LectureStatus } from "@/types";

// ==================== 类型定义 ====================

/**
 * 讲师卡片组件的Props
 */
export interface TeacherCardProps {
  /** 讲座ID */
  lectureId: number;
  /** 讲座标题 */
  lectureTitle?: string;
  /** 讲座描述 */
  lectureDescription?: string;
  /** 讲师姓名 */
  teacherName?: string;
  /** 讲师头像 */
  teacherImage?: string | null;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 错误信息 */
  error?: string | null;
  /** 点击事件处理器 */
  onClick?: (lectureId: number) => void;
  /** 自定义样式类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 讲座数据接口
 */
export interface LectureData {
  /** 讲师ID */
  teacher_id: number;
  /** 讲座ID */
  lecture_id: number;
  /** 讲师姓名 */
  teacher_name: string;
  /** 讲师简介 */
  teacher_bio: string;
  /** 讲师头像 */
  teacher_image: string;
  /** 讲座标题 */
  lecture_title: string;
  /** 讲座描述 */
  lecture_description: string;
  /** 审批状态 */
  approval_status: LectureStatus;
  /** 创建时间 */
  created_at?: string;
  /** 更新时间 */
  updated_at?: string;
}

/**
 * 组件状态接口
 */
export interface TeacherCardState {
  /** 讲座数据 */
  data: LectureData | null;
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
}

/**
 * 时间选项接口
 */
export interface TimeOption {
  /** 时间值 */
  value: string;
  /** 显示标签 */
  label: string;
}

/**
 * 讲师卡片事件处理器
 */
export interface TeacherCardHandlers {
  /** 点击事件 */
  onClick?: (lectureId: number) => void;
  /** 错误处理 */
  onError?: (error: string) => void;
  /** 数据加载完成 */
  onDataLoaded?: (data: LectureData) => void;
}

const TeacherCard: React.FC<TeacherCardProps> = ({ 
  lectureId, 
  lectureTitle, 
  lectureDescription, 
  teacherName, 
  teacherImage,
  loading: externalLoading = false,
  error: externalError = null,
  onClick,
  className = "",
  disabled = false
}) => {
  const [data, setData] = useState<LectureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 如果已经传入了数据，直接使用
    if (lectureTitle && lectureDescription && teacherName) {
      setData({
        teacher_id: 0, // 占位值
        lecture_id: lectureId,
        teacher_name: teacherName,
        teacher_bio: "", // 占位值
        teacher_image: teacherImage || "/default_avatar.png", // 使用传入的图片或默认图片
        lecture_title: lectureTitle,
        lecture_description: lectureDescription,
        approval_status: "approved"
      });
      setLoading(false);
      return;
    }

    // 否则从后端API获取数据
    const fetchLectureData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/bookable.json");
        if (!response.ok) throw new Error("データの取得に失敗しました");
        const lectures: LectureData[] = await response.json();
        const lecture = lectures.find((l) => l.lecture_id === lectureId);
        if (!lecture) throw new Error("講座が見つかりません");
        setData(lecture);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "不明なエラー");
      } finally {
        setLoading(false);
      }
    };
    fetchLectureData();
  }, [lectureId, lectureTitle, lectureDescription, teacherName, teacherImage]);

  if (loading || !data) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 20,
        overflow: 'hidden'
      }}>
        <Skeleton height="100%" style={{ width: '40%' }} />
        <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton height={32} width="80%" />
          <Skeleton height={80} width="90%" />
          <Skeleton height={20} width="60%" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid #e2e8f0',
        borderRadius: 20,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#e53e3e' }}>
          <div style={{ fontSize: '1rem' }}>{error}</div>
        </div>
      </div>
    );
  }

  const fallbackImg = "/default-teacher.png";
  const teacherImageSrc = data.teacher_image || fallbackImg;

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid #e2e8f0",
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
      }}
    >
      {/* 左侧图片 */}
      <div
        style={{
          width: "40%",
          minWidth: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          borderRight: "1px solid #e2e8f0",
          padding: "0.5rem",
        }}
      >
        <img
          src={teacherImageSrc}
          alt={data.teacher_name}
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackImg;
          }}
        />
      </div>

      {/* 右侧内容区域 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem",
          backgroundColor: "#ffffff",
          position: "relative",
        }}
      >
        {/* 课程标题 */}
        <div
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#1a202c",
            marginBottom: "1rem",
            lineHeight: 1.3,
          }}
        >
          {data.lecture_title || "课程标题加载中..."}
        </div>

        {/* 课程描述 */}
        <div
          style={{
            fontSize: "0.95rem",
            color: "#4a5568",
            lineHeight: 1.6,
            flex: 1,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 6,
            textOverflow: "ellipsis",
          }}
        >
          {data.lecture_description || "课程描述加载中..."}
        </div>

        {/* 讲师名称标签 */}
        <div
          style={{
            marginTop: "1rem",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "0.5rem 1rem",
              backgroundColor: "#f7fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "20px",
              fontSize: "0.875rem",
              color: "#4a5568",
              transition: "all 0.2s ease",
              position: "relative",
            }}
          >
            👨‍🏫 {data.teacher_name || "讲师姓名加载中..."}
          </div>
        </div>
      </div>


    </div>
  );
};

export default TeacherCard;
