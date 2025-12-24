from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional, Dict, Any
from uuid import UUID
from . import models, schemas

class ChatCRUD:
    """Chỉ xử lý CRUD cho chat messages"""
    
    # Session operations
    def get_or_create_session(
        self, 
        db: Session, 
        user_id: str, 
        session_id: Optional[UUID] = None,
        session_data: Optional[Dict[str, Any]] = None  # ĐỔI TÊN
    ) -> models.ChatSession:
        """Lấy session có sẵn hoặc tạo mới"""
        if session_id:
            # Kiểm tra session có tồn tại và thuộc về user này không
            session = db.query(models.ChatSession).filter(
                models.ChatSession.id == session_id,
                models.ChatSession.user_id == user_id
            ).first()
            
            if session:
                return session
        
        # Tạo session mới
        session_name = "Chat"
        if session_data and isinstance(session_data, dict):
            session_name = session_data.get('name', 'Chat')
        
        session = models.ChatSession(
            user_id=user_id,
            session_name=session_name,
            session_data=session_data or {}  # ĐỔI TÊN
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session
    
    def get_user_sessions(
        self, 
        db: Session, 
        user_id: str, 
        limit: int = 20, 
        offset: int = 0
    ) -> List[models.ChatSession]:
        """Lấy danh sách sessions của user"""
        return db.query(models.ChatSession).filter(
            models.ChatSession.user_id == user_id
        ).order_by(desc(models.ChatSession.updated_at)).offset(offset).limit(limit).all()
    
    # Message operations
    def create_message(
        self, 
        db: Session, 
        session_id: UUID, 
        message_type: str, 
        content: str,
        message_data: Optional[Dict[str, Any]] = None  # ĐỔI TÊN
    ) -> models.ChatMessage:
        """Tạo tin nhắn mới"""
        message = models.ChatMessage(
            session_id=session_id,
            message_type=message_type,
            content=content,
            message_data=message_data or {}  # ĐỔI TÊN
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        return message
    
    def get_session_messages(
        self, 
        db: Session, 
        session_id: UUID, 
        user_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[models.ChatMessage]:
        """Lấy tin nhắn trong session (có kiểm tra user ownership)"""
        # Kiểm tra session thuộc về user
        session = db.query(models.ChatSession).filter(
            models.ChatSession.id == session_id,
            models.ChatSession.user_id == user_id
        ).first()
        
        if not session:
            return []
        
        return db.query(models.ChatMessage).filter(
            models.ChatMessage.session_id == session_id
        ).order_by(models.ChatMessage.created_at).offset(offset).limit(limit).all()
    
    def get_all_user_messages(
        self,
        db: Session,
        user_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[models.ChatMessage]:
        """Lấy tất cả tin nhắn của user (tất cả sessions)"""
        # Lấy tất cả session IDs của user
        session_ids = db.query(models.ChatSession.id).filter(
            models.ChatSession.user_id == user_id
        ).all()
        
        session_ids = [sid[0] for sid in session_ids]
        
        if not session_ids:
            return []
        
        return db.query(models.ChatMessage).filter(
            models.ChatMessage.session_id.in_(session_ids)
        ).order_by(desc(models.ChatMessage.created_at)).offset(offset).limit(limit).all()
    
    def get_message_count(self, db: Session, session_id: UUID) -> int:
        """Đếm số tin nhắn trong session"""
        return db.query(func.count(models.ChatMessage.id)).filter(
            models.ChatMessage.session_id == session_id
        ).scalar()
    
    def delete_session(self, db: Session, session_id: UUID, user_id: str) -> bool:
        """Xóa session và tất cả tin nhắn trong đó"""
        session = db.query(models.ChatSession).filter(
            models.ChatSession.id == session_id,
            models.ChatSession.user_id == user_id
        ).first()
        
        if not session:
            return False
        
        db.delete(session)
        db.commit()
        return True

# Tạo instance
chat_crud = ChatCRUD()