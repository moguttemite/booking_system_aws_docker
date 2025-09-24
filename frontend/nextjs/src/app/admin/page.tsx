"use client";
import { Stack } from "@mantine/core";

import CarouselManagement from "@/components/admin/CarouselManagement";

export default function AdminHomePage() {
  return (
    <div className="max-w-7xl mx-auto">
      <Stack gap="xl">
        {/* 轮播图管理区域 */}
        <CarouselManagement />
      </Stack>
    </div>
  );
}
