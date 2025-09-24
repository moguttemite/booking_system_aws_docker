"use client";
import ExpertBooking from "@/components/ExpertBooking";
import { Button } from "@mantine/core";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useUserStore";
import { useEffect, useState } from "react";

const BookingListPage = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return; // 等 Zustand 恢复
    if (!user) {
      router.push("/");
    }
  }, [user, router, hydrated]);

  return (
    <>
      <ExpertBooking />
      {/* 底部操作按钮 */}
      <div className="flex justify-center gap-6 mt-10 mb-4">
        <Button
          type="button"
          color="blue"
          variant="filled"
          size="lg"
          style={{
            fontWeight: 700,
            fontSize: "1.1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
            borderRadius: 8,
            minWidth: 140,
          }}
          onClick={() => {
            router.push("/mypage");
          }}
        >
          マイページへ
        </Button>
        <Button
          type="button"
          color="red"
          variant="filled"
          size="lg"
          style={{
            fontWeight: 700,
            fontSize: "1.1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
            borderRadius: 8,
            minWidth: 140,
          }}
          onClick={() => {
            // 清除本地存储的登录信息（如有）
            logout();
            // 跳转到登录页
            router.push("/");
          }}
        >
          ログアウト
        </Button>
      </div>
    </>
  );
};

export default BookingListPage;
