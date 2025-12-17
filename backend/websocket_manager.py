from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        serializable = jsonable_encoder(message)
        for ws in self.active_connections:
            await ws.send_json(serializable)