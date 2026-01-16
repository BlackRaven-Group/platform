interface SnakeLogoProps {
  className?: string;
  size?: number;
}

export default function SnakeLogo({ className = '', size = 40 }: SnakeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="snakeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
        </linearGradient>
        <pattern id="scales" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1" fill="currentColor" opacity="0.2" />
        </pattern>
      </defs>

      <circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2" />
      <circle cx="100" cy="100" r="85" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.15" />

      <g opacity="0.3" stroke="currentColor" strokeWidth="1.5">
        <line x1="75" y1="92" x2="125" y2="92" />
        <line x1="100" y1="82" x2="100" y2="92" />
        <line x1="75" y1="92" x2="70" y2="100" />
        <line x1="75" y1="92" x2="80" y2="100" />
        <line x1="125" y1="92" x2="120" y2="100" />
        <line x1="125" y1="92" x2="130" y2="100" />
      </g>

      <g fill="url(#snakeGradient)" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M 100 145 Q 75 145, 65 130 Q 58 115, 65 100 Q 72 85, 90 80"
          fill="none"
          strokeWidth="14"
        />

        <path
          d="M 110 80 Q 128 85, 135 100 Q 142 115, 135 130 Q 125 145, 105 148"
          fill="none"
          strokeWidth="14"
        />

        <path
          d="M 105 148 Q 92 152, 85 162 Q 82 172, 88 182"
          fill="none"
          strokeWidth="13"
        />

        <g transform="translate(88, 182)">
          <path
            d="M 0 0 L 10 -6 L 22 -4 L 28 6 L 26 15 L 14 19 L 2 16 Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2"
          />

          <ellipse cx="10" cy="4" rx="2.5" ry="4" fill="#000000" />
          <circle cx="10" cy="3" r="1" fill="currentColor" opacity="0.9" />

          <circle cx="18" cy="8" r="1.2" fill="#000000" opacity="0.5" />

          <path d="M 12 15 L 13 22 L 11 17 Z" fill="#ffffff" stroke="currentColor" strokeWidth="0.5" />
          <path d="M 17 15 L 18 22 L 16 17 Z" fill="#ffffff" stroke="currentColor" strokeWidth="0.5" />

          <path d="M 4 12 Q 13 16, 24 12" fill="none" stroke="#000000" strokeWidth="1" opacity="0.3" />

          <line x1="6" y1="8" x2="8" y2="6" stroke="#000000" strokeWidth="1" opacity="0.4" />
          <line x1="22" y1="8" x2="20" y2="6" stroke="#000000" strokeWidth="1" opacity="0.4" />
        </g>

        <g transform="translate(65, 130) rotate(-50)">
          <ellipse cx="0" cy="0" rx="5" ry="3.5" fill="currentColor" opacity="0.9" stroke="currentColor" strokeWidth="1" />
          <ellipse cx="-4" cy="0" rx="4" ry="3" fill="currentColor" opacity="0.8" stroke="currentColor" strokeWidth="1" />
          <ellipse cx="-8" cy="0" rx="3.5" ry="2.5" fill="currentColor" opacity="0.7" stroke="currentColor" strokeWidth="1" />
          <ellipse cx="-11" cy="0" rx="3" ry="2" fill="currentColor" opacity="0.6" stroke="currentColor" strokeWidth="1" />
        </g>
      </g>

      <g opacity="0.25">
        <path
          d="M 100 145 Q 75 145, 65 130 Q 58 115, 65 100 Q 72 85, 90 80"
          fill="url(#scales)"
          stroke="none"
        />
        <path
          d="M 110 80 Q 128 85, 135 100 Q 142 115, 135 130 Q 125 145, 105 148"
          fill="url(#scales)"
          stroke="none"
        />
      </g>

      <g stroke="currentColor" strokeWidth="2" opacity="0.4" strokeLinecap="square">
        <line x1="90" y1="55" x2="95" y2="50" />
        <line x1="110" y1="55" x2="105" y2="50" />
        <line x1="45" y1="100" x2="50" y2="95" />
        <line x1="155" y1="100" x2="150" y2="95" />
        <line x1="75" y1="155" x2="80" y2="160" />
        <line x1="125" y1="155" x2="120" y2="160" />
      </g>

      <g stroke="currentColor" strokeWidth="2.5" opacity="0.35" strokeLinecap="square">
        <path d="M 15 15 L 15 30 M 15 15 L 30 15" />
        <path d="M 185 15 L 185 30 M 185 15 L 170 15" />
        <path d="M 15 185 L 15 170 M 15 185 L 30 185" />
        <path d="M 185 185 L 185 170 M 185 185 L 170 185" />
      </g>

      <g opacity="0.2" stroke="currentColor" strokeWidth="2">
        <line x1="100" y1="45" x2="100" y2="82" />
        <path d="M 93 50 L 100 38 L 107 50 Z" fill="currentColor" />
        <rect x="96" y="78" width="8" height="8" fill="currentColor" rx="1" />
      </g>
    </svg>
  );
}
