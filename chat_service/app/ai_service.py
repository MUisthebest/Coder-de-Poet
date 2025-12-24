import os
import time
from groq import Groq
from dotenv import load_dotenv
from typing import List, Tuple

load_dotenv()

class SimpleAIService:
    def __init__(self, api_key: str = None):
        # 1. Khởi tạo Client Groq
        api_key = api_key or os.getenv("GROQ_API_KEY")
        self.client = Groq(api_key=api_key)
        
        # 2. Danh sách model trên Groq (Cực nhanh và ổn định)
        self.available_models = [
            "llama-3.3-70b-versatile", # Model mạnh nhất
            "llama-3.1-8b-instant",     # Model nhanh nhất
            "mixtral-8x7b-32768"        # Model của Mistral
        ]
        self.model_index = 0
        self.model_id = self.available_models[self.model_index]
        
        self.system_instruction = "Bạn là chuyên gia IT Support. Trả lời ngắn gọn, tập trung vào kỹ thuật bằng tiếng Việt."
        print(f"Đã kết nối Groq Cloud - Model: {self.model_id}")

    def generate_response(self, user_message: str, chat_history: List[Tuple[str, str]] = None) -> str:
        # Format history cho Groq (giống format OpenAI)
        messages = [{"role": "system", "content": self.system_instruction}]
        
        if chat_history:
            for u, a in chat_history[-3:]: # Lấy 3 cặp hội thoại gần nhất
                messages.append({"role": "user", "content": u})
                messages.append({"role": "assistant", "content": a})
        
        messages.append({"role": "user", "content": user_message})

        # Cơ chế Retry chống lỗi Rate Limit (429)
        for attempt in range(3):
            try:
                completion = self.client.chat.completions.create(
                    model=self.model_id,
                    messages=messages,
                    temperature=0.5,
                    max_tokens=1024,
                    top_p=1,
                    stream=False,
                )
                return completion.choices[0].message.content

            except Exception as e:
                error_msg = str(e)
                if "429" in error_msg:
                    print(f"Groq Rate Limit. Đang thử lại lần {attempt + 1}...")
                    time.sleep(2)
                    continue
                return f"Lỗi Groq: {error_msg}"

        return "Groq đang quá tải, vui lòng thử lại sau."

# Tạo global instance
ai_service = SimpleAIService()