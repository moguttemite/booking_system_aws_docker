"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import useAuthStore from "@/store/useUserStore";

// 路由重定向组件
export default function RouteRedirect({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return; // 等待 Zustand 恢复

    // 如果用户已登录
    if (user) {
      // 如果当前在首页，根据角色重定向
      if (pathname === "/") {
        // 添加一个小延迟，让登录表单的重定向逻辑先执行
        const timer = setTimeout(() => {
          let targetPath = "";
          
          switch (user.role) {
            case "student":
              targetPath = "/bookings";
              break;
            case "teacher":
              targetPath = "/teacher";
              break;
            case "admin":
              targetPath = "/admin";
              break;
            default:
              return;
          }
          
          // 执行跳转
          if (targetPath) {
            try {
              router.push(targetPath);
              // 如果router.push失败，使用window.location
              setTimeout(() => {
                if (window.location.pathname !== targetPath) {
                  window.location.href = targetPath;
                }
              }, 100);
            } catch (error) {
              window.location.href = targetPath;
            }
          }
        }, 200); // 给登录表单更多时间完成跳转

        return () => clearTimeout(timer);
      }
    } else {
      // 如果用户未登录，但访问需要登录的页面，重定向到首页
      const protectedRoutes = ["/bookings", "/teacher", "/admin", "/mypage"];
      if (protectedRoutes.includes(pathname)) {
        router.push("/");
      }
    }
  }, [user, pathname, router, hydrated]);

  return <>{children}</>;
} 