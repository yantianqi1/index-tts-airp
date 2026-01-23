# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "声音工坊" (Voice Workshop) - an AI voice chat application that combines LLM conversations with TTS (Text-to-Speech) synthesis. The frontend is built with Next.js 14 and connects to a FastAPI backend running IndexTTS 2.0.

## Commands

### Frontend (run from `/frontend` directory)
```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint check
npm start        # Start production server
```

### Backend (run from project root)
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080  # Direct run
./start_all.sh   # Start both frontend and backend
./stop_all.sh    # Stop all services
```

## Architecture

### Frontend Stack
- **Next.js 14** with App Router (`app/` directory)
- **Zustand** for state management with localStorage persistence
- **Tailwind CSS** + **Framer Motion** for UI/animations
- **TypeScript** throughout

### Key Directories
```
frontend/
├── app/           # Next.js pages (chat, studio, depot, settings)
├── components/    # Sidebar, AudioPlayer
├── store/         # useGlobalStore.ts (Zustand - LLM/TTS config)
└── utils/         # llmApi.ts, ttsApi.ts, audioQueue.ts
```

### Data Flow
1. User sends message → `streamChatCompletion()` calls LLM API (SSE streaming)
2. During streaming, `extractQuotedTexts()` finds text in quotes (中文 "" or English "")
3. Extracted text is queued in `AudioQueueManager` → calls TTS API → plays sequentially

### State Management
`useGlobalStore.ts` manages:
- LLM config: baseUrl, apiKey, model
- TTS config: baseUrl, voice, emotion, speed, temperature, topP, topK
- Persisted to localStorage under key `voice-ai-workbench`

### Audio Queue System
`AudioQueueManager` class handles:
- FIFO queue for TTS requests
- Sequential playback (no overlap)
- Auto-cleanup of Blob URLs on audio end

## Backend API Endpoints
- `POST /v1/audio/speech` - Generate TTS audio
- `GET /v1/voices` - List available voices
- `GET /v1/audio/repository` - List saved audio files

## UI Design System
The app uses "Light Dopamine Glassmorphism" style:
- `glass-container` class: `bg-white/70 backdrop-blur-2xl rounded-3xl`
- Gradient accent colors per page (rose/pink for chat, cyan/blue for studio, violet for depot)
- Framer Motion spring animations on interactions

## Important Patterns

### TTS API Call
```typescript
const blob = await generateSpeech(ttsConfig, text, { saveAudio: true, saveName: "name" });
```

### LLM Streaming
```typescript
for await (const chunk of streamChatCompletion(llmConfig, messages)) {
  // chunk is text delta
}
```

### Quote Extraction Regex
Matches: `"text"`, `"text"`, `「text」`, `『text』`, `《text》`, `〈text〉`
