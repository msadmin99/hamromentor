import Image from "next/image";

export default function Logo({ size = 32, showWordmark = true }) {
  return (
    <div className="flex items-center gap-2">
      <Image src="/logo.png" alt="Dr. Gutka" width={size} height={size} priority className="rounded-full" />
      {showWordmark && (
        <span className="text-lg font-extrabold uppercase tracking-wide text-[var(--color-marketing-accent)]">
          <span className="border-b-[3px] border-[var(--color-marketing-accent)]">Dr</span>. Gutka
        </span>
      )}
    </div>
  );
}
