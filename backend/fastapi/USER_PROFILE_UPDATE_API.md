# 用户资料更新API

## 功能说明

`PATCH /api/v1/users/profile` - 用户资料更新API，允许用户修改自己的基本信息。

## API信息

- **路径**: `/api/v1/users/profile`
- **方法**: PATCH
- **认证**: 需要JWT Bearer Token
- **权限**: 仅限本人修改自己的资料

## 请求格式

### 请求头
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### 请求体
```json
{
  "name": "新用户名"
}
```

**字段说明：**
- `name` (可选): 用户名，2-50个字符

## 响应格式

### 成功响应 (200 OK)
```json
{
  "message": "ユーザー资料の更新が完了しました",
  "updated_fields": ["name"]
}
```

### 错误响应

#### 400 Bad Request - 数据验证失败
```json
{
  "detail": "名前は2文字以上である必要があります"
}
```

#### 401 Unauthorized - 未认证
```json
{
  "detail": "無効なトークンです"
}
```

#### 500 Internal Server Error - 服务器错误
```json
{
  "detail": "サーバーエラーが発生しました"
}
```

## 使用示例

### JavaScript
```javascript
const response = await fetch('/api/v1/users/profile', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: '新用户名'
  })
});

const data = await response.json();
console.log(data);
```

### cURL
```bash
curl -X PATCH "http://localhost:8000/api/v1/users/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "新用户名"}'
```

## 扩展性

该API设计为可扩展的，后续可以轻松添加更多字段：

- 邮箱修改
- 头像上传
- 个人简介
- 其他用户信息

只需在 `UserUpdate` 模型中添加新字段，并在API端点中添加相应的更新逻辑即可。
