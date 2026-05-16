from fastapi import FastAPI, Request, WebSocket
import chromadb
import google.generativeai as genai
import uuid
import io
import pypdf
import docx
from pptx import Presentation
import asyncio
import os
from dotenv import load_dotenv

# 1. NEW: Explicitly load the secrets from the .env file!
load_dotenv()

# 2. Configure Gemini Securely
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_PLACEHOLDER_KEY_HERE")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-3.1-flash-lite')

app = FastAPI()
chroma_client = chromadb.Client()
collection = chroma_client.get_or_create_collection(name="lab_knowledge")

@app.websocket("/ws/upload")
async def websocket_upload(websocket: WebSocket):
    await websocket.accept()
    try:
        meta = await websocket.receive_json()
        ext = meta.get("ext", "").lower()
        content = await websocket.receive_bytes()
        text = ""
        
        if ext == "pdf":
            pdf_reader = pypdf.PdfReader(io.BytesIO(content))
            total_pages = len(pdf_reader.pages)
            for i, page in enumerate(pdf_reader.pages):
                extracted = page.extract_text()
                if extracted: text += extracted + "\n"
                progress = int(((i + 1) / total_pages) * 90)
                await websocket.send_json({"progress": progress, "status": f"Reading PDF page {i+1} of {total_pages}..."})
                await asyncio.sleep(0.01) 
                
        elif ext == "docx":
            doc = docx.Document(io.BytesIO(content))
            total_paras = len(doc.paragraphs)
            for i, para in enumerate(doc.paragraphs):
                text += para.text + "\n"
                if i % max(1, total_paras // 20) == 0:
                    progress = int(((i + 1) / total_paras) * 90)
                    await websocket.send_json({"progress": progress, "status": "Parsing Word Document..."})
                    await asyncio.sleep(0.01)
                    
        elif ext == "pptx":
            ppt = Presentation(io.BytesIO(content))
            total_slides = len(ppt.slides)
            for i, slide in enumerate(ppt.slides):
                for shape in slide.shapes:
                    if hasattr(shape, "text"): text += shape.text + "\n"
                progress = int(((i + 1) / total_slides) * 90)
                await websocket.send_json({"progress": progress, "status": f"Reading Slide {i+1} of {total_slides}..."})
                await asyncio.sleep(0.01)
                
        elif ext == "txt":
            text = content.decode('utf-8')
            await websocket.send_json({"progress": 90, "status": "Reading text file..."})

        await websocket.send_json({"progress": 95, "status": "Embedding into Vector DB..."})
        if text.strip():
            doc_id = str(uuid.uuid4())
            collection.add(documents=[text], ids=[doc_id])
            await websocket.send_json({"progress": 100, "status": "Success", "message": f"Successfully memorized document!"})
        else:
            await websocket.send_json({"progress": 100, "status": "Error", "message": "No extractable text found."})

    except Exception as e:
        await websocket.send_json({"progress": 0, "status": "Error", "message": f"Parsing Failed: {str(e)}"})
    finally:
        await websocket.close()

@app.post("/ask")
async def ask_ai(request: Request):
    data = await request.json()
    user_question = data.get("question", "")
    results = collection.query(query_texts=[user_question], n_results=1)
    retrieved_context = results['documents'][0][0] if results['documents'] and results['documents'][0] else "No context."
    try:
        response = model.generate_content(f"Context: {retrieved_context}\n\nQuestion: {user_question}")
        return {"status": "Success", "retrieved_context": retrieved_context, "answer": response.text}
    except Exception as e:
        return {"status": "Error", "answer": str(e)}