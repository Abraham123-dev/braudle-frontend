# BRAUDLE AI

**Deep Learning, Not Just Answers.**

Braudle is a high-fidelity AI tutor designed to move students away from passive summaries and toward deep conceptual mastery. Built for students who want to actually *understand* their subjects, Braudle uses a Socratic "Teach Mode" to identify logic gaps and build mental models.

![Braudle Preview](https://images.unsplash.com/photo-1519337265831-281ec6cc8514?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80)

## 🌲 The Philosophy

We believe AI in education shouldn't be a "shortcut" to a grade, but a "ladder" to understanding. Braudle is grounded in a minimal, charcoal aesthetic—avoiding the over-styled "vibecoded" looks of current AI tools to keep the focus on clarity and education.

## 🚀 Key Features

- **Teach Mode (SSE)**: Real-time, step-by-step guidance using Server-Sent Events for a natural tutoring feel.
- **Multi-Format Ingestion**: Upload PDFs, whiteboard images, or lecture audio.
- **Adaptive Quizzes**: Quizzes that target your historical weak spots and misconceptions.
- **Explain Like I'm...**: Switch between Beginner, Intermediate, and Advanced depths mid-conversation.
- **Deep Analytics**: A dashboard showing where your logic breaks, not just what you got wrong.

## 🛠️ Tech Stack

### Frontend (Next.js & TypeScript)
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS (Forest & Lime palette)
- **State**: Zustand
- **Motion**: Framer Motion
- **Icons**: Lucide React / Custom SVGs

### Backend (JavaScript ESM)
- **Environment**: Node.js (ES Modules)
- **AI Brain**: Groq AI Engine
  - **Teaching**: `llama-3.3-70b`
  - **Vision/OCR**: `llama-3.2-11b`
- **Streaming**: SSE (Server-Sent Events)

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- Groq API Key
- Supabase (Auth & Database)

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
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   GROQ_API_KEY=your_key
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

## 🔒 Architecture & Rate Limits

Braudle is designed for a zero-cost AI architecture by leveraging Groq's high-speed inference. To maintain sustainability:
- **Free Limit**: 2 PDF uploads / 5 Image OCRs per day.
- **Inference**: SSE ensures that long teaching sessions don't time out and feel interactive.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Build your brain, not just your notes.* 🌲 [braudle.ai](https://braudle.ai)
