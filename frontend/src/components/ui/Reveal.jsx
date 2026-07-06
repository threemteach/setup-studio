import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const variants = {
  fadeUp: { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } } },
  fadeIn: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } } },
  scale: { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } } },
}

export default function Reveal({ children, variant = 'fadeUp', delay = 0, className = '', style = {}, once = true, margin: rootMargin = '-80px' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, margin: rootMargin })
  const v = variants[variant] || variants.fadeUp

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={v}
      transition={{ ...v.visible.transition, delay }}
    >
      {children}
    </motion.div>
  )
}
