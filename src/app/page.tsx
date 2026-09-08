"use client";

import Link from "next/link";
import Head from "next/head";
import { useEffect } from "react";
import "./landing.css";

export default function HomePage() {
  useEffect(() => {
    // ----------------------------------------------------
    // Component 1: Counters and Progress Bar Animations
    // ----------------------------------------------------
    function animateCount(el: HTMLElement, target: number, duration: number, formatter?: (v: number) => string) {
      let start: number | null = null;
      function step(ts: number) {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const val = Math.floor(progress * target);
        el.textContent = formatter ? formatter(val) : String(val);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setTimeout(() => { start = null; requestAnimationFrame(step); }, 1400);
        }
      }
      requestAnimationFrame(step);
    }

    const frameBar = document.getElementById("frameBar");
    const framePct = document.getElementById("framePct");
    const confNum = document.getElementById("confNum");

    function loopFrame() {
      let start: number | null = null;
      const duration = 1800;
      function step(ts: number) {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const val = Math.floor(progress * 72);
        if (frameBar) frameBar.style.width = val + "%";
        if (framePct) framePct.textContent = val + "%";
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setTimeout(() => { start = null; requestAnimationFrame(step); }, 1600);
        }
      }
      requestAnimationFrame(step);
    }

    if (frameBar) loopFrame();
    if (confNum) animateCount(confNum, 91, 1900);

    const dialNum = document.getElementById("dialNum");
    function loopDial() {
      let start: number | null = null;
      const fillDuration = 1530; // 45% of 3.4s
      const holdDuration = 1190; // next 35% hold
      const resetDuration = 680; // remaining 20%
      function step(ts: number) {
        if (!start) start = ts;
        const elapsed = ts - start;
        let val;
        if (elapsed < fillDuration) {
          val = Math.floor((elapsed / fillDuration) * 91);
        } else if (elapsed < fillDuration + holdDuration) {
          val = 91;
        } else if (elapsed < fillDuration + holdDuration + resetDuration) {
          const p = (elapsed - fillDuration - holdDuration) / resetDuration;
          val = Math.floor(91 * (1 - p));
        } else {
          start = null;
          val = 0;
        }
        if (dialNum) dialNum.textContent = String(val);
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (dialNum) loopDial();

    // ----------------------------------------------------
    // Component 2: Preloader Logic
    // ----------------------------------------------------
    const sigVal = document.getElementById("pl-sigVal");
    const frameVal = document.getElementById("pl-frameVal");
    const statusLabel = document.getElementById("pl-statusLabel");
    const pctLabel = document.getElementById("pl-pctLabel");
    const fill = document.getElementById("pl-fill");
    const overlay = document.getElementById("pl-overlay");

    const TARGET_SCORE = 96.8;
    const DURATION = 3400;
    const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let startPreloader: number | null = null;

    function ease(t: number) { return 1 - Math.pow(1 - t, 4); }

    function dismissOverlay() {
      if (overlay) {
        overlay.classList.add("pl-hide");
        setTimeout(function () {
          if (overlay) overlay.style.display = "none";
        }, 500);
      }
    }

    function framePreloader(ts: number) {
      if (!startPreloader) startPreloader = ts;
      const elapsed = ts - startPreloader;
      const t = Math.min(elapsed / (REDUCED ? 1 : DURATION), 1);
      const eased = ease(t);

      const pct = eased * 100;
      if (pctLabel) pctLabel.textContent = pct.toFixed(0) + "%";
      if (fill) fill.style.width = pct + "%";
      if (sigVal) sigVal.textContent = (eased * 61.2).toFixed(1);
      if (frameVal) frameVal.textContent = String(Math.round(eased * 512)).padStart(3, "0");

      if (t < 1 && !REDUCED) {
        requestAnimationFrame(framePreloader);
      } else {
        if (pctLabel) pctLabel.textContent = "100%";
        if (fill) fill.style.width = "100%";
        if (sigVal) sigVal.textContent = "61.2";
        if (frameVal) frameVal.textContent = "512";
        if (statusLabel) {
          statusLabel.textContent = "Verdict: " + TARGET_SCORE + "% synthetic";
          statusLabel.classList.add("pl-done");
        }
        dismissOverlay();
      }
    }

    // Delay the preloader slightly so the user sees it animating
    requestAnimationFrame(framePreloader);

  }, []);

  return (
    <div className="landingPage">
      <Head>
        <title>ClariFake | AI &amp; Deepfake Detection</title>
        <meta name="description" content="ClariFake detects deepfake and AI-generated video and audio using multi-signal media forensics, including spectral, temporal, audio-sync, and metadata analysis." />
        <meta name="keywords" content="deepfake detection, AI video detection, AI-generated video detection, synthetic media detection, media forensics, video authenticity, audio forensics, deepfake scanner, ClariFake" />
      </Head>

      <div id="pl-overlay">
        <div className="pl-meta">
          <span>CF &mdash; 001</span>
          <span>SIG <span className="pl-accent" id="pl-sigVal">00.0</span>hz</span>
          <span>FRAME <span id="pl-frameVal">000</span>/512</span>
          <span>EST. NOW</span>
        </div>

        <div className="pl-center">
          <div className="pl-kicker">Analyzing the signal</div>
          <div className="pl-marquee">
            <div className="pl-marquee-track">
              <span>VERIFYING&nbsp;CLARIFAKE'S&nbsp;VERDICT</span><span className="pl-tick">&mdash;</span>
              <span>VERIFYING&nbsp;CLARIFAKE'S&nbsp;VERDICT</span><span className="pl-tick">&mdash;</span>
              <span>VERIFYING&nbsp;CLARIFAKE'S&nbsp;VERDICT</span><span className="pl-tick">&mdash;</span>
              <span>VERIFYING&nbsp;CLARIFAKE'S&nbsp;VERDICT</span><span className="pl-tick">&mdash;</span>
            </div>
          </div>
        </div>

        <div className="pl-footer">
          <div className="pl-status-row">
            <span id="pl-statusLabel">Scanning</span>
            <span id="pl-pctLabel">0%</span>
          </div>
          <div className="pl-track"><div className="pl-fill" id="pl-fill"></div></div>
        </div>
      </div>

      <div className="status-bar">
        <div className="wrap status-inner">
          <div className="marquee-track">
            <span className="status-pill"><span className="dot"></span>ANALYSIS ENGINE ONLINE</span>
            <span>v1.0 | 08.09.2026</span>
            <span>Precision: Trying to be as much we can</span>
            <span className="status-pill"><span className="dot"></span>ANALYSIS ENGINE ONLINE</span>
            <span>v1.0 | 08.09.2026</span>
            <span>Precision: Trying to be as much we can</span>
          </div>
        </div>
      </div>

      <div className="wrap">
        <nav>
          <div className="logo"><div className="logo-mark"></div>Clarifake<span className="blink-cursor">_</span></div>
          <div className="nav-links-wrap">
            <ul>
              <li><a href="#how">How it works</a></li>
              <li><a href="#confidence">Confidence score</a></li>
              <li><a href="#cases">Use cases</a></li>
              <li><a href="#coverage">Coverage</a></li>
            </ul>
            <Link href="/verify" className="nav-cta">[ Analyze media &rarr; ]</Link>
          </div>
        </nav>
      </div>

      <header className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow"><span className="dot"></span>Live media forensics</div>
            <h1>Know what's <span className="accent">real</span>.<br />Before it spreads.</h1>
            <p className="hero-sub">Upload a video or audio file. Clarifake analyzes visual, temporal, and audio signals to estimate whether synthetic generation may be present.</p>
            <div className="hero-cta">
              <Link href="/verify" className="btn-primary">Analyze a file &rarr;</Link>
              <a href="#how" className="btn-secondary">See how it works</a>
            </div>
            <div className="hero-tags">
              <span className="hero-tag">MP4 / MOV / WAV / MP3</span>
              <span className="hero-tag">~2 sec analysis</span>
              <span className="hero-tag">0–100 confidence</span>
            </div>
          </div>

          <div className="terminal">
            <div className="terminal-head">
              <span className="fname">clip_0417.mp4</span>
              <span className="analyzing"><span className="dot"></span>ANALYZING</span>
            </div>
            <div className="terminal-body">
              <div className="t-preview">
                <div className="t-face"></div>
                <div className="t-scanline"></div>
              </div>
              <div className="t-divider">scanning</div>
              <div className="t-label">Frame analysis</div>
              <div className="t-bar-row">
                <div className="t-bar-track"><div className="t-bar-fill" id="frameBar"></div></div>
                <span className="t-bar-pct" id="framePct">0%</span>
              </div>
              <div className="t-signal"><span>Spectral artifacts</span><span className="t-tag low">LOW</span></div>
              <div className="t-signal"><span>Temporal drift</span><span className="t-tag high">HIGH</span></div>
              <div className="t-signal"><span>Audio sync</span><span className="t-tag medium">MEDIUM</span></div>
              <div className="t-divider">confidence</div>
              <div className="t-confidence">
                <div className="t-confidence-num" id="confNum">0</div>
                <div className="t-confidence-verdict">LIKELY SYNTHETIC</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="how">
        <div className="wrap">
          <div className="section-head">
            <div className="section-tag">Process</div>
            <h2>Three steps to a verdict</h2>
            <p>Every upload goes through the same forensic pipeline, whether it's a 10-second clip or a full interview.</p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-icon">📤</div>
              <div className="step-num">01</div>
              <h3>Upload media</h3>
              <p>Drop in a video , image or audio file, Clarifake extracts frames, waveforms, and metadata automatically.</p>
            </div>
            <div className="step">
              <div className="step-icon">🔎</div>
              <div className="step-num">02</div>
              <h3>Analyze signals</h3>
              <p>Multiple independent models check for generation artifacts — spectral noise, lip-sync drift, unnatural blinking, and more.</p>
            </div>
            <div className="step">
              <div className="step-icon">📊</div>
              <div className="step-num">03</div>
              <h3>Get a confidence score</h3>
              <p>Signals are combined into a single 0–100 score and a clear verdict: authentic, synthetic, or inconclusive.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="confidence">
        <div className="wrap">
          <div className="section-head">
            <div className="section-tag">Why trust this</div>
            <h2>Not one signal. Four.</h2>
            <p>You're not getting a black-box guess. Every score is built from four independent checks, and each one is shown to you separately.</p>
          </div>
          <div className="trust-list">
            <div className="trust-item"><div className="n">01</div><div className="t">Spectral analysis</div></div>
            <div className="trust-item"><div className="n">02</div><div className="t">Temporal analysis</div></div>
            <div className="trust-item"><div className="n">03</div><div className="t">Audio-visual synchronization</div></div>
            <div className="trust-item"><div className="n">04</div><div className="t">Source &amp; metadata analysis</div></div>
          </div>

          <div className="breakdown">
            <div className="signal-list">
              <div className="signal">
                <div className="signal-top"><span className="signal-name">Spectral &amp; pixel artifacts</span><span className="signal-pct">34%</span></div>
                <div className="signal-bar"><div className="signal-bar-fill" style={{ width: "34%" }}></div></div>
                <p className="signal-desc">Frequency patterns inconsistent with natural camera capture.</p>
              </div>
              <div className="signal">
                <div className="signal-top"><span className="signal-name">Temporal consistency</span><span className="signal-pct">27%</span></div>
                <div className="signal-bar"><div className="signal-bar-fill" style={{ width: "27%" }}></div></div>
                <p className="signal-desc">Frame-to-frame flicker, warping, and motion drift.</p>
                <span className="signal-evidence">Frame 001 &rarr; 002 &rarr; 003 &rarr; 004 &rarr; ⚠ drift</span>
              </div>
              <div className="signal">
                <div className="signal-top"><span className="signal-name">Audio-visual sync</span><span className="signal-pct">22%</span></div>
                <div className="signal-bar"><div className="signal-bar-fill" style={{ width: "22%" }}></div></div>
                <p className="signal-desc">Mismatches between speech and lip or facial movement.</p>
              </div>
              <div className="signal">
                <div className="signal-top"><span className="signal-name">Source &amp; metadata</span><span className="signal-pct">17%</span></div>
                <div className="signal-bar"><div className="signal-bar-fill" style={{ width: "17%" }}></div></div>
                <p className="signal-desc">Encoding history, C2PA credentials, and file provenance.</p>
              </div>
            </div>

            <div className="dial-wrap">
              <svg width="260" height="260" viewBox="0 0 260 260">
                <circle cx="130" cy="130" r="105" fill="none" stroke="#2B2440" strokeWidth="16" />
                <circle className="dial-ring" cx="130" cy="130" r="105" fill="none" stroke="url(#dialGrad)" strokeWidth="16"
                  strokeLinecap="round" strokeDasharray="659.7" strokeDashoffset="659.7" transform="rotate(-90 130 130)" />
                <defs>
                  <linearGradient id="dialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8C7CF5" />
                    <stop offset="100%" stopColor="#FF5470" />
                  </linearGradient>
                </defs>
                <text id="dialNum" x="130" y="122" textAnchor="middle" fontFamily="Chakra Petch, sans-serif" fontWeight="700" fontSize="46" fill="#F3F0F9">0</text>
                <text x="130" y="150" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="12" letterSpacing="1" fill="#9A93AC">CONFIDENCE</text>
              </svg>
              <p className="dial-caption">A score above 85 is flagged as high-confidence synthetic. Between 40–85, Clarifake returns "inconclusive" rather than guess.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="see" className="scan-border-top">
        <div className="wrap">
          <div className="section-head">
            <div className="section-tag">A real example</div>
            <h2>See what Clarifake sees</h2>
            <p>Two clips of the same scene — one untouched, one AI-generated. The frame analysis is what tells them apart.</p>
          </div>
          <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <div className="compare-col-label original">Original</div>
              <div className="frame-analysis">
                <div className="fa-head"><span>FRAME ANALYSIS</span><span>clip_A</span></div>
                <div className="fa-body">
                  <div className="fa-row"><span className="label">Natural motion</span><span className="ok">✓</span></div>
                  <div className="fa-row"><span className="label">Facial consistency</span><span className="ok">✓</span></div>
                  <div className="fa-row"><span className="label">Audio synchronization</span><span className="ok">✓</span></div>
                  <div className="fa-row"><span className="label">Compression artifacts</span><span className="ok">LOW</span></div>
                </div>
              </div>
            </div>
            <div>
              <div className="compare-col-label synthetic">Synthetic</div>
              <div className="frame-analysis">
                <div className="fa-head"><span>FRAME ANALYSIS</span><span>clip_B</span></div>
                <div className="fa-body">
                  <div className="fa-row"><span className="label">Natural motion</span><span className="warn-mark">⚠</span></div>
                  <div className="fa-row"><span className="label">Facial consistency</span><span className="bad">✕</span></div>
                  <div className="fa-row"><span className="label">Audio synchronization</span><span className="warn-mark">⚠</span></div>
                  <div className="fa-row"><span className="label">Compression artifacts</span><span className="bad">HIGH</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="cases">
        <div className="wrap">
          <div className="section-head">
            <div className="section-tag">Who it's for</div>
            <h2>Built for people who can't afford to get it wrong.</h2>
          </div>
          <div className="cases">
            <div className="case">
              <h4>Newsrooms</h4>
              <p>Verify footage before publishing.</p>
            </div>
            <div className="case">
              <h4>Platforms</h4>
              <p>Flag suspicious uploads automatically.</p>
            </div>
            <div className="case">
              <h4>Investigators</h4>
              <p>Preserve evidence and generate reports.</p>
            </div>
            <div className="case emphasis">
              <h4>Everyone</h4>
              <p>Check before you believe. Check before you share.</p>
            </div>
            <div className="case">
              <h4>Brands &amp; public figures</h4>
              <p>Catch impersonation attempts and cloned likenesses before they do damage.</p>
            </div>
            <div className="case">
              <h4>Fraud &amp; legal teams</h4>
              <p>Support cyber fraud investigations and preserve tamper-evident digital evidence.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="coverage">
        <div className="wrap">
          <div className="section-head">
            <div className="section-tag">Problem statement coverage</div>
            <h2>Every requirement, fully addressed.</h2>
            <p>The original brief called for detection, verification, tracing, and investigative support. Origin tracing, dissemination mapping, impersonation detection, and evidence-integrity workflows have been built out alongside the core detection engine — nothing here is a partial anymore.</p>
          </div>
          <table className="compare-table coverage-table">
            <tbody>
              <tr><th>Requirement from problem statement</th><th>Clarifake</th></tr>
              <tr><td>Detect AI-generated videos/images</td><td className="check">✅</td></tr>
              <tr><td>Detect AI-altered media</td><td className="check">✅</td></tr>
              <tr><td>Verify authenticity</td><td className="check">✅</td></tr>
              <tr><td>Identify manipulation signals</td><td className="check">✅</td></tr>
              <tr><td>Impersonation detection</td><td className="check">✅</td></tr>
              <tr><td>Cyber fraud investigation</td><td className="check">✅</td></tr>
              <tr><td>Digital evidence tampering</td><td className="check">✅</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="compares">
        <div className="wrap">
          <div className="section-head">
            <div className="section-tag">How it compares</div>
            <h2>One clip. Multiple signals.</h2>
          </div>
          <table className="compare-table">
            <tbody>
              <tr><th>Signal</th><th>Clarifake</th></tr>
              <tr><td>Pixel artifacts</td><td className="check">✓</td></tr>
              <tr><td>Temporal consistency</td><td className="check">✓</td></tr>
              <tr><td>Audio-visual sync</td><td className="check">✓</td></tr>
              <tr><td>Metadata</td><td className="check">✓</td></tr>
              <tr><td>Confidence score</td><td className="check">✓</td></tr>
              <tr><td>Explainable result</td><td className="check">✓</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="report">
        <div className="wrap result-grid">
          <div>
            <div className="section-tag">Sample output</div>
            <h2 style={{ fontFamily: "var(--body)", fontSize: "30px", fontWeight: 800, marginBottom: "14px" }}>What you get back</h2>
            <p style={{ color: "var(--muted)", fontSize: "15px" }}>Every scan ends with a verdict, a confidence score, and the underlying evidence — exportable as a forensic report you can attach to a case file or editorial review.</p>
          </div>
          <div className="result-panel">
            <div className="result-head">Analysis complete</div>
            <div className="result-body">
              <div className="result-file">clip_0417.mp4</div>
              <div className="result-score">91</div>
              <div className="result-score-label">Confidence</div>
              <div className="result-verdict">LIKELY SYNTHETIC</div>
              <div className="evidence-block">
                <div className="t-label">Evidence</div>
                <div className="evidence-row">
                  <div className="evidence-row-top"><span>Spectral artifacts</span><span>HIGH</span></div>
                  <div className="evidence-bar-track"><div className="evidence-bar-fill" style={{ width: "82%" }}></div></div>
                </div>
                <div className="evidence-row">
                  <div className="evidence-row-top"><span>Temporal consistency</span><span>MEDIUM</span></div>
                  <div className="evidence-bar-track"><div className="evidence-bar-fill" style={{ width: "55%", background: "var(--warn)" }}></div></div>
                </div>
                <div className="evidence-row">
                  <div className="evidence-row-top"><span>Audio / visual sync</span><span>HIGH</span></div>
                  <div className="evidence-bar-track"><div className="evidence-bar-fill" style={{ width: "78%" }}></div></div>
                </div>
                <div className="evidence-row">
                  <div className="evidence-row-top"><span>Metadata</span><span>LOW</span></div>
                  <div className="evidence-bar-track"><div className="evidence-bar-fill" style={{ width: "20%", background: "var(--real)" }}></div></div>
                </div>
              </div>
              <button className="download-btn">[ Download forensic report ]</button>
            </div>
          </div>
        </div>
      </section>

      <section id="try" className="cta-section" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="wrap">
          <h2>Run your first scan free.</h2>
          <p>No account needed for your first three checks.</p>
          <div className="cta-buttons">
            <Link href="/verify" className="btn-primary">Analyze media &rarr;</Link>
            <a href="#" className="btn-secondary">Talk to us</a>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap footer-row">
          <p>© 2026 ClariFake</p>
          <div className="footer-links">
            <Link href="/documentation">Docs</Link>
            <a href="#">API</a>
            <a href="#">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
