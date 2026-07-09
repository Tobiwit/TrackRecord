import { Butterfly, MoonFace, Sprig, SunFace } from "./Ornaments";

/**
 * Faint calligraphy and ink drawings scattered across the desk, behind all
 * content. Fixed and non-interactive; sits between the body background and
 * the page (negative z-index paints above the canvas background).
 */
export function DeskScribbles() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      {/* calligraphy */}
      <p className="absolute top-[6%] right-[4%] font-hand text-3xl text-sepia/40 rotate-[-7deg]">
        drop the needle
      </p>
      <p className="absolute top-[38%] left-[2%] font-hand text-2xl text-sepia/35 rotate-[-90deg] origin-left hidden md:block">
        it will save your soul
      </p>
      <p className="absolute bottom-[22%] right-[8%] font-hand text-2xl text-sepia/35 rotate-[4deg] hidden sm:block">
        the lore will haunt you ♪
      </p>
      <p className="absolute bottom-[5%] left-[30%] font-hand text-3xl text-sepia/40 rotate-[-3deg]">
        much love, x
      </p>

      {/* ink drawings */}
      <span className="absolute top-[12%] left-[38%] text-ink/12 rotate-[10deg]">
        <SunFace className="w-24 h-24" />
      </span>
      <span className="absolute top-[55%] right-[3%] text-ink/12 rotate-[-12deg] hidden sm:block">
        <MoonFace className="w-20 h-20" />
      </span>
      <span className="absolute bottom-[8%] right-[28%] text-ink/12 rotate-[6deg]">
        <Butterfly className="w-16 h-16" />
      </span>
      <span className="absolute top-[70%] left-[6%] text-ink/12 rotate-[18deg] hidden md:block">
        <Sprig className="w-12 h-20" />
      </span>
      <span className="absolute top-[25%] right-[22%] text-ink/10 rotate-[-20deg] hidden lg:block">
        <Sprig className="w-9 h-16" />
      </span>
    </div>
  );
}
