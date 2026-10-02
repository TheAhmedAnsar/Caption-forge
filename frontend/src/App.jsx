import { useEffect, useRef, useState } from 'react';

const MAX_BYTES = 10 * 1024 * 1024;

const STYLE_PRESETS = [
  { id: 'bold-yellow', name: 'Bold Yellow', sample: 'Aa', className: 'signal' },
  { id: 'minimal-white', name: 'Minimal White', sample: 'Aa', className: 'clean' },
  { id: 'boxed-caption', name: 'Boxed Caption', sample: 'Aa', className: 'block' },
  { id: 'karaoke-pink', name: 'Karaoke Pink', sample: 'Aa', className: 'pop' },
  { id: 'cinematic', name: 'Cinematic', sample: 'Aa', className: 'cinema' },
  { id: 'neon-green', name: 'Neon Green', sample: 'Aa', className: 'voltage' },
];

const PROCESS_STEPS = [
  ['Listening', 'Extracting the audio track'],
  ['Writing', 'Transcribing every spoken word'],
  ['Styling', 'Setting your subtitle treatment'],
  ['Rendering', 'Burning captions into the video'],
];

function formatBytes(bytes) {
  if (!bytes) return '0 MB';
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function App() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragging, setDragging] = useState(false);
  const [styleId, setStyleId] = useState('bold-yellow');
  const [fontName, setFontName] = useState('Arial');
  const [fontSize, setFontSize] = useState(28);
  const [position, setPosition] = useState('bottom');
  const [textStyle, setTextStyle] = useState('bold');
  const [status, setStatus] = useState('idle');
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [outputUrl, setOutputUrl] = useState('');

  useEffect(() => {
    if (status !== 'processing') return undefined;
    const timers = [
      setTimeout(() => setStep(1), 6000),
      setTimeout(() => setStep(2), 16000),
      setTimeout(() => setStep(3), 26000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [status]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function chooseFile(nextFile) {
    setError('');
    setOutputUrl('');
    setStatus('idle');
    if (!nextFile) return;
    if (nextFile.type !== 'video/mp4') {
      setError('Please choose an MP4 video.');
      return;
    }
    if (nextFile.size > MAX_BYTES) {
      setError('That video is over the 10 MB upload limit.');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      setError('Add an MP4 video before starting the render.');
      return;
    }

    const data = new FormData();
    data.append('file', file);
    data.append('styleId', styleId);
    data.append('fontName', fontName);
    data.append('fontSize', String(fontSize));
    data.append('position', position);
    data.append('textStyle', textStyle);

    setStatus('processing');
    setStep(0);
    setError('');
    setOutputUrl('');

    try {
      const response = await fetch('/api/jobs', { method: 'POST', body: data });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || 'The video could not be processed.');
      setOutputUrl(payload.data?.outputUrl || '');
      setStep(4);
      setStatus('complete');
    } catch (requestError) {
      setError(requestError.message || 'Something interrupted the render. Please try again.');
      setStatus('error');
    }
  }

  function resetProject() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl('');
    setOutputUrl('');
    setStatus('idle');
    setStep(0);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  }

  const activePreset = STYLE_PRESETS.find((preset) => preset.id === styleId);
  const captionClass = `stage-caption ${activePreset?.className || 'signal'} ${textStyle} ${position}`;
  const captionPosition = position === 'top'
    ? { top: '8%' }
    : position === 'center'
      ? { top: '50%' }
      : { bottom: '8%' };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Caption Forge home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>CAPTION<br />FORGE</span>
        </a>
        <div className="header-note">
          <span className="live-dot" /> Local AI studio
        </div>
        <a className="source-link" href="https://github.com/ChetanXpro/nodejs-whisper" target="_blank" rel="noreferrer">
          Powered by local Whisper <ArrowIcon />
        </a>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span>01</span> Video to caption</div>
        <h1>MAKE EVERY<br /><em>WORD</em> LAND.</h1>
        <p>Upload an MP4, choose a caption style, and let local AI turn every spoken word into subtitles—right on your machine.</p>
        <div className="hero-stamp" aria-hidden="true">NO CLOUD<br />NO WAITLIST<br />YOUR VIDEO</div>
      </section>

      <form className="studio" onSubmit={handleSubmit}>
        <section className="workbench">
          <div className="section-label"><span>01</span> Your footage</div>
          {!file ? (
            <button
              className={`dropzone ${dragging ? 'dragging' : ''}`}
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                chooseFile(event.dataTransfer.files[0]);
              }}
            >
              <UploadIcon />
              <strong>DROP THE CLIP</strong>
              <span>or click to find it</span>
              <small>MP4 · MAX 10 MB</small>
            </button>
          ) : (
            <div className="video-stage">
              <video src={previewUrl} controls playsInline />
              <div
                className={captionClass}
                style={{
                  fontFamily: fontName,
                  fontSize: `${Math.max(13, Number(fontSize) * 0.66)}px`,
                  ...captionPosition,
                }}
              >
                Every word should land.
              </div>
              <div className="stage-tag">LIVE STYLE PREVIEW</div>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,.mp4"
            hidden
            onChange={(event) => chooseFile(event.target.files[0])}
          />

          {file && (
            <div className="file-strip">
              <div className="file-icon">MP4</div>
              <div><strong>{file.name}</strong><span>{formatBytes(file.size)} · Ready to caption</span></div>
              <button type="button" onClick={resetProject} aria-label="Remove video">×</button>
            </div>
          )}

          <div className="privacy-note">
            <LockIcon />
            <p><strong>Your footage stays yours.</strong><br />Processed on your machine, never sent to a third-party transcription API.</p>
          </div>
        </section>

        <section className="controls-panel">
          <div className="section-label"><span>02</span> Direct the captions</div>

          <fieldset>
            <legend>CHOOSE A CAPTION STYLE</legend>
            <div className="preset-grid">
              {STYLE_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  className={`preset-card ${styleId === preset.id ? 'selected' : ''}`}
                  onClick={() => setStyleId(preset.id)}
                  aria-pressed={styleId === preset.id}
                >
                  <span className={`preset-sample ${preset.className}`}>{preset.sample}</span>
                  <span>{preset.name}</span>
                  {styleId === preset.id && <CheckIcon />}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="control-row">
            <label>
              TYPEFACE
              <select value={fontName} onChange={(event) => setFontName(event.target.value)}>
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Georgia">Georgia</option>
                <option value="Courier New">Courier</option>
                <option value="Verdana">Verdana</option>
              </select>
            </label>
            <label>
              SIZE <output>{fontSize}px</output>
              <input type="range" min="18" max="54" value={fontSize} onChange={(event) => setFontSize(event.target.value)} />
            </label>
          </div>

          <div className="control-row compact">
            <fieldset>
              <legend>WEIGHT</legend>
              <div className="segmented four">
                {[
                  ['normal', 'Regular'], ['bold', 'Bold'], ['italic', 'Italic'], ['bold-italic', 'B + I'],
                ].map(([value, label]) => (
                  <button type="button" key={value} className={textStyle === value ? 'active' : ''} onClick={() => setTextStyle(value)}>{label}</button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>POSITION</legend>
              <div className="segmented">
                {['top', 'center', 'bottom'].map((value) => (
                  <button type="button" key={value} className={position === value ? 'active' : ''} onClick={() => setPosition(value)}>{value}</button>
                ))}
              </div>
            </fieldset>
          </div>

          <button className="render-button" type="submit" disabled={status === 'processing'}>
            {status === 'processing' ? 'FORGING CAPTIONS…' : 'FORGE MY VIDEO'}
            <span><ArrowIcon /></span>
          </button>
          <p className="button-note">Rendering time depends on clip length and your machine.</p>
        </section>
      </form>

      {error && <div className="error-banner" role="alert"><strong>Render interrupted.</strong> {error}</div>}

      {status === 'processing' && (
        <section className="process-card" aria-live="polite">
          <div className="process-orbit"><span>{String(step + 1).padStart(2, '0')}</span></div>
          <div className="process-copy">
            <div className="section-label inverse"><span>03</span> In the forge</div>
            <h2>{PROCESS_STEPS[step]?.[0] || 'Rendering'}<i>...</i></h2>
            <p>{PROCESS_STEPS[step]?.[1] || 'Finishing your video'}</p>
            <div className="step-track">
              {PROCESS_STEPS.map(([name], index) => (
                <div key={name} className={index <= step ? 'done' : ''}><span />{name}</div>
              ))}
            </div>
          </div>
        </section>
      )}

      {status === 'complete' && outputUrl && (
        <section className="result-card">
          <div className="result-copy">
            <div className="section-label"><span>03</span> Fresh from the forge</div>
            <h2>YOUR WORDS<br /><em>HAVE WEIGHT.</em></h2>
            <p>The captions are burned in and ready to travel anywhere your video does.</p>
            <div className="result-actions">
              <a className="download-button" href={outputUrl} download>DOWNLOAD MP4 <DownloadIcon /></a>
              <button type="button" onClick={resetProject}>START ANOTHER</button>
            </div>
          </div>
          <div className="result-media">
            <div className="result-media-label"><span>READY</span> Captioned master</div>
            <video className="result-video" src={outputUrl} controls playsInline />
          </div>
        </section>
      )}

      <footer>
        <span>CAPTION FORGE / 2026</span>
        <p>Built for creators who care how the words feel.</p>
        <span>WHISPER + FFMPEG</span>
      </footer>
    </main>
  );
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

function UploadIcon() {
  return <svg className="upload-icon" viewBox="0 0 80 80" aria-hidden="true"><path d="M40 57V18m0 0L25 33m15-15 15 15M16 51v12h48V51" /><circle cx="40" cy="40" r="36" /></svg>;
}

function LockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
}

function CheckIcon() {
  return <svg className="check-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>;
}

function DownloadIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 5-5m-5 5-5-5M4 20h16" /></svg>;
}

export default App;
