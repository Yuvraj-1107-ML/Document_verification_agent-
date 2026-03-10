# Document Verification Agent (DocuTrust Bot)

A professional, high-performance document processing system that combines high-accuracy OCR, intelligent field extraction using LLMs, and automated seal detection to verify complex business documents.

## 🚀 Key Features

- **Intelligent OCR**: High-fidelity text extraction from multiple document formats (PDF, ZIP, Images).
- **LLM-Powered Extraction**: Uses Azure OpenAI to contextually extract and validate specific fields from analyzed text.
- **Seal Detection**: Automated detection and classification of government and corporate seals.
- **Professional Dashboard**: A premium, responsive UI featuring glassmorphism, micro-animations, and live processing logs.
- **Batch Processing**: Support for processed ZIP archives containing multiple documents.

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **AI/ML**: Azure OpenAI (GPT-4), Computer Vision for Seal Detection
- **Processing**: Specialized services for OCR and Excel report generation
- **Server**: Uvicorn with auto-reload

### Frontend
- **Framework**: React 18 with TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS with custom Design System
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 📦 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Azure OpenAI API Credentials

### Backend Setup
1. Navigate to the backend directory:
   ```powershell
   cd backend
   ```
2. Create and activate a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Configure environment variables in `.env`:
   ```env
   AZURE_OPENAI_ENDPOINT=your_endpoint
   AZURE_OPENAI_KEY=your_key
   AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment
   ```
5. Run the server:
   ```powershell
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```powershell
   cd docu-trust-bot
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the development server:
   ```powershell
   npm run dev
   ```

## 📂 Project Structure

```text
├── backend/                # FastAPI application
│   ├── main.py             # API Entry point
│   ├── ocr_service.py      # Document text extraction
│   ├── llm_extractor.py    # Azure OpenAI integration
│   └── seal_detector.py    # Image processing for seals
├── docu-trust-bot/         # React Frontend
│   ├── src/components/     # UI Components (Upload, Tables, etc.)
│   ├── src/pages/          # Main application pages
│   └── src/index.css       # Core design system
└── README.md               # Project documentation
```

## 🔒 Security
- `.env` files are ignored by Git to prevent credential leaks.
- Azure OpenAI Keys should be managed securely via environment variables.

---
Developed as part of the CGMSCL New Requirement OCR-POC.
