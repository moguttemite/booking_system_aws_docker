# 使用官方Node.js镜像作为基础镜像
FROM node:18-alpine AS base

# 安装pnpm
RUN npm install -g pnpm

# 安装依赖阶段
FROM base AS deps
# 检查https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制包管理文件
COPY nextjs/package.json nextjs/pnpm-lock.yaml* nextjs/pnpm-workspace.yaml* ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY nextjs/package.json nextjs/pnpm-lock.yaml* nextjs/pnpm-workspace.yaml* ./
COPY nextjs/app ./app
COPY nextjs/components ./components
COPY nextjs/lib ./lib
COPY nextjs/public ./public
COPY nextjs/next.config.ts ./
COPY nextjs/tsconfig.json ./
COPY nextjs/eslint.config.mjs ./
COPY nextjs/next-env.d.ts ./

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# 构建应用
RUN pnpm run build

# 生产阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public

# 设置正确的权限
RUN mkdir .next
RUN chown nextjs:nodejs .next

# 复制构建的Next.js应用
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# 暴露端口
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 健康检查 - 使用原生Node.js而不是curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', r => process.exit(r.statusCode===200?0:1)).on('error', ()=>process.exit(1))"

# 启动应用
CMD ["node", "server.js"]