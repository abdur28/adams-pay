export function AdamsLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`${className} relative`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Adams Pay swirl logo based on brand guidelines */}
        <g transform="translate(50,50)">
          {/* Outer petals */}
          <path d="M0,-35 L8,-25 L12,-35 L4,-45 Z" fill="currentColor" transform="rotate(0)" />
          <path d="M0,-35 L8,-25 L12,-35 L4,-45 Z" fill="currentColor" transform="rotate(30)" />
          <path d="M0,-35 L8,-25 L12,-35 L4,-45 Z" fill="currentColor" transform="rotate(60)" />
          <path d="M0,-35 L8,-25 L12,-35 L4,-45 Z" fill="currentColor" transform="rotate(90)" />
          <path d="M0,-35 L8,-25 L12,-35 L4,-45 Z" fill="currentColor" transform="rotate(120)" />
          <path d="M0,-35 L8,-25 L12,-35 L4,-45 Z" fill="currentColor" transform="rotate(150)" />
          <path d="M0,-35 L8,-25 L12,-35 L4,-45 Z" fill="currentColor" transform="rotate(180)" />
          <path d="M0,-35 L8,-25 L12,-35 L4,-45 Z" fill="currentColor" transform="rotate(210)" />
          <path d="M0,-35 L8,-25 L12,-35 L4,-45 Z" fill="currentColor" transform="rotate(240)" />
          <path d="M0,-35 L8,-25 L12,-35 L4,-45 Z" fill="currentColor" transform="rotate(270)" />
          <path d="M0,-35 L8,-25 L12,-35 L4,-45 Z" fill="currentColor" transform="rotate(300)" />
          <path d="M0,-35 L8,-25 L12,-35 L4,-45 Z" fill="currentColor" transform="rotate(330)" />
        </g>
      </svg>
    </div>
  )
}