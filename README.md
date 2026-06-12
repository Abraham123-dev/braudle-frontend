# Braudle Frontend

Braudle is an AI-powered tutor designed to help students master deep concepts using their own uploaded materials. This repository contains the Next.js frontend built with React, Tailwind CSS, and Framer Motion.

## Features Implemented

1. **Authentication Integration**
   - Google OAuth redirection
   - Passwordless Email Magic Link flow (start & verify via API)
   - Integrated floating labels and a clean, flat aesthetic on the login page

2. **Onboarding Integration**
   - Name collection for email-registered users
   - Comprehensive Profile Setup collecting base knowledge, academic level, learning style, and goals

3. **Dashboard & Document Upload Integration**
   - Completely custom dashboard built with a calming, organic light theme
   - Inline Document Upload Card supporting PDFs and images
   - Polling mechanism to track real-time AI extraction status (`GET /api/documents/:id/status`)

4. **Session Welcome & AI Chat SSE Integration**
   - Active study session interface (`/session/[id]`) with mastery progress
   - Real-time Server-Sent Events (SSE) chat using a custom Fetch-based streaming client
   - Markdown rendering for rich AI Tutor responses

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Configure Environment Variables:
   Set `NEXT_PUBLIC_API_URL` to point to the Braudle Express backend (default: `http://localhost:5000`).

## Technology Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS, Vanilla CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Markdown Rendering**: react-markdown

## Design Language
Braudle uses a natural, focused aesthetic:
- **Primary Background**: `#F6F7F2` (Soft beige)
- **Primary Text**: `#1B3B2B` (Dark green/black)
- **Accent/Brand**: `#4A783A` (Forest Green) and `#C2E1A6` (Lime Green)

*Designed for seamless, distraction-free learning.*
