"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";

// LoginModal and useLoginModal imports
import useLoginModal from "@/hooks/useLoginModal";
import LoginModal from "@/components/LoginModal";

import useRegisterModal from "@/hooks/useRegisterModal";

import useAuthStore from "@/store/useUserStore";

const Navbar = () => {
  const router = useRouter()

  const [menuOpen, setMenuOpen] = useState(false);
  const { open } = useLoginModal(); // 控制登录浮窗
  const { open: openRegister } = useRegisterModal();
  ;

  // 状态模拟
  const { user, logout } = useAuthStore();
  const isLoggedIn = !!user;

  const navItems = isLoggedIn
    ? [
        { href: "/", label: "ホーム" },
        { href: "/bookings", label: "予約一覧" },
        { href: "/contact", label: "お問い合わせ" },
        { href: "/mypage", label: "マイページ" },
        { href: "/logout", label: "ログアウト" },
      ]
    : [
        { href: "/", label: "ホーム" },
        { href: "/bookings", label: "予約一覧" },
        { href: "/contact", label: "お問い合わせ" },
        { href: "/login", label: "ログイン" },
        { href: "/register", label: "新規登録" },
      ];

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    if (href === "/login") {
      e.preventDefault();
      open(); // 弹出登录浮窗
    }
    else if (href === "/logout") {
      e.preventDefault();
      logout(); // 执行登出逻辑
      router.push("/");
    } 
    else if (href === "/register") {
      e.preventDefault();
      openRegister(); // 弹出注册浮窗
    }
  };
  
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo区块 */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="https://bizplus-inc.co.jp/wp-content/themes/bizplus/images/logod.png"
            alt="講座予約ロゴ"
            width={40}
            height={40}
            className="w-10 h-auto"
          />
          <span className="text-2xl font-bold text-blue-600 tracking-wide">
            講座予約
          </span>
        </Link>

        {/* 桌面导航 */}
        <div className="hidden md:flex gap-x-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(item.href, e)}
              className="text-lg text-gray-700 hover:text-blue-600 hover:underline underline-offset-4 transition-all"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* 手机端菜单按钮 */}
        <div className="md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <CloseOutlined /> : <MenuOutlined />}
          </button>
        </div>
      </div>

      {/* 手机端菜单下拉 */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="md:hidden px-6 pb-4"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    handleNavClick(item.href, e);
                    setMenuOpen(false); // 点了就关闭
                  }}
                  className="text-lg text-gray-700 hover:text-blue-600 hover:underline underline-offset-4 transition-all"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginModal />
      
    </nav>
  );
};

export default Navbar;
