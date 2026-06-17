from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.workspace import WorkspaceMember
from schemas import SummarizeRequest
from core.security import get_current_user
from core.config import settings
import httpx

router = APIRouter()


async def call_openai(prompt: str, system: str = None) -> str:
    if not settings.OPENAI_API_KEY:
        return generate_mock_response(prompt)
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
            json={"model": "gpt-4o-mini", "messages": messages, "max_tokens": 800},
            timeout=30.0
        )
        data = response.json()
        return data["choices"][0]["message"]["content"]


def generate_mock_response(prompt: str) -> str:
    words = prompt.split()
    wc = len(words)
    return f"""**AI Response (Demo Mode)**

This is a simulated AI response. To enable real AI, add your `OPENAI_API_KEY` to `.env`.

**Analysis of your input** ({wc} words detected):
- Your request appears to be about: *{' '.join(words[:6])}...*
- The content seems structured and well-organized
- Key themes identified in the text

**Key Points:**
• Main topic: {' '.join(words[:3]) if words else 'General content'}
• Document length: {wc} words
• Recommendation: Review and refine the content

**Summary:**
The provided content covers multiple aspects. For production use with real AI analysis, configure your OpenAI API key in the backend `.env` file.

> 💡 **Tip:** Add `OPENAI_API_KEY=your_key` to `backend/.env` for real AI responses."""


@router.post("/summarize")
async def summarize_document(
    workspace_id: int,
    data: SummarizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Access denied")
    if not data.content or len(data.content.strip()) < 10:
        raise HTTPException(status_code=400, detail="Content too short to summarize")

    mode_prompts = {
        "summary": f"Provide a concise summary of the following content. Identify main topics and key insights:\n\n{data.content}",
        "action_points": f"Extract all action items and next steps from the following content. Format as a numbered list:\n\n{data.content}",
        "meeting_notes": f"Convert the following content into structured meeting notes with: Key Decisions, Action Items, and Follow-ups:\n\n{data.content}"
    }
    prompt = mode_prompts.get(data.mode, mode_prompts["summary"])
    system = "You are a helpful AI assistant in NexCollab, a collaborative workspace platform. Be concise and professional."
    try:
        result = await call_openai(prompt, system)
        return {"summary": result, "mode": data.mode}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI processing failed: {str(e)}")


@router.post("/chat")
async def ai_chat(
    workspace_id: int,
    message: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Access denied")
    user_message = message.get("message", "")
    context = message.get("context", "")
    system = "You are a helpful AI assistant in NexCollab collaborative workspace. Help users with their documents, tasks, and questions. Be concise and professional."
    prompt = f"Workspace context: {context}\n\nUser: {user_message}" if context else user_message
    try:
        result = await call_openai(prompt, system)
        return {"response": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
