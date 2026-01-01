from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from . import crud, schemas
from .ai_service import ai_service
from .database import get_db, engine, Base
from .models import ChatSession

# Tạo tables
Base.metadata.create_all(bind=engine)

# Tạo router với prefix
router = APIRouter(prefix="/api/chat")

@router.get("/")
async def root():
    return {
        "service": "Chatbot Message Service",
        "description": "API để lưu và lấy chat messages",
        "endpoints": {
            "send_message": "POST /api/chat/send",
            "get_messages": "POST /api/chat/messages",
            "get_sessions": "POST /api/chat/sessions",
            "get_history": "POST /api/chat/history",
            "delete_session": "DELETE /api/chat/session/{session_id}",
            "health": "GET /api/chat/health"
        },
        "note": "User management được xử lý bởi external service"
    }

@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        # Kiểm tra database connection
        db.execute("SELECT 1")
        return {
            "status": "healthy",
            "database": "connected",
            "service": "running"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {str(e)}"
        )

@router.post("/send", response_model=schemas.ChatResponse)
async def send_message(
    request: schemas.ChatMessageCreate,
    db: Session = Depends(get_db)
):
    """
    Gửi tin nhắn từ user và nhận response từ AI
    - Lưu cả user message và AI response
    - Tự động tạo session nếu chưa có
    """
    try:
        # 1. Lấy hoặc tạo session
        session = crud.chat_crud.get_or_create_session(
            db=db,
            user_id=request.user_id,
            session_id=request.session_id,
            session_data=request.session_data
        )
        
        # 2. Lấy chat history gần đây để context
        recent_messages = crud.chat_crud.get_session_messages(
            db=db,
            session_id=session.id,
            user_id=request.user_id,
            limit=10
        )
        
        # Format history cho AI
        chat_history = []
        for i in range(0, len(recent_messages) - 1, 2):
            if i + 1 < len(recent_messages):
                user_msg = recent_messages[i]
                ai_msg = recent_messages[i + 1]
                if user_msg.message_type == "user" and ai_msg.message_type == "assistant":
                    chat_history.append((user_msg.content, ai_msg.content))
        
        # 3. Lưu user message
        user_message = crud.chat_crud.create_message(
            db=db,
            session_id=session.id,
            message_type="user",
            content=request.message,
            message_data={"intent": "user_message"}
        )
        
        # 4. Generate AI response
        ai_response = ai_service.generate_response(
            user_message=request.message,
            chat_history=chat_history
        )
        
        # 5. Lưu AI response
        ai_message = crud.chat_crud.create_message(
            db=db,
            session_id=session.id,
            message_type="assistant",
            content=ai_response,
            message_data={"model": "phi-2", "tokens": len(ai_response)}
        )
        
        # 6. Cập nhật session updated_at
        from sqlalchemy import update, func
        db.execute(
            update(ChatSession)
            .where(ChatSession.id == session.id)
            .values(updated_at=func.now())
        )
        db.commit()
        
        return schemas.ChatResponse(
            message_id=ai_message.id,
            session_id=session.id,
            response=ai_response,
            user_message_id=user_message.id
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process message: {str(e)}"
        )

@router.post("/messages", response_model=List[schemas.MessageResponse])
async def get_messages(
    request: schemas.GetMessagesRequest,
    db: Session = Depends(get_db)
):
    """
    Lấy tin nhắn của user
    - Nếu có session_id: lấy tin nhắn trong session đó
    - Nếu không có session_id: lấy tất cả tin nhắn của user
    """
    try:
        if request.session_id:
            # Lấy tin nhắn trong specific session
            messages = crud.chat_crud.get_session_messages(
                db=db,
                session_id=request.session_id,
                user_id=request.user_id,
                limit=request.limit,
                offset=request.offset
            )
        else:
            # Lấy tất cả tin nhắn của user
            messages = crud.chat_crud.get_all_user_messages(
                db=db,
                user_id=request.user_id,
                limit=request.limit,
                offset=request.offset
            )
        
        return messages
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get messages: {str(e)}"
        )

@router.post("/sessions", response_model=List[schemas.SessionResponse])
async def get_sessions(
    request: schemas.GetSessionsRequest,
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách sessions của user
    """
    try:
        sessions = crud.chat_crud.get_user_sessions(
            db=db,
            user_id=request.user_id,
            limit=request.limit,
            offset=request.offset
        )
        
        # Format response với message count
        response_sessions = []
        for session in sessions:
            message_count = crud.chat_crud.get_message_count(db, session.id)
            response_sessions.append(
                schemas.SessionResponse(
                    id=session.id,
                    user_id=session.user_id,
                    session_name=session.session_name,
                    message_count=message_count,
                    created_at=session.created_at,
                    updated_at=session.updated_at,
                    session_data=session.session_data
                )
            )
        
        return response_sessions
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get sessions: {str(e)}"
        )

@router.post("/history", response_model=List[schemas.ChatHistoryResponse])
async def get_chat_history(
    request: schemas.GetSessionsRequest,
    db: Session = Depends(get_db)
):
    """
    Lấy toàn bộ history (sessions + messages) của user
    """
    try:
        sessions = crud.chat_crud.get_user_sessions(
            db=db,
            user_id=request.user_id,
            limit=request.limit,
            offset=request.offset
        )
        
        history = []
        for session in sessions:
            messages = crud.chat_crud.get_session_messages(
                db=db,
                session_id=session.id,
                user_id=request.user_id,
                limit=100  # Lấy tối đa 100 tin nhắn mỗi session
            )
            
            history.append(
                schemas.ChatHistoryResponse(
                    session_id=session.id,
                    session_name=session.session_name,
                    messages=messages,
                    created_at=session.created_at
                )
            )
        
        return history
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chat history: {str(e)}"
        )

@router.delete("/session/{session_id}")
async def delete_session(
    session_id: int,
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Xóa session và tất cả tin nhắn trong đó
    """
    success = crud.chat_crud.delete_session(db, session_id, user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not authorized"
        )
    
    return {"message": "Session deleted successfully"}

# Tạo app và include router
app = FastAPI(
    title="Chatbot Message Service API",
    description="API để lưu và lấy chat messages - User management từ external service",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(router)