# AI Handoff Document: Braudle Frontend

**Date**: June 12, 2026
**Role**: Senior Frontend Engineer

## Current Project Status
I have completed Priorities 1 through 6 of the main integration tasks as requested by the user. 
The application successfully handles authentication, onboarding, document uploading (with live polling), and real-time streaming chat.

### What is working:
1. **Login Page** (`app/(auth)/login/page.tsx`): 
   - Uses the original dark theme (`bg-[#1A1A1A]`). 
   - Email magic link uses a floating label pattern. "Continue with email" appears first.
2. **Dashboard** (`app/dashboard/page.tsx`): 
   - Redesigned into a specific light theme (`bg-[#F6F7F2]`). 
   - Contains the Upload Card which successfully hits `POST /documents/upload` and polls `GET /documents/:id/status` to show progress.
3. **Onboarding**: 
   - Name collection (`app/onboarding/name/page.tsx`) redirects to `app/onboarding/page.tsx`.
   - Setup form collects study level and goals, then POSTs to `/api/profile/setup` and redirects to the dashboard.
4. **Session / Chat SSE** (`app/session/[id]/page.tsx`): 
   - Fetches welcome metadata via `GET /sessions/:id/welcome`.
   - Connects to the chat stream using `postStream` located in `lib/api.ts`.
   - Streaming works perfectly using `fetch` + `ReadableStream` decoding to bypass `EventSource`'s GET-only limitation.

### Next Immediate Task: Priority 7 (Quiz Integration)
The only major flow left is **Priority 7: Quiz Integration**.
- Check `api_endpoints_documentation.md` section 5 for exact details.
- You will need to implement `POST /quiz/generate` to get the quiz array.
- Build a Quiz UI component where the user answers questions.
- Submit the answers to `POST /quiz/:quizId/submit` which handles grading and XP rewards.

## Design Patterns & Rules to Follow
The user is **very specific** about their design identity. DO NOT assume generic SaaS styles.
1. **Colors**:
   - The auth routes (`login`) use a dark theme: `bg-[#1A1A1A]`, green accents.
   - Internal app routes (`dashboard`, `onboarding`, `session`) use the **Organic Light Theme**: Background is `#F6F7F2`, text is `#1B3B2B`. Primary buttons and icons use a dark forest green `#4A783A` and lime `#C2E1A6`.
2. **Typography**:
   - Use `font-serif` for major headings (e.g., "Welcome back, Sarah." or "Master concepts for free.").
   - Use crisp `sans-serif` for body text and UI labels.
3. **Components**:
   - Avoid excessive heavy drop-shadows and bright gradients. Keep it flat, clean, and elegant (`shadow-sm`, simple borders).
   - Use `lucide-react` for iconography.
   - The dashboard relies on a **sticky Bottom Navigation Bar** on mobile/desktop, rather than a top navbar or heavy sidebar.

## Key Files to Know
- `lib/api.ts`: Centralised fetch wrapper handling `credentials: 'include'`, token refresh logic on 401s, and the `postStream` SSE parser.
- `lib/store.ts`: Zustand store for global user state.
- `app/dashboard/page.tsx`: The hub of the app; heavily relies on the current light theme layout.
- `api_endpoints_documentation.md`: The absolute source of truth for the backend payload shapes. Read it before building the Quiz UI.

Good luck! You're ready to build the Quiz feature.
