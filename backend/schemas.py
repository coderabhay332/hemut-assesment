from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List


class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class QuestionCreate(BaseModel):
    user_name: str
    message: str
class AnswerCreate(BaseModel):
    user_name: str
    message: str

class AnswerResponse(BaseModel):
    id: int
    user_name: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionResponse(BaseModel):
    id: int
    message: str
    status: str
    created_at: datetime
    was_escalated: bool = False
    answers: List[AnswerResponse] = []

    class Config:
        from_attributes = True
