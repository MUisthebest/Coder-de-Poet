from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

# Request schemas
class ChatMessageCreate(BaseModel):
    """Schema để tạo tin nhắn mới"""
    message: str = Field(..., min_length=1, max_length=5000)
    user_id: str = Field(..., description="User ID từ external service")
    session_id: Optional[UUID] = None  # Nếu không có, tạo session mới
    session_data: Optional[Dict[str, Any]] = None  # ĐỔI TÊN

class GetMessagesRequest(BaseModel):
    """Schema để lấy tin nhắn"""
    user_id: str
    session_id: Optional[UUID] = None  # Nếu None, lấy tất cả sessions
    limit: Optional[int] = 50
    offset: Optional[int] = 0

class GetSessionsRequest(BaseModel):
    """Schema để lấy danh sách sessions"""
    user_id: str
    limit: Optional[int] = 20
    offset: Optional[int] = 0

# Response schemas
class MessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    message_type: str
    content: str
    created_at: datetime
    message_data: Optional[Dict[str, Any]] = None  # ĐỔI TÊN
    
    class Config:
        from_attributes = True

class SessionResponse(BaseModel):
    id: UUID
    user_id: str
    session_name: str
    message_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    session_data: Optional[Dict[str, Any]] = None  # ĐỔI TÊN
    
    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    """Response cho tin nhắn AI"""
    message_id: UUID
    session_id: UUID
    response: str
    user_message_id: UUID
    
    class Config:
        from_attributes = True

class ChatHistoryResponse(BaseModel):
    """Response cho lịch sử chat"""
    session_id: UUID
    session_name: str
    messages: List[MessageResponse]
    created_at: datetime
    
    class Config:
        from_attributes = True