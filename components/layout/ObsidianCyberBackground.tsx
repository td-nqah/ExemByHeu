export function ObsidianCyberBackground() {
  return (
    <div
      aria-hidden="true"
      className="obsidian-bg-container pointer-events-none fixed inset-0 -z-10 h-screen w-screen overflow-hidden bg-[#090D16]"
    >
      <div className="pattern-bg h-full w-full overflow-hidden">
        <svg
          preserveAspectRatio="xMidYMid slice"
          height="100%"
          width="100%"
          className="cube-svg"
          viewBox="0 0 120 104"
        >
          <defs>
            <linearGradient y2="100%" x2="100%" y1="0%" x1="0%" id="cube-dark">
              <stop stopColor="#090D16" offset="0%" />
              <stop stopColor="#0F172A" offset="100%" />
            </linearGradient>
            <linearGradient y2="0%" x2="100%" y1="100%" x1="0%" id="cube-mid">
              <stop stopColor="#1E1B4B" offset="0%" />
              <stop stopColor="#312E81" offset="100%" />
            </linearGradient>
            <linearGradient y2="100%" x2="0%" y1="0%" x1="100%" id="cube-light">
              <stop stopColor="#6366F1" offset="0%" />
              <stop stopColor="#8B5CF6" offset="100%" />
            </linearGradient>
          </defs>
          <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
            <g transform="translate(-10.000000, -10.000000)">
              <polygon fill="url(#cube-dark)" points="60 0 120 34.64 60 69.28 0 34.64" />
              <polygon fill="url(#cube-mid)" points="0 34.64 60 69.28 60 138.56 0 103.92" />
              <polygon fill="url(#cube-light)" points="60 69.28 120 34.64 120 103.92 60 138.56" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
