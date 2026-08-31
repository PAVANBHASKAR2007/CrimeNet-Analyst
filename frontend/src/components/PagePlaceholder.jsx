import { Construction } from "lucide-react";

export default function PagePlaceholder({ eyebrow, title, note }) {
  return (
    <div>
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-widest text-paper-500 uppercase mb-1">{eyebrow}</div>
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
      <div className="border border-ink-600 rounded-lg p-10 flex flex-col items-center text-center gap-3 bg-ink-800/30">
        <Construction size={22} className="text-amber" />
        <div className="text-paper-300 text-sm max-w-md">{note}</div>
      </div>
    </div>
  );
}
