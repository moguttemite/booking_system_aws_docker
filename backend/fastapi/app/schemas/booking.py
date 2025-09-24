"""
講座予約関連の Pydantic モデル
"""
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime, date, time


# ==================== 講座スケジュール関連スキーマ ====================

class ScheduleCreate(BaseModel):
    """講座スケジュール作成モデル（予約可能時間登録）"""
    lecture_id: int
    teacher_id: int
    date: str  # 格式: "YYYY-MM-DD"
    start: str  # 格式: "HH:MM"
    end: str    # 格式: "HH:MM"
    
    @field_validator('lecture_id', 'teacher_id')
    @classmethod
    def validate_ids(cls, v):
        if v <= 0:
            raise ValueError('IDは正の整数である必要があります')
        return v
    
    @field_validator('date')
    @classmethod
    def validate_date(cls, v):
        try:
            datetime.strptime(v, "%Y-%m-%d")
            return v
        except ValueError:
            raise ValueError('日付は YYYY-MM-DD 形式である必要があります')
    
    @field_validator('start', 'end')
    @classmethod
    def validate_time(cls, v):
        try:
            datetime.strptime(v, "%H:%M")
            return v
        except ValueError:
            raise ValueError('時間は HH:MM 形式である必要があります')


class ScheduleBatchCreate(BaseModel):
    """講座スケジュール一括作成モデル（予約可能時間一括登録）"""
    lecture_id: int
    teacher_id: int
    dates: List[str]  # 日期列表，格式: ["YYYY-MM-DD", "YYYY-MM-DD", ...]
    start: str  # 格式: "HH:MM"
    end: str    # 格式: "HH:MM"
    
    @field_validator('lecture_id', 'teacher_id')
    @classmethod
    def validate_ids(cls, v):
        if v <= 0:
            raise ValueError('IDは正の整数である必要があります')
        return v
    
    @field_validator('dates')
    @classmethod
    def validate_dates(cls, v):
        if not v or len(v) == 0:
            raise ValueError('日付リストは空にできません')
        if len(v) > 100:  # 限制一次最多创建100个日期
            raise ValueError('一度に登録できる日付は100件までです')
        
        # 验证每个日期的格式
        for date_str in v:
            try:
                datetime.strptime(date_str, "%Y-%m-%d")
            except ValueError:
                raise ValueError(f'日付の形式が正しくありません: {date_str}')
        
        return v
    
    @field_validator('start', 'end')
    @classmethod
    def validate_time(cls, v):
        try:
            datetime.strptime(v, "%H:%M")
            return v
        except ValueError:
            raise ValueError('時間は HH:MM 形式である必要があります')


class ScheduleCreateResponse(BaseModel):
    """講座スケジュール作成レスポンス"""
    message: str = "予約可能時間の登録が完了しました"
    schedule_id: int


class ScheduleOut(BaseModel):
    """講座スケジュール出力モデル"""
    id: int
    lecture_id: int
    teacher_id: int  # 新增：讲师ID
    booking_date: date
    start_time: time
    end_time: time
    created_at: datetime
    is_expired: bool

    class Config:
        from_attributes = True


class ScheduleListOut(BaseModel):
    """講座スケジュール一覧出力モデル"""
    id: int
    lecture_id: int
    teacher_id: int  # 新增：讲师ID
    lecture_title: str
    teacher_name: str
    booking_date: date
    start_time: time
    end_time: time
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== 講座予約関連スキーマ ====================

class BookingCreate(BaseModel):
    """講座予約作成モデル"""
    lecture_id: int
    booking_date: str  # 格式: "YYYY-MM-DD"
    start_time: str    # 格式: "HH:MM"
    end_time: str      # 格式: "HH:MM"
    
    @field_validator('lecture_id')
    @classmethod
    def validate_lecture_id(cls, v):
        if v <= 0:
            raise ValueError('講座IDは正の整数である必要があります')
        return v
    
    @field_validator('booking_date')
    @classmethod
    def validate_booking_date(cls, v):
        try:
            datetime.strptime(v, "%Y-%m-%d")
            return v
        except ValueError:
            raise ValueError('予約日付は YYYY-MM-DD 形式である必要があります')
    
    @field_validator('start_time', 'end_time')
    @classmethod
    def validate_time(cls, v):
        try:
            datetime.strptime(v, "%H:%M")
            return v
        except ValueError:
            raise ValueError('時間は HH:MM 形式である必要があります')


class BookingItemCreate(BaseModel):
    """講座予約項目作成モデル（内部使用）"""
    user_id: int
    lecture_id: int
    teacher_id: int
    reserved_date: str  # 格式: "YYYY-MM-DD"
    start_time: str     # 格式: "HH:MM"
    end_time: str       # 格式: "HH:MM"
    
    @field_validator('user_id', 'lecture_id', 'teacher_id')
    @classmethod
    def validate_ids(cls, v):
        if v <= 0:
            raise ValueError('IDは正の整数である必要があります')
        return v
    
    @field_validator('reserved_date')
    @classmethod
    def validate_reserved_date(cls, v):
        try:
            datetime.strptime(v, "%Y-%m-%d")
            return v
        except ValueError:
            raise ValueError('予約日付は YYYY-MM-DD 形式である必要があります')
    
    @field_validator('start_time', 'end_time')
    @classmethod
    def validate_time(cls, v):
        try:
            datetime.strptime(v, "%H:%M")
            return v
        except ValueError:
            raise ValueError('時間は HH:MM 形式である必要があります')


class BookingOut(BaseModel):
    """講座予約出力モデル"""
    id: int
    user_id: int
    lecture_id: int
    teacher_id: int  # 新增：讲师ID
    status: str
    booking_date: date
    start_time: time
    end_time: time
    created_at: datetime
    is_expired: bool

    class Config:
        from_attributes = True


class BookingListOut(BaseModel):
    """講座予約一覧出力モデル"""
    id: int
    user_id: int
    user_name: str
    lecture_id: int
    lecture_title: str
    teacher_name: str
    status: str
    booking_date: date
    start_time: time
    end_time: time
    created_at: datetime

    class Config:
        from_attributes = True


class BookingCreateResponse(BaseModel):
    """講座予約作成レスポンス"""
    message: str = "講座予約が完了しました"
    booking_id: int


class BookingCancelResponse(BaseModel):
    """講座予約キャンセルレスポンス"""
    message: str = "講座予約のキャンセルが完了しました"
    booking_id: int




class WaitlistCreate(BaseModel):
    """待機リスト登録モデル"""
    lecture_id: int
    priority: int = 1

    @field_validator('lecture_id')
    @classmethod
    def validate_lecture_id(cls, v):
        if v <= 0:
            raise ValueError('講座IDは正の整数である必要があります')
        return v

    @field_validator('priority')
    @classmethod
    def validate_priority(cls, v):
        if v < 1 or v > 100:
            raise ValueError('優先度は1以上100以下である必要があります')
        return v


class WaitlistOut(BaseModel):
    """待機リスト出力モデル"""
    id: int
    user_id: int
    lecture_id: int
    priority: int
    status: str
    waitlist_date: datetime
    offer_expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WaitlistCreateResponse(BaseModel):
    """待機リスト登録レスポンス"""
    message: str = "待機リストへの登録が完了しました"
    waitlist_id: int


class ScheduleBatchCreateResponse(BaseModel):
    """講座スケジュール一括作成レスポンス"""
    message: str
    created_count: int


class UserBookingRecord(BaseModel):
    """用户预约记录输出模型"""
    id: int
    lecture_id: int
    lecture_title: str
    teacher_name: str
    status: str
    booking_date: date
    start_time: time
    end_time: time
    created_at: datetime

    class Config:
        from_attributes = True


class UserBookingsResponse(BaseModel):
    """用户预约记录列表响应"""
    message: str = "予約記録の取得が完了しました"
    total_count: int
    bookings: List[UserBookingRecord]
