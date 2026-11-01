"use client";

import Link from "next/link";
import Head from "next/head";
import { useEffect } from "react";
import { UploadCloud, Search, FileCheck, FileImage, FileAudio, Download } from "lucide-react";
import "./landing.css";

export default function HomePage() {
  useEffect(() => {
    const frames = new Set<number>();
    const timers = new Set<number>();
    function requestAnimationFrame(callback: FrameRequestCallback) {
      const id = window.requestAnimationFrame(time => { frames.delete(id); callback(time); });
      frames.add(id); return id;
    }
    function setTimeout(callback: () => void, delay: number) {
      const id = window.setTimeout(() => { timers.delete(id); callback(); }, delay);
      timers.add(id); return id;
    }
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

    const DURATION = 650;
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
          statusLabel.textContent = "Workspace ready";
          statusLabel.classList.add("pl-done");
        }
        dismissOverlay();
      }
    }

    // Delay the preloader slightly so the user sees it animating
    requestAnimationFrame(framePreloader);
    return () => { frames.forEach(id => window.cancelAnimationFrame(id)); timers.forEach(id => window.clearTimeout(id)); };
  }, []);

  return (
    <div className="landingPage">
      <Head>
        <title>DeepTruth | AI &amp; Deepfake Detection</title>
        <meta name="description" content="DeepTruth checks images and sampled video frames for AI-generation and facial manipulation, with confidence scores, evidence, source context, and limitations." />
        <meta name="keywords" content="deepfake detection, AI video detection, AI-generated video detection, synthetic media detection, media forensics, video authenticity, audio forensics, deepfake scanner, DeepTruth" />
      </Head>

      <div id="pl-overlay">
        <div className="pl-meta">
          <span>DEEPTRUTH</span>
          <span className="pl-accent">Media verification</span>
          <span>Images / video / audio</span>
          <span>EST. NOW</span>
        </div>

        <div className="pl-center">
          <div className="pl-kicker">Preparing your workspace</div>
          <div className="pl-marquee">
            <div className="pl-marquee-track">
              <span>CHECK&nbsp;BEFORE&nbsp;YOU&nbsp;SHARE</span><span className="pl-tick">&mdash;</span>
              <span>CHECK&nbsp;BEFORE&nbsp;YOU&nbsp;SHARE</span><span className="pl-tick">&mdash;</span>
              <span>CHECK&nbsp;BEFORE&nbsp;YOU&nbsp;SHARE</span><span className="pl-tick">&mdash;</span>
              <span>CHECK&nbsp;BEFORE&nbsp;YOU&nbsp;SHARE</span><span className="pl-tick">&mdash;</span>
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
            <span className="status-pill"><span className="dot"></span>MEDIA VERIFICATION</span>
            <span>Images / video / audio</span>
            <span>Signals, evidence &amp; uncertainty</span>
            <span className="status-pill"><span className="dot"></span>MEDIA VERIFICATION</span>
            <span>Images / video / audio</span>
            <span>Signals, evidence &amp; uncertainty</span>
          </div>
        </div>
      </div>

      <div className="wrap">
        <nav>
          <div className="logo"><div className="logo-mark"></div>DeepTruth<span className="blink-cursor">_</span></div>
          <div className="nav-links-wrap">
            <ul>
              <li><a href="#how">How it works</a></li>
              <li><a href="#confidence">Confidence score</a></li>
              <li><a href="#cases">Use cases</a></li>
              <li><a href="#coverage">Coverage</a></li>
            </ul>
            <Link href="/verify" className="nav-cta">Start verification &rarr;</Link>
          </div>
        </nav>
      </div>

      <header className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow"><span className="dot"></span>A closer look at digital media</div>
            <h1>Look closer.<br />Share <span className="accent">smarter.</span></h1>
            <p className="hero-sub">A second look before your next share. Check images, sampled video frames and spoken audio for manipulation signals—with evidence you can review.</p>
            <div className="hero-cta">
              <Link href="/verify" className="btn-primary">Start verification &rarr;</Link>
              <a href="#how" className="btn-secondary">See how it works</a>
            </div>
            <div className="hero-tags">
              <span className="hero-tag"><FileImage size={14} aria-hidden="true" /> Images &amp; video</span>
              <span className="hero-tag"><FileAudio size={14} aria-hidden="true" /> Spoken audio</span>
              <span className="hero-tag"><Download size={14} aria-hidden="true" /> Evidence PDF</span>
            </div>
          </div>

          <div className="terminal">
            <div className="terminal-head">
              <span className="fname">clip_0417.mp4</span>
              <span className="analyzing"><span className="dot"></span>ILLUSTRATIVE DEMO</span>
            </div>
            <div className="terminal-body">
              <div className="t-preview">
                <img className="t-face-mesh" src="/face-mesh.svg" alt="Illustrative polygonal face mesh" />
                <div className="t-scanline"></div>
              </div>
              <div className="t-divider">scanning</div>
              <div className="t-label">Frame analysis</div>
              <div className="t-bar-row">
                <div className="t-bar-track"><div className="t-bar-fill" id="frameBar"></div></div>
                <span className="t-bar-pct" id="framePct">0%</span>
              </div>
              <div className="t-signal"><span>AI-generation signal</span><span className="t-tag low">LOW</span></div>
              <div className="t-signal"><span>Face-manipulation signal</span><span className="t-tag high">HIGH</span></div>
              <div className="t-signal"><span>Image quality</span><span className="t-tag medium">MEDIUM</span></div>
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
            <h2>From upload to a clearer picture</h2>
            <p>Choose your media, review the returned signals, and keep the evidence. Uncertain results stay clearly marked.</p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-icon"><UploadCloud aria-hidden="true" /></div>
              <div className="step-num">01</div>
              <h3>Upload media</h3>
              <p>Choose an image, video or a 2–30 second speech clip. You can also capture a photo using your camera.</p>
            </div>
            <div className="step">
              <div className="step-icon"><Search aria-hidden="true" /></div>
              <div className="step-num">02</div>
              <h3>Analyze signals</h3>
              <p>Visual models check AI-generation and facial-manipulation signals. Spoken audio is checked locally, with speech and quality screening.</p>
            </div>
            <div className="step">
              <div className="step-icon"><FileCheck aria-hidden="true" /></div>
              <div className="step-num">03</div>
              <h3>Review your evidence</h3>
              <p>Review scores, sample evidence and limitations. Download a PDF to support further investigation.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="confidence">
        <div className="wrap">
          <div className="section-head">
            <div className="section-tag">Why trust this</div>
            <h2>Detection plus inspectable context.</h2>
            <p>The report separates model confidence, image quality, and source context. Illustrations below are interface examples, not live results or score weights.</p>
          </div>
          <div className="trust-list">
            <div className="trust-item"><div className="n">01</div><div className="t">AI-generation confidence</div></div>
            <div className="trust-item"><div className="n">02</div><div className="t">Face-manipulation confidence</div></div>
            <div className="trust-item"><div className="n">03</div><div className="t">Image-quality warnings</div></div>
            <div className="trust-item"><div className="n">04</div><div className="t">OCR &amp; source context</div></div>
          </div>

          <div className="breakdown">
            <div className="signal-list">
              <div className="signal">
                <div className="signal-top"><span className="signal-name">AI-generation signal</span><span className="signal-pct">34%</span></div>
                <div className="signal-bar"><div className="signal-bar-fill" style={{ width: "34%" }}></div></div>
                <p className="signal-desc">Model output for fully synthetic imagery; no pixel-level heatmap is returned.</p>
              </div>
              <div className="signal">
                <div className="signal-top"><span className="signal-name">Face-manipulation signal</span><span className="signal-pct">27%</span></div>
                <div className="signal-bar"><div className="signal-bar-fill" style={{ width: "27%" }}></div></div>
                <p className="signal-desc">Model output for identity-level face swaps in photographic imagery.</p>
                <span className="signal-evidence">Frame at 15% &rarr; 50% &rarr; 85%</span>
              </div>
              <div className="signal">
                <div className="signal-top"><span className="signal-name">Image-quality checks</span><span className="signal-pct">22%</span></div>
                <div className="signal-bar"><div className="signal-bar-fill" style={{ width: "22%" }}></div></div>
                <p className="signal-desc">Resolution and low-detail heuristics highlight samples needing caution.</p>
              </div>
              <div className="signal">
                <div className="signal-top"><span className="signal-name">Source &amp; metadata</span><span className="signal-pct">17%</span></div>
                <div className="signal-bar"><div className="signal-bar-fill" style={{ width: "17%" }}></div></div>
                <p className="signal-desc">OCR and reverse-image matches provide context, not proof of origin.</p>
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
              <p className="dial-caption">Prototype thresholds: ≤20 low signal, ≥80 high signal. Intermediate scores, quality warnings, or missing model outputs are inconclusive. The headline is the maximum model signal, not a joint probability.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="see" className="scan-border-top">
        <div className="wrap">
          <div className="section-head">
            <div className="section-tag">Illustrative comparison</div>
            <h2>See what DeepTruth sees</h2>
            <p>These mock cards illustrate a review workflow. Run an upload for actual model scores, sampled images, and availability.</p>
          </div>
          <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <div className="compare-col-label original">Original</div>
              <div className="frame-analysis">
                <div className="fa-head"><span>FRAME ANALYSIS</span><span>clip_A</span></div>
                <div className="fa-body">
                  <div className="fa-row"><span className="label">Visual samples</span><span className="ok">✓</span></div>
                  <div className="fa-row"><span className="label">Face-manipulation model</span><span className="ok">✓</span></div>
                  <div className="fa-row"><span className="label">Sample timestamps</span><span className="ok">✓</span></div>
                  <div className="fa-row"><span className="label">Quality concerns</span><span className="ok">LOW</span></div>
                </div>
              </div>
            </div>
            <div>
              <div className="compare-col-label synthetic">Synthetic</div>
              <div className="frame-analysis">
                <div className="fa-head"><span>FRAME ANALYSIS</span><span>clip_B</span></div>
                <div className="fa-body">
                  <div className="fa-row"><span className="label">Visual samples</span><span className="warn-mark">⚠</span></div>
                  <div className="fa-row"><span className="label">Face-manipulation model</span><span className="bad">✕</span></div>
                  <div className="fa-row"><span className="label">Sample timestamps</span><span className="warn-mark">⚠</span></div>
                  <div className="fa-row"><span className="label">Quality concerns</span><span className="bad">HIGH</span></div>
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
              <p>Investigate suspicious footage before publishing.</p>
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
              <p>Review facial manipulation signals; this tool does not identify the person or establish impersonation.</p>
            </div>
            <div className="case">
              <h4>Fraud &amp; legal teams</h4>
              <p>Export model outputs and file hashes to support further review; this is not a forensic certification.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="coverage">
        <div className="wrap">
          <div className="section-head">
            <div className="section-tag">Problem statement coverage</div>
            <h2>Scope of this prototype.</h2>
            <p>DeepTruth asks for media analysis, confidence, supporting evidence, and limitations. This prototype checks images, sampled video frames and spoken audio. Results are indicators for review, not a guarantee of authenticity.</p>
          </div>
          <table className="compare-table coverage-table">
            <tbody>
              <tr><th>Requirement from problem statement</th><th>DeepTruth</th></tr>
              <tr><td>AI-generated images / sampled frames</td><td className="check">✅</td></tr>
              <tr><td>Identity-level face-manipulation signals</td><td className="check">✅</td></tr>
              <tr><td>Local synthetic-speech detection</td><td className="check">✅</td></tr>
              <tr><td>Task-specific confidence scores</td><td className="check">✅</td></tr>
              <tr><td>Visible samples and model outputs</td><td className="check">✅</td></tr>
              <tr><td>Visible limitations and uncertainty</td><td className="check">✅</td></tr>
              <tr><td>OCR and reverse-image context</td><td className="check">✅</td></tr>
              <tr><td>SHA-256 sample fingerprints</td><td className="check">✅</td></tr>
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
              <tr><th>Signal</th><th>DeepTruth</th></tr>
              <tr><td>AI-generation model</td><td className="check">✓</td></tr>
              <tr><td>Face-manipulation signal</td><td className="check">✓</td></tr>
              <tr><td>Image-quality checks</td><td className="check">✓</td></tr>
              <tr><td>Sample dimensions and hashes</td><td className="check">✓</td></tr>
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
            <p style={{ color: "var(--muted)", fontSize: "15px" }}>Completed analyses provide model outputs, sample evidence, context, and limitations in a downloadable PDF report. This card is illustrative; use the result-page download for real evidence.</p>
          </div>
          <div className="result-panel">
            <div className="result-head">Illustrative output — not a real scan</div>
            <div className="result-body">
              <div className="result-file">clip_0417.mp4</div>
              <div className="result-score">91</div>
              <div className="result-score-label">Confidence</div>
              <div className="result-verdict">LIKELY SYNTHETIC</div>
              <div className="evidence-block">
                <div className="t-label">Evidence</div>
                <div className="evidence-row">
                  <div className="evidence-row-top"><span>AI-generation signal</span><span>HIGH</span></div>
                  <div className="evidence-bar-track"><div className="evidence-bar-fill" style={{ width: "82%" }}></div></div>
                </div>
                <div className="evidence-row">
                  <div className="evidence-row-top"><span>Face-manipulation signal</span><span>MEDIUM</span></div>
                  <div className="evidence-bar-track"><div className="evidence-bar-fill" style={{ width: "55%", background: "var(--warn)" }}></div></div>
                </div>
                <div className="evidence-row">
                  <div className="evidence-row-top"><span>Quality warning</span><span>HIGH</span></div>
                  <div className="evidence-bar-track"><div className="evidence-bar-fill" style={{ width: "78%" }}></div></div>
                </div>
                <div className="evidence-row">
                  <div className="evidence-row-top"><span>Metadata</span><span>LOW</span></div>
                  <div className="evidence-bar-track"><div className="evidence-bar-fill" style={{ width: "20%", background: "var(--real)" }}></div></div>
                </div>
              </div>
              <button className="download-btn" onClick={() => window.location.assign("/verify")}>[ Run analysis for a real report ]</button>
            </div>
          </div>
        </div>
      </section>

      <section id="try" className="cta-section" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="wrap">
          <h2>Run a media assessment.</h2>
          <p>Start with a file. Leave with clearer signals, supporting evidence and an explanation of the result.</p>
          <div className="cta-buttons">
            <Link href="/verify" className="btn-primary">Analyze media &rarr;</Link>
            <Link href="/technology" className="btn-secondary">Explore the technology</Link>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap footer-row">
          <p>© 2026 DeepTruth</p>
          <div className="footer-links">
            <Link href="/how-it-works">How it works</Link>
            <Link href="/technology">Technology</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
