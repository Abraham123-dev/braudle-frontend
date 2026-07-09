# Enterprise vs Current: Document Pipeline Architecture

---

## What Big Companies (Google, Notion, Adobe, OpenAI) Do

### Their Fundamental Design Principle:
> "A document should be available to the user AS SOON as the minimum viable processing is done.
> Everything else builds in the background, invisibly."

---

## Side-by-Side Comparison

| Concern | Current Braudle | Enterprise (Google/Notion) |
|---|---|---|
| **Job Structure** | One massive monolithic worker job with 6 stages | **Each stage is its own independent job** chained in a DAG |
| **Document Availability** | User waits until ALL stages finish (embeddings + cache) | Document is `ready` after chunks are extracted — tutor works immediately |
| **Embedding Strategy** | `Promise.all(150 chunks)` fires 150 HTTP requests at once | **Batch queue**: groups of 20, with exponential backoff per batch |
| **Knowledge Cache** | Blocks document `ready` status until cache is built | Built **entirely in background after ready**, user never waits |
| **Progress Feedback** | HTTP polling every 2s (pollIngestionStatus) | **Server-Sent Events** pushed from backend — no polling, no JWT re-auth |
| **JWT Dependency** | Polling uses user JWT → expires mid-processing → fake error | **Zero JWT dependency** — progress tracked in Redis, SSE stream is auth-once |
| **Failure Recovery** | One error in Stage 5 fails the ENTIRE job | Each stage retries **independently** — Stage 5 failure doesn't undo Stage 4 |
| **Multiple Users** | 4 concurrent workers, no rate limit awareness | **Rate-limit-aware queue** with per-provider token budgets |
| **Large vs Small PDFs** | Same pipeline regardless of file size | **Adaptive routing**: small PDF → fast path, large PDF → priority background queue |

---

## The Real Problem (Architectural)

Your current pipeline is a **single monolithic job**:

```
[START] → extract → chunk → understand → embed ALL → build ENTIRE cache → [READY]
```

If ANY step fails, the whole thing fails. And the user is blocked on ALL steps.

### Enterprise Pattern: Staged DAG (Directed Acyclic Graph)

```
[Stage A: Extract + Chunk]     → doc.status = 'processing'
       ↓ on success
[Stage B: Topic/Summary]       → doc.status = 'READY'  ← USER CAN START NOW
       ↓ in parallel, background
[Stage C: Chunk Embeddings]    → doc.chunkEmbeddings = [...] (RAG gets better)
[Stage D: Knowledge Cache]     → doc.knowledgeCache = {...} (Quiz/Flashcards unlock)
```

The user starts studying at **Stage B completion**, not after all 4 stages.
Stages C and D run silently. The tutor WORKS during C and D — it just uses keyword fallback for RAG until embeddings are ready.

---

## The JWT / "Invalid Token" Issue — Real Fix

The real fix is not "refresh the token" — it's **remove the JWT from the progress loop entirely**.

### Current (Broken for Long Processing):
```
Frontend polls /documents/:id/status every 2s
  → uses fetchWithRefresh (JWT cookie required)
  → JWT expires after 15 min
  → 401 → looks like upload failure → user sees error
```

### Enterprise Fix: SSE Stream (Auth Once, Stream Forever)
```
Backend: GET /documents/:id/progress
  → Verify JWT ONCE at connection time
  → Open SSE stream
  → Worker updates Redis on each stage change
  → Backend reads Redis, pushes SSE event to open stream
  → Frontend receives progress events without re-authenticating

Connection is established once. JWT validity checked once.
Even if the access token technically expires, the SSE TCP connection stays alive.
```

---

## Multiple Users: Rate Limit-Aware Queue

### Current Problem:
With `concurrency: 4`, if 4 users upload 20MB PDFs simultaneously:
```
4 workers × 150 chunks × 1 embedding request each = 600 concurrent HTTP calls to OpenRouter
→ Instant 429 rate limit
→ All 4 jobs fail at Stage 5
→ 4 users see upload errors simultaneously
```

### Enterprise Fix: Provider Token Budget + Priority Queue
```js
// Redis-tracked global budget per provider
const OPENROUTER_RPM_BUDGET = 300; // max 300 requests per minute
const embeddingQueue = new Queue('embeddings', {
  defaultJobOptions: {
    rateLimiter: {
      max: 20,      // 20 embedding jobs per...
      duration: 1000 // ...second (20 RPS across all workers)
    }
  }
});
```
This means 100 users uploading simultaneously still only fire 20 embedding requests/second — safely within limits, jobs queue up and process in order.

---

## What Specifically We Need To Build

### 1. Split the Worker Into 3 Independent Jobs

**Job A: `extract-and-chunk`** (Fast: 10-30s)
- Download from R2
- Extract text (pdf-parse or vision)
- Semantic chunk
- Save chunks to MongoDB
- Set `processingStatus: 'processing_embeddings'`
- **Queue Job B and C**

**Job B: `generate-embeddings`** (Medium: 30-120s depending on PDF size)
- Process chunks in batches of 20 with 500ms delay between batches
- Save `chunkEmbeddings` to MongoDB
- This runs AFTER the document is already `ready` for tutoring

**Job C: `build-knowledge-cache`** (Slow: 60-180s for large PDFs)
- Split into 2 prompts (structural + question bank)
- Save to `knowledgeCache` in MongoDB
- This also runs AFTER document is `ready`
- When done, mark `knowledgeCacheReady: true` → frontend unlocks Quiz/Flashcard tabs

### 2. Set Document to READY After Just Extract + Chunk + Topic Summary

```js
// After Stage 4 (topic/summary extraction):
await Document.findByIdAndUpdate(documentId, {
  rawText: extractedText,
  chunks,
  topics,
  summary,
  processingStatus: 'ready',   // ← READY HERE, not at the end
  processingStage: 'ready',
});

// THEN queue embedding + cache jobs separately, non-blocking
await embeddingQueue.add('generate-embeddings', { documentId });
await cacheQueue.add('build-knowledge-cache', { documentId });
```

### 3. SSE Progress Stream (Replace Polling)

**Backend: Add SSE endpoint**
```js
// GET /api/documents/:id/progress (SSE)
app.get('/api/documents/:id/progress', verifyJWT, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const key = `doc:progress:${req.params.id}`;

  // Subscribe to Redis pub/sub channel for this document
  const subscriber = new Redis(env.redisUrl);
  subscriber.subscribe(key);
  subscriber.on('message', (channel, message) => {
    res.write(`data: ${message}\n\n`);
  });

  req.on('close', () => subscriber.disconnect());
});
```

**Worker publishes to Redis on each stage:**
```js
const publishProgress = async (documentId, stage, status) => {
  await redisClient.publish(
    `doc:progress:${documentId}`,
    JSON.stringify({ stage, status, timestamp: Date.now() })
  );
};
```

**Frontend: Replace pollIngestionStatus with EventSource**
```ts
const listenToProgress = (docId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const es = new EventSource(`${API_BASE}/documents/${docId}/progress`, {
      withCredentials: true
    });
    es.onmessage = (event) => {
      const { stage, status } = JSON.parse(event.data);
      if (status === 'ready') { es.close(); resolve(); }
      if (status === 'failed') { es.close(); reject(new Error('Processing failed')); }
      updateProgressUI(stage);
    };
    es.onerror = () => {
      es.close();
      reject(new Error('Progress stream disconnected'));
    };
  });
};
```

---

## Summary: What To Build

| Priority | Change | Impact |
|---|---|---|
| 🔴 **Critical** | Split monolithic worker into 3 queues | Stops all crashes at 97% |
| 🔴 **Critical** | Mark document READY after extract+chunk+topics | User can start studying in 30s |
| 🔴 **Critical** | Batch embeddings 20/batch with 300ms delay | Eliminates 429 rate limit errors |
| 🟡 **High** | Replace polling with SSE progress stream | Fixes JWT expiry "false errors" |
| 🟡 **High** | Split knowledge cache into 2 smaller prompts | Prevents 30s timeout on large PDFs |
| 🟢 **Medium** | Add per-queue rate limiters in BullMQ | Safe multi-user scaling |
| 🟢 **Medium** | `knowledgeCacheReady` flag on document | Progressive UI unlock |
