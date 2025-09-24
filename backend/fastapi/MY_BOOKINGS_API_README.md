# 获取用户预约记录API

## 功能说明

`GET /api/v1/bookings/my-bookings` - 获取当前登录用户的所有预约记录

## API信息

- **路径**: `/api/v1/bookings/my-bookings`
- **方法**: GET
- **认证**: 需要JWT Bearer Token
- **响应**: 包含用户预约记录的JSON数据

## 响应字段

- `id` - 预约记录ID
- `lecture_id` - 讲座ID
- `lecture_title` - 讲座标题
- `teacher_name` - 讲师姓名
- `status` - 预约状态
- `booking_date` - 预约日期
- `start_time` - 开始时间
- `end_time` - 结束时间
- `created_at` - 创建时间

## 使用示例

```javascript
const response = await fetch('/api/v1/bookings/my-bookings', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});
const data = await response.json();
```
