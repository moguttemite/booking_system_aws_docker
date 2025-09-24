"""
ユーザー SQLAlchemy ORM モデル
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class User(Base):
    """ユーザーモデル"""
    __tablename__ = "user_infos"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="student")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # リレーションシップ
    teacher_profile = relationship("TeacherProfile", back_populates="user", uselist=False)
    bookings = relationship("LectureBooking", back_populates="user", cascade="all, delete-orphan")
    waitlist_entries = relationship("BookingWaitlist", back_populates="user", cascade="all, delete-orphan")
