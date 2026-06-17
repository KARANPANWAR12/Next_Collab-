from fastapi import WebSocket
from typing import Dict, List, Set
import json


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[tuple]] = {}
        self.user_workspaces: Dict[int, Set[int]] = {}

    async def connect(self, websocket: WebSocket, workspace_id: int, user_id: int):
        await websocket.accept()
        if workspace_id not in self.active_connections:
            self.active_connections[workspace_id] = []
        self.active_connections[workspace_id].append((websocket, user_id))
        if user_id not in self.user_workspaces:
            self.user_workspaces[user_id] = set()
        self.user_workspaces[user_id].add(workspace_id)
        online_users = list(set(uid for _, uid in self.active_connections[workspace_id]))
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "online_users": online_users,
            "workspace_id": workspace_id
        }))

    def disconnect(self, websocket: WebSocket, workspace_id: int, user_id: int):
        if workspace_id in self.active_connections:
            self.active_connections[workspace_id] = [
                (ws, uid) for ws, uid in self.active_connections[workspace_id]
                if ws != websocket
            ]
            if not self.active_connections[workspace_id]:
                del self.active_connections[workspace_id]
        if user_id in self.user_workspaces:
            self.user_workspaces[user_id].discard(workspace_id)

    async def broadcast_to_workspace(self, workspace_id: int, message: dict, exclude_user: int = None):
        if workspace_id not in self.active_connections:
            return
        dead_connections = []
        for websocket, user_id in self.active_connections[workspace_id]:
            if exclude_user and user_id == exclude_user:
                continue
            try:
                await websocket.send_text(json.dumps(message))
            except Exception:
                dead_connections.append((websocket, user_id))
        for conn in dead_connections:
            self.active_connections[workspace_id] = [
                c for c in self.active_connections[workspace_id] if c != conn
            ]

    def get_online_users(self, workspace_id: int) -> List[int]:
        if workspace_id not in self.active_connections:
            return []
        return list(set(uid for _, uid in self.active_connections[workspace_id]))
