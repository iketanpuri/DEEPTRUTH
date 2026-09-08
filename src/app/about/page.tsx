export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-section">
      
      {/* Hero */}
      <div className="mb-12 sm:mb-16 md:mb-24">
        <h1 className="text-fluid-display font-bold tracking-tight mb-6 sm:mb-8 leading-tight">
          Building trust in a synthetic world.
        </h1>
      </div>

      <div className="space-y-12 sm:space-y-16 md:space-y-20 text-base sm:text-lg text-foreground/80 leading-relaxed font-medium">
        
        <section>
          <div className="text-xs font-bold tracking-widest text-accent mb-3 sm:mb-4">THE PROBLEM</div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Synthetic media is becoming easier to create.</h2>
          <p className="mb-3 sm:mb-4">
            Generative AI has democratized creativity, but it has also democratized deception. High-fidelity deepfakes, synthetic voice clones, and AI-generated text are now indistinguishable from reality to the naked eye and ear.
          </p>
          <p>
            As a result, the default state of the internet is shifting from &ldquo;trust by default&rdquo; to &ldquo;zero trust.&rdquo;
          </p>
        </section>

        <section>
          <div className="text-xs font-bold tracking-widest text-accent mb-3 sm:mb-4">THE IDEA</div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Verification needs to become easier too.</h2>
          <p className="mb-3 sm:mb-4">
            If it takes five seconds to generate a deepfake, it shouldn&apos;t take a forensics lab five days to debunk it. We need scalable, accessible tools that can analyze digital content at the speed of the internet.
          </p>
          <p>
            Clarifake was built to provide professional-grade multi-signal forensic analysis to anyone who needs to answer a simple question: <em>Is this real?</em>
          </p>
        </section>

        <section>
          <div className="text-xs font-bold tracking-widest text-accent mb-3 sm:mb-4">THE PRINCIPLE</div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Verification tools should not become surveillance systems.</h2>
          <p className="mb-3 sm:mb-4">
            Many existing security and verification platforms operate on a data-harvesting model. They keep what you upload, tying it to your identity, building profiles, and training future models on your private data.
          </p>
          <p>
            We believe you shouldn&apos;t have to surrender your privacy to establish the truth. Clarifake is designed from the ground up to be stateless. We analyze the content, provide the verdict, and immediately discard the data.
          </p>
        </section>

        <section>
          <div className="text-xs font-bold tracking-widest text-accent mb-3 sm:mb-4">THE FUTURE</div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">A verifiable web.</h2>
          <p className="mb-3 sm:mb-4">
            We envision a future where digital provenance (like C2PA) and advanced forensic detection work hand-in-hand. Where platforms, journalists, and everyday users have the tools they need to navigate a synthetic world with confidence.
          </p>
        </section>

      </div>
    </div>
  );
}
