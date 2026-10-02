# Video Transcription & Subtitle Burner — Project Spec

**Stack:** Node.js + Express (JavaScript)
**Goal:** Upload a video → transcribe speech locally with Whisper → burn subtitles into the video → download the result.

This is a job-orchestration project, not a CRUD project. The value is in clean async pipeline design, proper error handling, and testable business logic — not in the number of endpoints.

---

## 1. The Pipeline

```
1. User uploads video            → stored on disk, Job created (status: QUEUED)
2. Worker picks up job           → status: EXTRACTING_AUDIO
3. ffmpeg extracts audio track   → audio.wav
4. Whisper transcribes audio     → status: TRANSCRIBING → timestamped segments
5. Generate .srt subtitle file   → from Whisper's segments
6. ffmpeg burns .srt into video  → status: BURNING_SUBTITLES
7. Output video saved            → status: COMPLETED
8. Frontend polls status         → shows result + download link
```

Failure at any step → status: `FAILED` with an error message, job does not proceed further.

---

## 2. Tech Stack

| Concern              | Choice                          | Why                                                            |
|-----------------------|----------------------------------|-----------------------------------------------------------------|
| Server                | Express (Node.js)                | Simple, well understood, easy to layer cleanly                  |
| Job queue             | BullMQ + Redis                   | Video processing is slow — must be async, not block the request |
| Transcription         | `nodejs-whisper` (wraps whisper.cpp) | Runs locally, no Python dependency, no API cost              |
| Video processing      | `fluent-ffmpeg` (wraps ffmpeg CLI)| Extract audio, burn subtitles                                   |
| File uploads          | `multer`                         | Standard for multipart video uploads                             |
| Job metadata storage  | Prisma + SQLite (or Postgres)    | Track job status, timestamps, file paths                        |
| Real-time status      | Polling endpoint (or SSE later)  | Frontend needs to know when a job is done                       |
| Frontend              | Plain HTML + JS                  | Upload form, progress display, video preview/download           |

**Prerequisites installed on the machine:** `ffmpeg` CLI, Redis server, a whisper.cpp model file (e.g. `ggml-tiny.en.bin` or `ggml-base.en.bin`).

---

## 3. Clean Architecture Layout

```
src/
  modules/
    transcription-job/
      domain/
        Job.js                    # entity: id, status, videoPath, transcript, outputPath, error
        JobStatus.js               # enum + valid state transitions

      application/
        use-cases/
          CreateJob.js             # validates upload, persists job, enqueues
          ProcessJob.js            # orchestrates: extract -> transcribe -> generate srt -> burn
          GetJobStatus.js
        ports/                     # interfaces the use-cases depend on (not concrete libs)
          IVideoProcessor.js       # extractAudio(videoPath), burnSubtitles(videoPath, srtPath)
          ITranscriptionService.js # transcribe(audioPath) -> segments[]
          IJobRepository.js        # save(job), findById(id), update(job)

      infrastructure/
        FfmpegVideoProcessor.js       # implements IVideoProcessor using fluent-ffmpeg
        WhisperTranscriptionService.js # implements ITranscriptionService using nodejs-whisper
        PrismaJobRepository.js         # implements IJobRepository
        BullMQQueue.js                 # job queue setup + worker registration

      interface/
        job.controller.js
        job.routes.js
        dto/uploadVideoDto.js

  shared/
    errors/
      AppError.js
    middleware/
      errorHandler.js
      uploadValidation.js
    config/
      env.js

  worker.js        # standalone process that runs the BullMQ worker (ProcessJob)
  app.js           # Express app setup
  server.js        # entrypoint

test/
  unit/            # use-cases tested with FAKE processors — no real ffmpeg/whisper, fast & deterministic
  integration/     # real ffmpeg + tiny Whisper model on a short sample clip (few seconds)
  e2e/             # full upload -> poll -> download flow via Supertest

public/
  index.html       # minimal upload form + status polling + result preview
```

### The key architectural rule

`ProcessJob` (the use-case) depends only on the **interfaces** `IVideoProcessor` and `ITranscriptionService` — never directly on `fluent-ffmpeg` or `nodejs-whisper`.

Benefits:
- Unit tests can inject fake implementations that return canned data instantly — no real video/audio processing needed to test orchestration logic.
- If you later swap local Whisper for a cloud API, only the infrastructure layer changes; use-cases and tests stay untouched.

---

## 4. Data Model

**Job**
| Field         | Type      | Notes                                                       |
|---------------|-----------|--------------------------------------------------------------|
| id            | string    | UUID                                                          |
| status        | enum      | QUEUED, EXTRACTING_AUDIO, TRANSCRIBING, BURNING_SUBTITLES, COMPLETED, FAILED |
| originalPath  | string    | path to uploaded video                                        |
| audioPath     | string    | path to extracted audio (temp)                                |
| srtPath       | string    | path to generated subtitle file                               |
| outputPath    | string    | path to final subtitled video                                 |
| transcript    | text/json | full transcript text or segments                              |
| errorMessage  | string    | populated only if status = FAILED                              |
| createdAt     | datetime  |                                                                |
| updatedAt     | datetime  |                                                                |

**JobStatus transitions** (enforce these in `Job.js`, reject invalid transitions):
```
QUEUED -> EXTRACTING_AUDIO -> TRANSCRIBING -> BURNING_SUBTITLES -> COMPLETED
   \-> FAILED (from any state)
```

---

## 5. API Endpoints

| Method | Route              | Purpose                                      |
|--------|---------------------|-----------------------------------------------|
| POST   | `/api/jobs`          | Upload a video, creates and enqueues a job    |
| GET    | `/api/jobs/:id`       | Get current status + transcript (if ready)    |
| GET    | `/api/jobs/:id/download` | Download the final subtitled video       |
| GET    | `/api/jobs`           | (optional) list recent jobs                   |

---

## 6. Testing Strategy

1. **Unit tests** — `ProcessJob` use-case with fake `IVideoProcessor` / `ITranscriptionService`.
   - Assert correct status transitions in order.
   - Assert a transcription failure marks the job `FAILED` and does not proceed to burning.
   - Assert repository is updated at each stage.

2. **Integration tests** — real ffmpeg + Whisper `tiny.en` model against a tiny fixture video (a few seconds long) so tests run in seconds, not minutes.
   - Assert audio extraction produces a valid `.wav`.
   - Assert transcription returns non-empty segments for a clip with speech.
   - Assert burning subtitles produces a valid output video file.

3. **E2E tests** — Supertest hits `POST /api/jobs` with a real small video, polls `GET /api/jobs/:id` until `COMPLETED` or `FAILED`, asserts the output file exists and is downloadable.

---

## 7. Edge Cases to Handle (this is what makes it "intermediate," not basic)

- Video with no speech → empty transcript, job still completes gracefully (no crash on empty segments).
- ffmpeg or Whisper crashes mid-job → job marked `FAILED` with a stored error message, never stuck in a processing state forever.
- Reject uploads that aren't valid video files, and enforce a max file size / duration.
- Concurrent jobs must not collide on temp file paths — always namespace temp files by job ID (e.g. `/tmp/{jobId}/audio.wav`).
- Clean up temp files (audio, intermediate srt) after a job completes or fails, so disk doesn't fill up.
- Worker crash/restart mid-job — decide and document behavior (e.g. mark stale in-progress jobs as `FAILED` on worker startup, or use BullMQ's built-in retry/stalled-job handling).

---

## 8. Suggested Build Order

1. Express app skeleton + file upload endpoint (store video, no processing yet).
2. `Job` entity + `JobStatus` enum + in-memory or Prisma-backed repository.
3. `FfmpegVideoProcessor.extractAudio` — get audio out of a video, verify manually.
4. `WhisperTranscriptionService.transcribe` — get a transcript from that audio, verify manually.
5. Convert transcript segments to a valid `.srt` file.
6. `FfmpegVideoProcessor.burnSubtitles` — burn that `.srt` into the video, verify manually by watching it.
7. Wire all of the above into `ProcessJob` use-case with fake implementations first (unit tests), then real ones (integration tests).
8. Add BullMQ queue + worker so `POST /api/jobs` returns immediately and processing happens async.
9. Add `GET /api/jobs/:id` polling endpoint.
10. Build the minimal frontend: upload form → poll status → show video preview + download link when done.
11. Add edge-case handling and E2E tests last, once the happy path works end-to-end.

---

## 9. Dependencies (npm)

```
express
multer
bullmq
ioredis
fluent-ffmpeg
nodejs-whisper
prisma
@prisma/client
uuid
jest
supertest
```

Plus `ffmpeg` installed on the system PATH, and a Whisper ggml model file downloaded locally.