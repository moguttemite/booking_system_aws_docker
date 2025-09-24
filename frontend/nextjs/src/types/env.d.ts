declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_BASE_URL: string;
    NEXT_PUBLIC_BACKEND_PORT: string;
    NEXT_PUBLIC_FRONTEND_PORT: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}
