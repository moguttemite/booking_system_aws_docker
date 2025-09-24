import useSessionExpiredModal from "@/hooks/useSessionExpiredModal";

/**
 * 检查用户登录状态，如果过期则显示弹窗
 * @param token 用户的JWT token
 * @returns Promise<boolean> 如果token有效返回true，否则返回false
 */
export const checkSessionAndShowModal = async (token: string): Promise<boolean> => {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    
    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
    
    const response = await fetch(`${apiBase}/check-auth-status`, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // 如果是401错误，直接显示弹窗
      if (response.status === 401) {
        useSessionExpiredModal.getState().open();
        return false;
      }
      // 其他HTTP错误，不显示弹窗，直接返回false
      return false;
    }

    const data = await response.json();
    
    if (data.is_authenticated === false) {
      // 显示登录过期弹窗
      useSessionExpiredModal.getState().open();
      return false;
    }
    
    return true;
  } catch (error) {
    // 所有网络错误、超时错误都不显示弹窗，直接返回false
    // 这样可以让调用方继续尝试其他操作
    return false;
  }
};

/**
 * 在API请求失败时检查是否是认证问题
 * @param response API响应
 * @param token 用户的JWT token
 * @returns boolean 如果是认证问题返回true
 */
export const handleApiAuthError = (response: Response, token: string): boolean => {
  if (response.status === 401) {
    // 直接显示登录过期弹窗，避免异步调用
    useSessionExpiredModal.getState().open();
    return true;
  }
  return false;
};

/**
 * 定期检查会话状态（可选功能）
 * @param token 用户的JWT token
 * @param intervalMinutes 检查间隔（分钟）
 */
export const startSessionMonitoring = (token: string, intervalMinutes: number = 5) => {
  const intervalMs = intervalMinutes * 60 * 1000;
  
  const checkInterval = setInterval(async () => {
    const isValid = await checkSessionAndShowModal(token);
    if (!isValid) {
      clearInterval(checkInterval);
    }
  }, intervalMs);

  // 返回清理函数
  return () => clearInterval(checkInterval);
};
