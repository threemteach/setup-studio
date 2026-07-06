const variants = {
  navy: 'bg-navy text-white border border-navy shadow-[3px_3px_0_var(--red)] hover:shadow-[2px_2px_0_var(--red)]',
  red: 'bg-red text-white border border-red shadow-[3px_3px_0_var(--navy)] hover:shadow-[2px_2px_0_var(--navy)]',
}

export default function Button({ children, size = 'md', variant = 'navy', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-full font-semibold cursor-pointer select-none transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--navy)] active:scale-[0.97]'

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant] || variants.navy} hover:-translate-y-0.5 transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
