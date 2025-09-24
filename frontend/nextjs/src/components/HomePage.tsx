"use client";
import { useEffect, useState } from "react";
import { Button, Container, Title, Text, Loader } from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import TeacherCard from "./TeacherCard";
import HomePageLoginForm from "./HomePageLoginForm";
import useAuthStore from "@/store/useUserStore";
import { useRouter } from "next/navigation";
import { fetchCarouselDisplayData } from "@/lib/api";

// 类型定义
interface CarouselItem {
  lecture_id: number;
  lecture_title: string;
  lecture_description: string;
  teacher_name: string;
  teacher_image: string | null;
  display_order: number;
}

// 样式常量
const STYLES = {
  logo: {
    position: "fixed" as const,
    top: 24,
    left: 24,
    width: 220,
    height: "auto",
    zIndex: 10,
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    background: "rgba(255,255,255,0.7)",
    padding: 8,
  },
  section: {
    background: "rgba(255,255,255,0.85)",
    borderRadius: 24,
    boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
    padding: "2.5rem 2rem 2rem 2rem",
    marginBottom: 32,
    border: "1px solid #f0f0f0",
  },
  loginSection: {
    background: "rgba(255,255,255,0.85)",
    borderRadius: 24,
    boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
    padding: "2.5rem 2rem 2rem 2rem",
    marginBottom: 48, // 从16增加到48，增加间距
    border: "1px solid #f0f0f0",
    textAlign: "center" as const,
  },

  carousel: {
    slide: {
      display: "flex" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      height: "100%",
      width: "100%",
    },
    control: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      color: 'rgba(0, 0, 0, 0.7)',
    },
    indicator: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 280,
  },
  emptyContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 280,
  },
  slideContainer: {
    width: '100%',
    height: '100%',
  },
};

const HomePage = () => {
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const router = useRouter();

  // 加载轮播图配置
  useEffect(() => {
    const loadCarouselConfig = async () => {
      try {
        const carouselData = await fetchCarouselDisplayData();
        
        // 按display_order排序
        const sortedItems = carouselData.sort((a, b) => a.display_order - b.display_order);
        
        setCarouselItems(sortedItems);
      } catch (error) {
        console.error('輪播図設定読み込みエラー:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCarouselConfig();
  }, []);

  // 渲染轮播图
  const renderCarousel = () => {
    if (loading) {
      return (
        <div style={STYLES.loadingContainer}>
          <Loader size="lg" />
        </div>
      );
    }

    if (carouselItems.length === 0) {
      return (
        <div style={STYLES.emptyContainer}>
          <Text size="lg" c="dimmed">
            輪播図に表示する講座がありません
          </Text>
        </div>
      );
    }

    return (
      <Carousel
        slideSize="100%"
        height={280}
        withControls
        withIndicators
        slideGap="md"
        styles={STYLES.carousel}
      >
        {carouselItems.map((item) => (
          <Carousel.Slide 
            key={`${item.lecture_id}-${item.display_order}`} 
            style={STYLES.carousel.slide}
          >
            <div style={STYLES.slideContainer}>
              <TeacherCard 
                lectureId={item.lecture_id}
                lectureTitle={item.lecture_title}
                lectureDescription={item.lecture_description}
                teacherName={item.teacher_name}
                teacherImage={item.teacher_image}
              />
            </div>
          </Carousel.Slide>
        ))}
      </Carousel>
    );
  };

  // 渲染登录表单
  const renderLoginForm = () => {
    if (user) return null;
    
    return (
      <section style={STYLES.loginSection}>
        <HomePageLoginForm />
      </section>
    );
  };



  return (
    <>
      {/* Logo */}
      <img
        src="/logo.png"
        alt="Logo"
        style={STYLES.logo}
      />
      
      <Container className="pt-8 pb-10" size="lg">
        {/* 轮播图区域 */}
        <section style={STYLES.section}>
          {renderCarousel()}
        </section>
        
        {/* 登录表单区域 */}
        {renderLoginForm()}
      </Container>
    </>
  );
};

export default HomePage;
