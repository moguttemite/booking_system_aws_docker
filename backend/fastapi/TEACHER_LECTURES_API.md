# 讲师获取自己讲座列表API

## 功能说明

`GET /api/v1/lectures/my-lectures` - 讲师获取自己的全部讲座列表API，无需参数，仅限讲师身份调用。

## API信息

- **路径**: `/api/v1/lectures/my-lectures`
- **方法**: GET
- **认证**: 需要JWT Bearer Token
- **权限**: 仅限讲师身份（teacher role）

## 请求格式

### 请求头
```
Authorization: Bearer <jwt_token>
```

### 请求参数
无需参数

## 响应格式

### 成功响应 (200 OK)
```json
{
  "message": "講師の講座一覧を取得しました",
  "total_count": 5,
  "lectures": [
    {
      "id": 1,
      "lecture_title": "Python入門講座",
      "lecture_description": "Pythonの基礎から応用まで学べる講座です",
      "approval_status": "approved",
      "teacher_name": "田中太郎",
      "teacher_id": 10,
      "is_multi_teacher": false,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-20T15:30:00Z"
    },
    {
      "id": 2,
      "lecture_title": "AI基礎講座",
      "lecture_description": "人工知能の基礎知識を学ぶ講座",
      "approval_status": "pending",
      "teacher_name": "田中太郎",
      "teacher_id": 10,
      "is_multi_teacher": false,
      "created_at": "2024-01-18T09:00:00Z",
      "updated_at": "2024-01-18T09:00:00Z"
    }
  ]
}
```

### 错误响应

#### 401 Unauthorized - 未认证或非讲师身份
```json
{
  "detail": "teacher権限が必要です"
}
```

#### 500 Internal Server Error - 服务器错误
```json
{
  "detail": "サーバーエラーが発生しました"
}
```

## 响应字段说明

### 主要字段
- `message`: 响应消息
- `total_count`: 讲座总数
- `lectures`: 讲座列表

### 讲座字段
- `id`: 讲座ID
- `lecture_title`: 讲座标题
- `lecture_description`: 讲座描述
- `approval_status`: 审批状态（pending/approved/rejected）
- `teacher_name`: 讲师姓名
- `teacher_id`: 讲师ID
- `is_multi_teacher`: 是否为多讲师讲座
- `created_at`: 创建时间
- `updated_at`: 更新时间

## 使用示例

### JavaScript
```javascript
const response = await fetch('/api/v1/lectures/my-lectures', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});

const data = await response.json();
console.log(`讲师共有 ${data.total_count} 个讲座`);
data.lectures.forEach(lecture => {
  console.log(`- ${lecture.lecture_title} (${lecture.approval_status})`);
});
```

### cURL
```bash
curl -X GET "http://localhost:8000/api/v1/lectures/my-lectures" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 特性说明

1. **权限控制**: 只有讲师身份的用户才能调用此API
2. **完整数据**: 返回讲师创建的所有讲座，包括已删除的讲座
3. **排序**: 按创建时间倒序排列（最新的在前）
4. **详细信息**: 包含讲座的完整信息，便于讲师管理

## 注意事项

- 此API返回讲师创建的所有讲座，包括状态为"已删除"的讲座
- 讲师只能看到自己创建的讲座，无法查看其他讲师的讲座
- 需要有效的JWT Token且用户角色必须为"teacher"
- **重要**: 此路由必须定义在 `/{lecture_id}` 路由之前，以避免路由冲突
