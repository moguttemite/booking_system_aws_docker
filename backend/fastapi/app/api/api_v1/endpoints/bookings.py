"""
講座予約関連 API エンドポイント
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, case, cast, String
from typing import List, Optional
import logging
import traceback
from datetime import datetime, date

from app.models.user import User
from app.models.lecture import Lecture
from app.models.booking import LectureBooking
from app.schemas.booking import BookingListOut, BookingItemCreate, BookingCreateResponse, BookingCancelResponse
from app.utils.jwt import get_current_user, get_current_admin
from app.db.database import get_db
from app.schemas.booking import UserBookingsResponse, UserBookingRecord

# ログ設定
logger = logging.getLogger(__name__)

router = APIRouter()


def _build_booking_query(db: Session, lecture_id: Optional[int] = None):
    """
    构建预约查询的基础查询对象
    
    Args:
        db: 数据库会话
        lecture_id: 可选的讲座ID，如果提供则只查询特定讲座
    
    Returns:
        查询对象
    """
    # 基础查询：使用JOIN优化，避免N+1查询问题
    query = db.query(
        LectureBooking.id.label('id'),
        LectureBooking.user_id.label('user_id'),
        User.name.label('user_name'),
        LectureBooking.lecture_id.label('lecture_id'),
        Lecture.lecture_title.label('lecture_title'),
        func.coalesce(
            db.query(User.name)
            .filter(User.id == Lecture.teacher_id)
            .limit(1)
            .scalar(),
            'Unknown'
        ).label('teacher_name'),
        case(
            (LectureBooking.status == 'confirmed', 'reserved'),
            (LectureBooking.status == 'cancelled', 'cancelled'),
            else_='pending'
        ).label('status'),
        LectureBooking.booking_date.label('booking_date'),
        LectureBooking.start_time.label('start_time'),
        LectureBooking.end_time.label('end_time'),
        LectureBooking.created_at.label('created_at')
    ).join(
        LectureBooking, LectureBooking.lecture_id == Lecture.id
    ).join(
        User, LectureBooking.user_id == User.id
    ).filter(
        and_(
            Lecture.is_deleted == False,
            User.is_deleted == False,
            LectureBooking.status != 'cancelled'  # 排除已取消的预约
        )
    )
    
    # 如果指定了讲座ID，添加过滤条件
    if lecture_id is not None:
        query = query.filter(LectureBooking.lecture_id == lecture_id)
    
    # 排序
    query = query.order_by(
        LectureBooking.booking_date.desc(),
        LectureBooking.start_time.asc()
    )
    
    return query


def _convert_to_response_model(bookings: List) -> List[BookingListOut]:
    """
    将查询结果转换为响应模型
    
    Args:
        bookings: 查询结果列表
    
    Returns:
        响应模型列表
    """
    booking_list = []
    for booking in bookings:
        booking_data = {
            "id": booking.id,
            "user_id": booking.user_id,
            "user_name": booking.user_name,
            "lecture_id": booking.lecture_id,
            "lecture_title": booking.lecture_title,
            "teacher_name": booking.teacher_name,
            "status": booking.status,
            "booking_date": booking.booking_date,
            "start_time": booking.start_time,
            "end_time": booking.end_time,
            "created_at": booking.created_at
        }
        booking_list.append(BookingListOut(**booking_data))
    
    return booking_list


def _check_teacher_permission(db: Session, current_user: User, lecture_id: int) -> bool:
    """
    检查讲师是否有权限访问指定讲座的预约信息
    
    Args:
        db: 数据库会话
        current_user: 当前用户
        lecture_id: 讲座ID
    
    Returns:
        是否有权限
    
    Raises:
        HTTPException: 权限不足时抛出异常
    """
    # 检查讲座是否存在
    lecture = db.query(Lecture).filter(
        Lecture.id == lecture_id,
        Lecture.is_deleted == False
    ).first()
    
    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定された講座が見つかりません"
        )
    
    # 检查是否为讲座的主讲讲师
    if lecture.teacher_id == current_user.id:
        return True
    
    # 检查是否为多讲师讲座的追加讲师
    from app.models.lecture import LectureTeacher
    is_additional_teacher = db.query(LectureTeacher).filter(
        LectureTeacher.lecture_id == lecture_id,
        LectureTeacher.teacher_id == current_user.id
    ).first()
    
    if not is_additional_teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="この講座の予約情報を閲覧する権限がありません"
        )
    
    return True


def _validate_booking_data(db: Session, booking_item: BookingItemCreate, current_user: User) -> List[str]:
    """
    验证预约数据的有效性
    
    Args:
        db: 数据库会话
        booking_item: 预约项目
        current_user: 当前用户
    
    Returns:
        错误信息列表
    """
    errors = []
    
    # 1. 检查用户权限：只能预约自己的信息
    if booking_item.user_id != current_user.id:
        errors.append(f"ユーザーID {booking_item.user_id} は自分のIDと一致する必要があります")
    
    # 2. 检查讲座是否存在
    lecture = db.query(Lecture).filter(
        Lecture.id == booking_item.lecture_id,
        Lecture.is_deleted == False
    ).first()
    
    if not lecture:
        errors.append(f"講座ID {booking_item.lecture_id} が見つかりません")
    else:
        # 3. 检查讲师ID是否与讲座匹配（考虑多讲师讲座）
        is_valid_teacher = False
        
        # 检查是否为主讲讲师
        if lecture.teacher_id == booking_item.teacher_id:
            is_valid_teacher = True
        
        # 如果不是主讲讲师，检查是否为多讲师讲座的追加讲师
        if not is_valid_teacher:
            from app.models.lecture import LectureTeacher
            additional_teacher = db.query(LectureTeacher).filter(
                and_(
                    LectureTeacher.lecture_id == booking_item.lecture_id,
                    LectureTeacher.teacher_id == booking_item.teacher_id
                )
            ).first()
            
            if additional_teacher:
                is_valid_teacher = True
        
        if not is_valid_teacher:
            errors.append(f"講師ID {booking_item.teacher_id} は講座ID {booking_item.lecture_id} の講師と一致しません")
    
    # 4. 检查时间格式和逻辑
    try:
        reserved_date = datetime.strptime(booking_item.reserved_date, "%Y-%m-%d").date()
        start_time = datetime.strptime(booking_item.start_time, "%H:%M").time()
        end_time = datetime.strptime(booking_item.end_time, "%H:%M").time()
        
        # 检查开始时间是否早于结束时间
        if start_time >= end_time:
            errors.append("開始時間は終了時間より早い必要があります")
        
        # 检查预约日期是否为过去
        if reserved_date < date.today():
            errors.append("過去の日付に予約することはできません")
            
    except ValueError as e:
        errors.append(f"時間形式エラー: {str(e)}")
    
    # 5. 检查预约时间是否在可预约时间表中存在
    try:
        reserved_date = datetime.strptime(booking_item.reserved_date, "%Y-%m-%d").date()
        start_time = datetime.strptime(booking_item.start_time, "%H:%M").time()
        end_time = datetime.strptime(booking_item.end_time, "%H:%M").time()
        
        # 检查预约的时间段是否在可预约时间表中存在
        from app.models.booking import LectureSchedule
        available_schedule = db.query(LectureSchedule).filter(
            and_(
                LectureSchedule.lecture_id == booking_item.lecture_id,
                LectureSchedule.teacher_id == booking_item.teacher_id,  # 新增：检查讲师ID
                LectureSchedule.booking_date == reserved_date,
                LectureSchedule.start_time <= start_time,
                LectureSchedule.end_time >= end_time,
                LectureSchedule.is_expired == False
            )
        ).first()
        
        if not available_schedule:
            errors.append(f"日付 {booking_item.reserved_date} の時間帯 {booking_item.start_time}-{booking_item.end_time} は予約可能な時間ではありません")
            
    except Exception as e:
        errors.append(f"可予約時間チェックエラー: {str(e)}")
    
    # 6. 检查时间冲突（同一用户在同一讲座的同一时间段）
    try:
        reserved_date = datetime.strptime(booking_item.reserved_date, "%Y-%m-%d").date()
        start_time = datetime.strptime(booking_item.start_time, "%H:%M").time()
        end_time = datetime.strptime(booking_item.end_time, "%H:%M").time()
        
        # 检查是否存在时间冲突的预约
        conflicting_booking = db.query(LectureBooking).filter(
            and_(
                LectureBooking.user_id == booking_item.user_id,
                LectureBooking.lecture_id == booking_item.lecture_id,
                LectureBooking.booking_date == reserved_date,
                LectureBooking.status.in_(['pending', 'confirmed']),
                or_(
                    and_(
                        LectureBooking.start_time <= start_time,
                        LectureBooking.end_time > start_time
                    ),
                    and_(
                        LectureBooking.start_time < end_time,
                        LectureBooking.end_time >= end_time
                    ),
                    and_(
                        LectureBooking.start_time >= start_time,
                        LectureBooking.end_time <= end_time
                    )
                )
            )
        ).first()
        
        if conflicting_booking:
            errors.append(f"時間帯 {booking_item.start_time}-{booking_item.end_time} に既に予約が存在します")
            
    except Exception as e:
        errors.append(f"時間衝突チェックエラー: {str(e)}")
    
    return errors


@router.post("/register", response_model=BookingCreateResponse)
async def create_booking(
    booking_data: BookingItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    予約情報登録API（本人）
    
    Args:
        booking_data: 预约数据
        current_user: 当前用户
        db: 数据库会话
    
    Returns:
        BookingCreateResponse: 预约创建结果
    
    Raises:
        HTTPException: 数据验证失败、权限不足、服务器错误时
    """
    logger.info(f"予約登録リクエスト by {current_user.email}")
    
    try:
        # 验证数据
        errors = _validate_booking_data(db, booking_data, current_user)
        
        if errors:
            # 验证失败，返回第一个错误
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=errors[0]  # 返回第一个错误信息
            )
        
        # 创建预约记录
        new_booking = LectureBooking(
            user_id=booking_data.user_id,
            lecture_id=booking_data.lecture_id,
            teacher_id=booking_data.teacher_id,  # 新增：讲师ID
            status="pending",  # 默认状态为pending
            booking_date=datetime.strptime(booking_data.reserved_date, "%Y-%m-%d").date(),
            start_time=datetime.strptime(booking_data.start_time, "%H:%M").time(),
            end_time=datetime.strptime(booking_data.end_time, "%H:%M").time(),
            is_expired=False
        )
        
        db.add(new_booking)
        db.commit()
        
        logger.info(f"予約登録完了: 预约ID {new_booking.id}")
        
        return BookingCreateResponse(booking_id=new_booking.id)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"予約登録エラー: {str(e)}")
        logger.error(f"エラーの詳細: {type(e).__name__}")
        logger.error(f"スタックトレース: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="サーバーエラーが発生しました"
        )


@router.put("/cancel/{booking_id}", response_model=BookingCancelResponse)
async def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    予約取消API（本人）
    
    Args:
        booking_id: 预约ID
        current_user: 当前用户
        db: 数据库会话
    
    Returns:
        BookingCancelResponse: 预约取消结果
    
    Raises:
        HTTPException: 预约不存在、权限不足、状态不允许取消、服务器错误时
    """
    logger.info(f"予約取消リクエスト: 预约ID {booking_id} by {current_user.email}")
    
    try:
        # 查找预约记录
        booking = db.query(LectureBooking).filter(
            LectureBooking.id == booking_id
        ).first()
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定された予約が見つかりません"
            )
        
        # 检查权限：只能取消自己的预约
        if booking.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="自分の予約のみキャンセルできます"
            )
        
        # 检查预约状态：只有pending状态的预约可以取消，confirmed状态的预约不能取消
        if booking.status != 'pending':
            if booking.status == 'confirmed':
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="確認済みの予約はキャンセルできません"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"現在の予約状態 '{booking.status}' ではキャンセルできません"
                )
        
        # 更新预约状态为cancelled
        booking.status = 'cancelled'
        db.commit()
        
        logger.info(f"予約取消完了: 预约ID {booking_id}")
        
        return BookingCancelResponse(booking_id=booking_id)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"予約取消エラー: {str(e)}")
        logger.error(f"エラーの詳細: {type(e).__name__}")
        logger.error(f"スタックトレース: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="サーバーエラーが発生しました"
        )


@router.get("/lecture/{lecture_id}", response_model=List[BookingListOut])
async def get_lecture_bookings(
    lecture_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    予約一覧取得API（講師・管理者）
    
    Args:
        lecture_id: 講座ID
        current_user: 現在のユーザー（講師または管理者）
        db: データベースセッション
    
    Returns:
        List[BookingListOut]: 予約一覧
    
    Raises:
        HTTPException: 権限不足、講座不存在、サーバーエラー時
    """
    logger.info(f"予約一覧取得リクエスト: 講座ID {lecture_id} by {current_user.email}")
    
    try:
        # 检查讲座是否存在
        lecture = db.query(Lecture).filter(
            Lecture.id == lecture_id,
            Lecture.is_deleted == False
        ).first()
        
        if not lecture:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定された講座が見つかりません"
            )
        
        # 构建查询
        query = _build_booking_query(db, lecture_id)
        
        # 执行查询
        bookings = query.all()
        
        logger.info(f"予約一覧取得成功: 講座ID {lecture_id}, {len(bookings)}件")
        
        # 转换为响应模型
        return _convert_to_response_model(bookings)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"予約一覧取得エラー: {str(e)}")
        logger.error(f"エラーの詳細: {type(e).__name__}")
        logger.error(f"スタックトレース: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="サーバーエラーが発生しました"
        )


@router.get("/all", response_model=List[BookingListOut])
async def get_all_bookings(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    全講座予約一覧取得API（管理者のみ）
    
    Args:
        current_user: 現在のユーザー（管理者権限が必要）
        db: データベースセッション
    
    Returns:
        List[BookingListOut]: 全講座予約一覧
    
    Raises:
        HTTPException: 権限不足、サーバーエラー時
    """
    logger.info(f"全講座予約一覧取得リクエスト by {current_user.email}")
    
    try:
        # 构建查询（不指定讲座ID，查询所有）
        query = _build_booking_query(db)
        
        # 执行查询
        bookings = query.all()
        
        logger.info(f"全講座予約一覧取得成功: {len(bookings)}件")
        
        # 转换为响应模型
        return _convert_to_response_model(bookings)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"全講座予約一覧取得エラー: {str(e)}")
        logger.error(f"エラーの詳細: {type(e).__name__}")
        logger.error(f"スタックトレース: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="サーバーエラーが発生しました"
        )


@router.get("/stats", response_model=dict)
async def get_booking_stats(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    予約統計情報取得API（管理者のみ）
    
    Args:
        current_user: 現在のユーザー（管理者権限が必要）
        db: データベースセッション
    
    Returns:
        dict: 予約統計情報
    """
    logger.info(f"予約統計情報取得リクエスト by {current_user.email}")
    
    try:
        # 统计查询
        stats = db.query(
                    func.count(LectureBooking.id).label('total_bookings'),
        func.count(case([(LectureBooking.status == 'confirmed', 1)])).label('confirmed_bookings'),
        func.count(case([(LectureBooking.status == 'cancelled', 1)])).label('cancelled_bookings'),
        func.count(case([(LectureBooking.status == 'pending', 1)])).label('pending_bookings')
    ).join(
        Lecture, LectureBooking.lecture_id == Lecture.id
        ).filter(
            Lecture.is_deleted == False
        ).first()
        
        # 热门讲座统计
        popular_lectures = db.query(
            Lecture.lecture_title,
            func.count(LectureBooking.id).label('booking_count')
        ).join(
            LectureBooking, LectureBooking.lecture_id == Lecture.id
        ).filter(
            Lecture.is_deleted == False
        ).group_by(
            Lecture.id, Lecture.lecture_title
        ).order_by(
            func.count(LectureBooking.id).desc()
        ).limit(5).all()
        
        result = {
            "total_bookings": stats.total_bookings or 0,
            "confirmed_bookings": stats.confirmed_bookings or 0,
            "cancelled_bookings": stats.cancelled_bookings or 0,
            "pending_bookings": stats.pending_bookings or 0,
            "popular_lectures": [
                {
                    "lecture_title": lecture.lecture_title,
                    "booking_count": lecture.booking_count
                }
                for lecture in popular_lectures
            ]
        }
        
        logger.info(f"予約統計情報取得成功")
        return result
        
    except Exception as e:
        logger.error(f"予約統計情報取得エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="サーバーエラーが発生しました"
        )


@router.get("/lecture/{lecture_id}/booked-times", response_model=List[dict])
async def get_lecture_booked_times(
    lecture_id: int,
    db: Session = Depends(get_db)
):
    """
    获取指定课程的已预约时间段API（无需认证）
    
    Args:
        lecture_id: 课程ID
        db: 数据库会话
    
    Returns:
        List[dict]: 已预约时间段列表，包含booking_date、start_time、end_time
    
    Raises:
        HTTPException: 课程不存在、服务器错误时
    """

    
    try:
        # 检查课程是否存在
        lecture = db.query(Lecture).filter(
            Lecture.id == lecture_id,
            Lecture.is_deleted == False
        ).first()
        
        if not lecture:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定された講座が見つかりません"
            )
        
        # 查询该课程的所有已预约记录（排除已取消的）
        booked_times = db.query(
            LectureBooking.booking_date,
            LectureBooking.start_time,
            LectureBooking.end_time
        ).filter(
            and_(
                LectureBooking.lecture_id == lecture_id,
                LectureBooking.status.in_(['pending', 'confirmed']),  # 只包含待确认和已确认的预约
                LectureBooking.is_expired == False
            )
        ).order_by(
            LectureBooking.booking_date.asc(),
            LectureBooking.start_time.asc()
        ).all()
        
        # 转换为前端需要的格式
        result = []
        for booking in booked_times:
            result.append({
                "booking_date": booking.booking_date.strftime("%Y-%m-%d") if booking.booking_date else None,
                "start_time": booking.start_time.strftime("%H:%M") if booking.start_time else None,
                "end_time": booking.end_time.strftime("%H:%M") if booking.end_time else None
            })
        

        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取课程已预约时间段错误: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="サーバーエラーが発生しました"
        )


@router.get("/my-bookings", response_model=UserBookingsResponse)
async def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的所有预约记录"""
    try:
        user_bookings = db.query(
            LectureBooking.id,
            LectureBooking.lecture_id,
            Lecture.lecture_title,
            func.coalesce(
                db.query(User.name)
                .filter(User.id == Lecture.teacher_id)
                .limit(1)
                .scalar(),
                'Unknown'
            ).label('teacher_name'),
            LectureBooking.status,
            LectureBooking.booking_date,
            LectureBooking.start_time,
            LectureBooking.end_time,
            LectureBooking.created_at
        ).join(
            Lecture, LectureBooking.lecture_id == Lecture.id
        ).filter(
            and_(
                LectureBooking.user_id == current_user.id,
                Lecture.is_deleted == False,
                LectureBooking.is_expired == False
            )
        ).order_by(
            LectureBooking.booking_date.desc(),
            LectureBooking.start_time.asc()
        ).all()
        
        booking_records = [
            UserBookingRecord(
                id=booking.id,
                lecture_id=booking.lecture_id,
                lecture_title=booking.lecture_title,
                teacher_name=booking.teacher_name,
                status=booking.status,
                booking_date=booking.booking_date,
                start_time=booking.start_time,
                end_time=booking.end_time,
                created_at=booking.created_at
            )
            for booking in user_bookings
        ]
        
        return UserBookingsResponse(
            total_count=len(booking_records),
            bookings=booking_records
        )
        
    except Exception as e:
        logger.error(f"获取用户预约记录错误: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="サーバーエラーが発生しました"
        )
