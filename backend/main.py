from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import joinedload
import os
import bcrypt
from jose import JWTError, jwt

from database import SessionLocal, engine
from models import Base, Question, Answer, User
from schemas import QuestionCreate, QuestionResponse, AnswerCreate, AnswerResponse, UserRegister, UserLogin, TokenResponse
from fastapi import WebSocket, WebSocketDisconnect
from websocket_manager import ConnectionManager
app = FastAPI()
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "secret-admin-token")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60

Base.metadata.create_all(bind=engine)
manager = ConnectionManager()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health():
    return {"status": "ok"}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_admin(x_admin_token: Optional[str] = Header(None), authorization: Optional[str] = Header(None)):
    if x_admin_token == ADMIN_TOKEN:
        return
    
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if user_id:
                db = SessionLocal()
                try:
                    user = db.query(User).filter(User.id == int(user_id)).first()
                    if user:
                        return
                finally:
                    db.close()
        except (JWTError, ValueError):
            pass
    
    raise HTTPException(status_code=401, detail="Unauthorized")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@app.post("/register", response_model=TokenResponse)
async def register(payload: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        (User.email == payload.email) | (User.username == payload.username)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or username already registered")
    
    hashed_password = bcrypt.hashpw(payload.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    user = User(
        username=payload.username,
        email=payload.email,
        password=hashed_password
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not bcrypt.checkpw(payload.password.encode('utf-8'), user.password.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
@app.post("/questions", response_model=QuestionResponse)
async def create_question(
    payload: QuestionCreate,
    db: Session = Depends(get_db)
):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    question = Question(
        message=payload.message,
        status="pending",
        created_at=datetime.utcnow()
    )

    db.add(question)
    db.commit()
    db.refresh(question)
    await manager.broadcast(
        {
            "type": "NEW_QUESTION",
            "payload": QuestionResponse.from_orm(question).dict(),
        }
    )


    return question

@app.get("/questions", response_model=List[QuestionResponse])
async def get_questions(db: Session = Depends(get_db)):
    questions = (
        db.query(Question)
        .options(joinedload(Question.answers))
        .order_by(
            (Question.status == "escalated").desc(),
            Question.created_at.desc()
        )
        .all()
    )
    return questions


@app.patch("/questions/{question_id}/answer", response_model=QuestionResponse)
async def mark_question_answered(
    question_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin)
):
    question = db.query(Question).filter(Question.id == question_id).first()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    question.status = "answered"
    db.commit()
    db.refresh(question)
    await manager.broadcast(
        {
            "type": "QUESTION_UPDATED",
            "payload": QuestionResponse.from_orm(question).dict(),
        }
    )

    return question

@app.patch("/questions/{question_id}/escalate", response_model=QuestionResponse)
async def escalate_question(
    question_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin)
):
    question = db.query(Question).filter(Question.id == question_id).first()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    question.status = "escalated"
    question.was_escalated = True
    db.commit()
    db.refresh(question)

    await manager.broadcast(
        {
            "type": "QUESTION_UPDATED",
            "payload": QuestionResponse.from_orm(question).dict(),
        }
    )

    return question
@app.post("/questions/{question_id}/answers", response_model=AnswerResponse)
async def add_answer(
    question_id: int,
    payload: AnswerCreate,
    db: Session = Depends(get_db)
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty")

    answer = Answer(
        question_id=question_id,
        user_name=payload.user_name,
        message=payload.message
    )

    db.add(answer)
    db.commit()
    db.refresh(answer)
    await manager.broadcast(
        {
            "type": "NEW_ANSWER",
            "payload": {
                "question_id": question_id,
                **AnswerResponse.from_orm(answer).dict(),
            },
        }
    )


    return answer


@app.websocket("/ws/questions")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  
    except WebSocketDisconnect:
        manager.disconnect(websocket)
