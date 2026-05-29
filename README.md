# BRAUDLE AI

**Deep Learning, Not Just Answers.**

Braudle is a high-fidelity AI tutor designed to move students away from passive summaries and toward deep conceptual mastery. Built for students who want to actually *understand* their subjects, Braudle uses a Socratic "Teach Mode" to identify logic gaps and build mental models.

![Braudle Preview](https://images.unsplash.com/photo-1519337265831-281ec6cc8514?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80)

## 🌲 The Philosophy

We believe AI in education shouldn't be a "shortcut" to a grade, but a "ladder" to understanding. Braudle is grounded in a minimal, charcoal aesthetic—avoiding the over-styled "vibecoded" looks of current AI tools to keep the focus on clarity and education.

## 🚀 Key Features

- **Teach Mode (SSE)**: Real-time, step-by-step guidance using Server-Sent Events (SSE) for a natural "tutor typing" feel.
- **Multi-Format Ingestion**: Upload PDFs, whiteboard images, or even lecture audio.
- **Adaptive Quizzes**: MCQ and theory questions targeting your historical weak spots and misconceptions.
- **Explain Like I'm...**: Switch between Beginner, Intermediate, and Advanced depths mid-conversation.
- **Deep Analytics**: A logic-first dashboard tracking your average scores, sessions, and subject mastery.

## 🛠️ Tech Stack

### Frontend (Next.js & TypeScript)
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS (Forest & Lime palette)
- **State**: Zustand
- **Motion**: Framer Motion
- **Icons**: Lucide React / Custom SVGs

### Backend (JavaScript ESM)
- **Environment**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: Passport.js (Google OAuth 2.0) + JWT
- **Background Tasks**: BullMQ + Redis (for stable async PDF processing)
- **AI Engine**: Groq AI Engine
  - **Teaching**: `llama-3.3-70b`
  - **Vision/OCR**: `llama-3.2-11b`

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Atlas or local)
- Redis (for BullMQ queues)
- Groq API Key
- Google OAuth Credentials

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/braudle-frontend.git
   cd braudle-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env.local` file (Frontend) and `.env` (Backend):
   ```env
   # Frontend
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   
   # Backend
   MONGODB_URI=your_mongodb_uri
   REDIS_URL=your_redis_url
   GROQ_API_KEY=your_key
   GOOGLE_CLIENT_ID=your_id
   GOOGLE_CLIENT_SECRET=your_secret
   JWT_SECRET=your_jwt_secret
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

## 🔒 Architecture & Rate Limits

Braudle is designed for a zero-cost AI architecture by leveraging Groq's high-speed inference and local document parsing.
- **Free Limit**: 2 PDF uploads / 5 Image OCRs per day.
- **Processing**: Local parsing via `pdf-parse` (eliminates extraction costs) and BullMQ for background stability.
- **Inference**: SSE ensures that long teaching sessions remain persistent and interactive.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Build your brain, not just your notes.* 🌲 [braudle.ai](https://braudle.ai)
