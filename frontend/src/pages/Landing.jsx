import { Link } from "react-router-dom";
import { ShieldCheck, Share2, FileSearch, Network } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink-900 text-paper-100 flex flex-col">
      <header className="border-b border-ink-600">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded border border-amber/60 flex items-center justify-center">
              <ShieldCheck size={16} className="text-amber" />
            </div>
            <span className="font-mono text-sm tracking-widest">CRIMENET</span>
          </div>
          <Link
            to="/login"
            className="font-mono text-xs tracking-widest uppercase px-4 py-2 border border-paper-500/40 rounded hover:border-amber hover:text-amber transition-colors"
          >
            Investigator Login →
          </Link>
        </div>
      </header>

      <section className="flex-1 max-w-6xl mx-auto px-8 py-20 w-full">
        <div className="font-mono text-xs tracking-[0.3em] text-amber mb-6">SIH26189 · AI-POWERED CRIMINAL NETWORK ANALYSIS</div>
        <h1 className="text-5xl font-semibold leading-tight max-w-3xl mb-6">
          Case reports don't talk to each other.
          <br />
          <span className="text-paper-500">This system does.</span>
        </h1>
        <p className="text-paper-300 max-w-xl text-lg leading-relaxed mb-10">
          Individually, case reports look unrelated. CrimeNet extracts people, places,
          organizations, phone numbers and accounts from each report, and surfaces
          the connections between cases that a single investigator working alone would
          likely miss — for review, never for verdicts.
        </p>
        <Link
          to="/login"
          className="inline-block font-mono text-sm tracking-widest uppercase px-6 py-3 bg-amber text-ink-950 rounded font-semibold hover:bg-amber/90 transition-colors"
        >
          Access Analyst Console
        </Link>

        <div className="grid grid-cols-3 gap-6 mt-24">
          <FeatureCard
            icon={FileSearch}
            title="Extract"
            desc="NLP pipeline reads uploaded case reports (PDF, text, CSV) and pulls out named entities — people, orgs, locations, phone numbers, accounts."
          />
          <FeatureCard
            icon={Network}
            title="Connect"
            desc="Entities that co-occur are linked. Entities repeating across separate cases are flagged automatically for investigator attention."
          />
          <FeatureCard
            icon={Share2}
            title="Visualize"
            desc="An interactive network graph shows how cases, people and places relate — searchable, filterable, and grounded in the source text."
          />
        </div>

        <div className="mt-20 border border-ink-600 rounded-lg p-6 bg-ink-800/50">
          <div className="font-mono text-[10px] tracking-widest text-paper-500 uppercase mb-2">Important note</div>
          <p className="text-paper-300 text-sm leading-relaxed">
            CrimeNet identifies relationships, repeated entities and patterns for a human
            investigator to review. It does not, and is not designed to, automatically
            declare any individual a suspect or criminal. All demonstration data on this
            instance is synthetic.
          </p>
        </div>
      </section>

      <footer className="border-t border-ink-600 py-6">
        <div className="max-w-6xl mx-auto px-8 font-mono text-[10px] tracking-widest text-paper-500 uppercase">
          Prototype build · Smart India Hackathon 2026 · Synthetic demonstration data only
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="border border-ink-600 rounded-lg p-6 hover:border-amber/40 transition-colors">
      <Icon size={20} className="text-amber mb-4" />
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-paper-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
