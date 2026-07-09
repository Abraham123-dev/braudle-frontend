# Pitch Guide: Upload Ingestion & Scalability Architecture

This guide explains how Braudle's upload system is designed to handle heavy enterprise-level loads. It is written in simple English but backed by strict technical details, making it perfect for presenting to judges, startup reviewers, or senior software engineers.

---

## ⚡ The Scenario: 20 Paid Users Upload 20MB PDFs at Once (400MB Total Data)

Imagine 20 premium students click "Upload" on 20MB textbook files at the exact same second. In a standard web application, this is a recipe for a server crash. 

Here is how Braudle handles it without breaking a sweat.

---

## 🔄 Step-by-Step Lifecycle of the Uploads

### Phase 1: Cryptographic Handshake (0.01 Seconds)
1. **The Action:** The 20 browsers make a quick request to the server: *"I want to upload a 20MB PDF."*
2. **The Backend Check:** The backend checks the database to confirm they are paid users and have not exceeded their daily limits. 
3. **The Response:** Instead of telling the browser to send the file to the server, the backend makes a split-second call to Cloudflare R2 (S3-compatible storage) to generate a **Presigned Upload URL** (a secure, temporary upload link). The server sends this link back to the browser and creates a placeholder document in MongoDB with a `pending` status.
4. **Why it doesn't crash:** Generating these links is a lightweight mathematical calculation. The backend server never handles or touches the 400MB of file data.

### Phase 2: Direct-to-Cloud Upload (10 - 20 Seconds)
1. **The Action:** The 20 browsers upload the 20MB files **directly to Cloudflare R2** using the temporary link.
2. **Why it doesn't crash:** The 400MB stream of data goes straight to Cloudflare's massive global cloud infrastructure, completely bypassing your Node.js server. 
   * **Node.js RAM consumption remains at 0MB** for this entire transfer.
   * **Node.js Event Loop remains completely unblocked** and ready to serve other users.

### Phase 3: The Confirmation (0.05 Seconds)
1. **The Action:** Once Cloudflare R2 confirms it has the file, the browser hits the backend server: *"The file is safe in the cloud. Please start processing."*
2. **The Queue Entry:** The server creates a job in a **BullMQ** queue backed by **Redis** and returns a `202 Accepted` status code to the client.
3. **Why it doesn't crash:** The user gets an instant confirmation on their screen. The backend does not freeze the browser while parsing the PDF.

### Phase 4: Smart Worker Processing (The Shield)
This is where the magic happens. The server doesn't try to parse 20 heavy PDFs at the same time, which would spike CPU to 100% and freeze the app. Instead, it uses **Queue Separation**:

```
[Redis Job Queue] ──► extractionWorker (Max 4 Parallel Jobs)
                             │
                  ┌──────────┴──────────┐
                  ▼                     ▼
            embeddingQueue          cacheQueue
         (Paced: 20 jobs/s)   (Parallel Prompts A/B)
```

1. **Extraction Worker (`concurrency: 4`):**
   * The queue worker picks up exactly **4 PDFs** to parse. The other 16 documents wait in the Redis queue.
   * For the 4 active PDFs: the text is parsed, cleaned, and split into semantic paragraphs. Topics and summaries are generated.
   * Once a PDF is ready, its database status is set to `'ready'` (taking ~10-20 seconds).
   * The worker pulls the next job from the queue.
   * **Why it doesn't crash:** Sequential processing. Running 20 CPU-heavy parses simultaneously would crash Node; running 4-at-a-time keeps the CPU healthy and active.

2. **Embedding Worker (Rate Limit Shield):**
   * A document with 100 chunks needs 100 vector embeddings. 20 documents mean **2,000 vector API requests**.
   * Our embedding worker queue has a rate limiter configured at **20 jobs per second** and processes chunks in batches of 20 with a **300ms pause**.
   * **Why it doesn't crash:** It flattens the requests into a slow, steady stream, completely avoiding `429 Too Many Requests` API rate limit blocks.

3. **Cache Worker (Split Prompts):**
   * Parallel prompts (Prompt A + Prompt B) generate concepts, quizzes, and flashcards in parallel.
   * **Why it doesn't crash:** By splitting the massive workload into two parallel threads, we cut processing time in half, ensuring the LLM provider never times out.

---

## 📈 Summary of Scalability Strengths (Pitch Highlights)

* **Direct-to-Cloud Storage:** Zero backend bandwidth or RAM consumed during uploads.
* **Decoupled Queue Workers:** CPU-heavy tasks are throttled (processed 4-at-a-time) to prevent server freeze/OOM crash.
* **Provider Rate Limit Pacing:** Global BullMQ queues pace vector API calls safely under external RPM budgets.
* **Server-Sent Events (SSE):** Updates progress dynamically using tiny, open TCP connections instead of heavy database polling.
