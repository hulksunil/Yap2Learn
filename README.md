# Yap2Learn

## Semantic Flashcards (MongoDB Atlas + Vector Search)

This project now includes a "Semantic Flashcards" feature powered by MongoDB Atlas. It runs a local Express server alongside the Expo app to handle data synchronization and vector search.

### 1. Backend Setup (New)
The backend is located in the `server/` directory.

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Environment Variables**
   Ensure your root `.env` includes:
   ```bash
   # MongoDB Atlas Connection String
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   
   # Enable Sync Feature
   EXPO_PUBLIC_ENABLE_MONGODB_SYNC=true
   
   # Base URL for local dev (Android Emulator: 10.0.2.2, iOS Simulator: localhost)
   EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api
   
   # Gemini API Key (for embeddings)
   EXPO_PUBLIC_GEMINI_API_KEY=AIza...
   ```

3. **Run Server**
   ```bash
   cd server
   npm run dev
   # Server runs on http://localhost:3000
   ```

### 2. MongoDB Atlas Vector Search Setup
To enable "Struggled With" mode, you must create a Vector Search Index in MongoDB Atlas.

1. Go to your Cluster -> **Atlas Search** -> **Create Search Index**.
2. Select **JSON Editor**.
3. Select Database: (your db name), Collection: **flashcards**.
4. Index Name: `vector_index`.
5. Configuration JSON:
   ```json
   {
     "fields": [
       {
         "numDimensions": 768,
         "path": "embedding",
         "similarity": "cosine",
         "type": "vector"
       }
     ]
   }
   ```
   *(Note: Gemini `text-embedding-004` uses 768 dimensions. If using a different model, adjust `numDimensions`.)*

### 3. How to Demo "Struggled With"

1. **Start Session**: Talk to the AI agent. Make some intentional mistakes (e.g., say "Je suis fini" instead of "J'ai fini").
2. **End Session**: Tap "End Session". This triggers the background sync (`POST /sync-session`).
3. **Embeddings**: The server automatically queues generating embeddings for your mistakes and flashcards (`POST /embed-pending` triggered after sync).
4. **Go to Flashcards**:
   - Toggle "By Scenario" (Standard view).
   - Toggle "Struggled With" (Semantic view).
5. **Observe**: You should see flashcards conceptually related to your recent mistakes (e.g., if you messed up "finir", you might see cards about finishing tasks or past tense verbs).

### 4. Manual Test Checklist
- [ ] **Mongo Disabled**: Set `ENABLE_MONGODB_SYNC=false`. App should behave exactly as before (local storage only).
- [ ] **Sync**: Finish a session. Check MongoDB Atlas collection `sessions`. Data should appear.
- [ ] **Embeddings**: Check `flashcards` collection. Field `embedding` should be populated (array of numbers).
- [ ] **Vector Search**: Toggle "Struggled With". Use `server` logs (`npm run dev`) to see if `/api/flashcards/struggles` is called and returns results.

### 5. Troubleshooting
- **Network Error**: Ensure `EXPO_PUBLIC_API_BASE_URL` is correct. iOS Simulator uses `localhost`, Android Emulator uses `10.0.2.2`.
- **No Embeddings**: Check server console for Gemini API errors.
