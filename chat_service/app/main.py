from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from sqlalchemy.orm import Session
from typing import List, Optional

from . import crud, schemas
from .ai_service import ai_service
from .database import get_db, engine, Base
from .models import ChatSession

# Tạo tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Chat Service API",
    description="Real-time chat API with AI response integration and message persistence",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Có thể restrict cụ thể frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Chat Service API",
        version="1.0.0",
        description="Chat service with AI responses and message persistence",
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

@app.get("/", tags=["Root"])
async def root():
    """Service information endpoint"""
    return {
        "service": "Chat Service API",
        "description": "API for chat messages with AI response",
        "version": "1.0.0",
        "endpoints": {
            "send_message": "POST /chat/send",
            "get_messages": "GET /chat/messages",
            "get_sessions": "GET /chat/sessions",
            "health": "GET /health",
            "docs": "/api/docs"
        },
        "documentation": "See /api/docs for full API documentation"
    }

@app.get("/health", tags=["Health"])
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint - verifies database connectivity"""
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

@app.post("/chat/send", response_model=schemas.ChatResponse, tags=["Chat"])
async def send_message(
    request: schemas.ChatMessageCreate,
    db: Session = Depends(get_db)
):
    """
    Send a message and receive AI response
    
    - Saves user message and AI response
    - Automatically creates session if not exists
    - Uses message history for context
    
    Args:
        request: Chat message request with user_id and content
        db: Database session
        
    Returns:
        ChatResponse: User message, AI response, and session info
    """
    try:
        # 1. Lấy hoặc tạo session
        session = crud.chat_crud.get_or_create_session(
            db=db,
            user_id=request.user_id,
            session_id=request.session_id,
            session_data=request.session_data  # ĐỔI TÊN
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
            message_data={"intent": "user_message"}  # ĐỔI TÊN
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
            message_data={"model": "phi-2", "tokens": len(ai_response)}  # ĐỔI TÊN
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

@app.post("/chat/messages", response_model=List[schemas.MessageResponse], tags=["Chat"])
async def get_messages(
    request: schemas.GetMessagesRequest,
    db: Session = Depends(get_db)
):
    """
    Get user messages
    
    Retrieve messages from a specific session or all messages for a user
    
    Args:
        request: GetMessagesRequest with user_id and optional session_id
        db: Database session
        
    Returns:
        List[MessageResponse]: List of chat messages with metadata
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

@app.post("/chat/sessions", response_model=List[schemas.SessionResponse], tags=["Chat"])
async def get_sessions(
    request: schemas.GetSessionsRequest,
    db: Session = Depends(get_db)
):
    """
    Get user chat sessions
    
    Retrieve all chat sessions for a user with metadata
    
    Args:
        request: GetSessionsRequest with user_id and pagination params
        db: Database session
        
    Returns:
        List[SessionResponse]: List of chat sessions with message counts
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
                    session_data=session.session_data  # ĐỔI TÊN
                )
            )
        
        return response_sessions
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get sessions: {str(e)}"
        )

@app.post("/chat/history", response_model=List[schemas.ChatHistoryResponse])
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

@app.delete("/chat/session/{session_id}")
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