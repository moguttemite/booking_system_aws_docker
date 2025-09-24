'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Box, Title, Container, Loader, Center, Text, Stack } from '@mantine/core';
import useAuthStore from '@/store/useUserStore';
import { checkSessionAndShowModal } from '@/lib/sessionManager';

const menu = [
  { label: 'ユーザー一覧', path: '/admin/users' },
  { label: '講師一覧', path: '/admin/teachers' },
  { label: '講座一覧', path: '/admin/lectures' },
  { label: '複数講師講座', path: '/admin/multi-lectures' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout, token } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [clickedItem, setClickedItem] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // 登录状态检测
  useEffect(() => {
    const checkSession = async () => {
      if (!hydrated || !user || !token) {
        if (hydrated && (!user || user.role !== 'admin')) {
          router.push("/");
        }
        return;
      }

      try {
        setSessionChecking(true);
        const isValid = await checkSessionAndShowModal(token);
        if (isValid) {
          setSessionChecked(true);
        } else {
          // 如果登录状态无效，用户会在弹窗中重新登录
          // 这里不需要重定向，让用户处理登录弹窗
        }
      } catch (error) {
        console.error('セッション確認エラー:', error);
        // 如果检查失败，也标记为已检查，让用户处理
        setSessionChecked(true);
      } finally {
        setSessionChecking(false);
      }
    };

    checkSession();
  }, [hydrated, user, token, router]);

  // 原有的权限检查逻辑
  useEffect(() => {
    if (!hydrated) return;
    if (!user || user.role !== 'admin') {
      router.push("/");
    }
  }, [hydrated, user, router]);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleNavigation = (path: string) => {
    if (isNavigating || clickedItem === path) return;
    
    setIsNavigating(true);
    setClickedItem(path);
    
    // 添加点击反馈
    const element = document.querySelector(`[data-path="${path}"]`) as HTMLElement;
    if (element) {
      element.style.transform = 'scale(0.95)';
      element.style.transition = 'transform 0.1s ease';
      
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 100);
    }
    
    // 延迟导航，给用户视觉反馈时间
    setTimeout(() => {
      router.push(path);
      setIsNavigating(false);
      setClickedItem(null);
    }, 150);
  };

  // 显示加载状态
  if (!hydrated || sessionChecking) {
    return (
      <Container size="lg" px={0}>
        <Box style={{ 
          display: 'flex', 
          minHeight: '100vh', 
          fontFamily: 'sans-serif',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text size="lg" c="dimmed">
              {!hydrated ? '読み込み中...' : 'セッションを確認中...'}
            </Text>
          </Stack>
        </Box>
      </Container>
    );
  }

  // 如果用户未登录或不是管理员，显示重定向状态
  if (!user || user.role !== 'admin') {
    return (
      <Container size="lg" px={0}>
        <Box style={{ 
          display: 'flex', 
          minHeight: '100vh', 
          fontFamily: 'sans-serif',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text size="lg" c="dimmed">
              リダイレクト中...
            </Text>
          </Stack>
        </Box>
      </Container>
    );
  }

  return (
    <Container size="lg" px={0}>
      <Box style={{ 
        display: 'flex', 
        minHeight: '100vh', 
        fontFamily: 'sans-serif'
      }}>
        {/* サイドバー - 固定高度和位置 */}
        <Box
          style={{
            width: 240,
            background: '#f8f9fb',
            borderRight: '1px solid #e0e0e0',
            padding: '32px 0',
            boxShadow: '2px 0 4px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100vh', // 固定为视窗高度
            position: 'fixed', // 固定定位
            top: 0, // 顶部对齐
            left: 0, // 左侧对齐
            zIndex: 100, // 确保在其他内容之上
            overflowY: 'auto', // 如果内容过多，允许滚动
            overflowX: 'hidden', // 隐藏水平滚动条
          }}
        >
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <Link href="/admin" style={{ textDecoration: 'none' }}>
              <Title
                order={3}
                mb="xl"
                style={{
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: '#1976d2',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  lineHeight: '1.6rem',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.color = '#1565c0';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.color = '#1976d2';
                }}
              >
                管理者<br />ダッシュボード
              </Title>
            </Link>

            <nav>
              {menu.map((item) => {
                const isActive = pathname === item.path;
                const isClicked = clickedItem === item.path;
                
                return (
                  <div
                    key={item.path}
                    data-path={item.path}
                    onClick={() => handleNavigation(item.path)}
                    style={{
                      display: 'block',
                      padding: '12px 32px',
                      color: isActive ? '#1976d2' : '#333',
                      fontWeight: isActive ? 700 : 500,
                      background: isActive ? '#e3f2fd' : 'transparent',
                      textDecoration: 'none',
                      borderLeft: isActive ? '4px solid #1976d2' : '4px solid transparent',
                      marginBottom: 6,
                      transition: 'all 0.2s ease',
                      cursor: isNavigating && isClicked ? 'wait' : 'pointer',
                      opacity: isNavigating && isClicked ? 0.7 : 1,
                      transform: isClicked ? 'scale(0.98)' : 'scale(1)',
                      userSelect: 'none',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseOver={(e) => {
                      if (!isNavigating) {
                        e.currentTarget.style.background = isActive ? '#e8f4fd' : '#f0f0f0';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = isActive ? '#e3f2fd' : 'transparent';
                      e.currentTarget.style.transform = isClicked ? 'scale(0.98)' : 'scale(1)';
                    }}
                  >
                    {/* 点击时的波纹效果 */}
                    {isClicked && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'rgba(25, 118, 210, 0.1)',
                          borderRadius: '4px',
                          animation: 'ripple 0.3s ease-out',
                        }}
                      />
                    )}
                    {item.label}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* 登出按钮 - 固定在底部 */}
          <div style={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: 12,
            flexShrink: 0, // 防止被压缩
          }}>
            <button
              onClick={handleLogout}
              style={{
                width: 180,
                padding: '12px 0',
                borderRadius: 24,
                background: '#fff',
                color: '#d32f2f',
                border: '2px solid #d32f2f',
                fontWeight: 700,
                fontSize: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              onMouseOver={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '#d32f2f';
                (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                (e.currentTarget as HTMLButtonElement).style.border = '2px solid #d32f2f';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(211, 47, 47, 0.3)';
              }}
              onMouseOut={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '#fff';
                (e.currentTarget as HTMLButtonElement).style.color = '#d32f2f';
                (e.currentTarget as HTMLButtonElement).style.border = '2px solid #d32f2f';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
              }}
            >
              ログアウト
            </button>
          </div>
        </Box>

        {/* メインコンテンツ */}
        <Box style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh',
          marginLeft: 240, // 为固定侧边栏留出空间
        }}>
          {/* トップバー */}
          <Box
            style={{
              height: 56,
              background: '#fff',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              padding: '0 32px',
              flexShrink: 0,
            }}
          >
            <img src="/logo.png" alt="Logo" style={{ height: 36, objectFit: 'contain' }} />
          </Box>

          {/* メイン表示エリア */}
          <Box style={{ 
            flex: 1, 
            padding: 32, 
            background: '#fdfdfd', 
            minHeight: 0,
          }}>
            {children}
          </Box>
        </Box>
      </Box>

      {/* 添加CSS动画 */}
      <style jsx>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </Container>
  );
}

