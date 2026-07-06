import Reveal from "./Reveal"

export default function SectionHeader({ label, title, subtitle, dark }) {
  return (
    <div className="flex flex-col items-center text-center mb-[clamp(1.5rem,4vw,3.5rem)]">
      <Reveal>
        <div className="flex items-center justify-center w-full mb-4 px-0">
          <div className="flex items-center min-w-0 shrink">
            <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
              <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
            </svg>
            <span className="block w-[clamp(1.5rem,12vw,16rem)] h-[2px] bg-red" />
          </div>
          <h2 className={`${dark ? 'text-white' : 'text-navy'} text-[clamp(1.3rem,4.5vw,3.5rem)] font-bold leading-tight m-0 px-[clamp(0.4rem,2vw,1.5rem)] whitespace-nowrap`}>
            {title}
          </h2>
          <div className="flex items-center min-w-0 shrink">
            <span className="block w-[clamp(1.5rem,12vw,16rem)] h-[2px] bg-red" />
            <svg className="w-[clamp(0.4rem,0.9vw,0.8rem)] h-[clamp(0.4rem,0.9vw,0.8rem)] text-red shrink-0" viewBox="0 0 13 13" fill="currentColor">
              <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" />
            </svg>
          </div>
        </div>
      </Reveal>
      {subtitle && (
        <Reveal delay={0.1}>
          <p className={`${dark ? 'text-white/60' : 'text-navy'} font-medium text-[clamp(0.7rem,1.1vw,0.95rem)] max-w-[36rem] mx-auto leading-relaxed tracking-wide`}>
            {subtitle}
          </p>
        </Reveal>
      )}
      {label && (
        <Reveal delay={0.1}>
          <span className="section-label">{label}</span>
        </Reveal>
      )}
    </div>
  )
}
