from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_upload_pdf_success():
    # Create a dummy PDF content
    files = {'file': ('test.pdf', b'%PDF-1.4 content', 'application/pdf')}
    response = client.post("/api/upload", files=files)
    assert response.status_code == 200
    assert response.json() == {"filename": "test.pdf", "status": "Upload received"}

def test_upload_invalid_file_type():
    files = {'file': ('test.txt', b'text content', 'text/plain')}
    response = client.post("/api/upload", files=files) 
    # Depending on implementation, checking returned json error or 400
    # Our impl returns JSON with error key for now, status 200 (could be improved to 400 later)
    assert response.status_code == 200
    assert "error" in response.json()
