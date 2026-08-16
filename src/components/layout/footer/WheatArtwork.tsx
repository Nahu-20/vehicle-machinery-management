import React from 'react';

/**
 * Realistic and decorative golden wheat illustrations and subtle rolling hills landscape
 * for the Oromia Agricultural Bureau footer and farmer assistance CTA.
 * Designed with warm gold tones, awns, kernels, and soft cultivated field contours.
 */

export const WheatLeftIllustration: React.FC<{ className?: string }> = ({
  className = 'w-48 sm:w-64 md:w-80 h-auto',
}) => {
  return (
    <svg
      viewBox="0 0 340 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wheatGold1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F9E29D" />
          <stop offset="35%" stopColor="#DEAA3A" />
          <stop offset="75%" stopColor="#C48E28" />
          <stop offset="100%" stopColor="#9C6B16" />
        </linearGradient>
        <linearGradient id="wheatGoldLight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF2C2" />
          <stop offset="60%" stopColor="#E9B746" />
          <stop offset="100%" stopColor="#B37C1C" />
        </linearGradient>
        <linearGradient id="wheatGlow" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#D9A838" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#D9A838" stopOpacity="0" />
        </linearGradient>
        <filter id="softGlowLeft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Main stalk 1 */}
      <path
        d="M-20 440 Q 60 300 120 120"
        stroke="url(#wheatGold1)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Side stalk 2 */}
      <path
        d="M-40 430 Q 80 340 180 200"
        stroke="url(#wheatGold1)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Side stalk 3 */}
      <path
        d="M-10 440 Q 40 280 60 160"
        stroke="url(#wheatGold1)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Wheat Ear 1 (Primary tall head) */}
      <g transform="translate(120, 120) rotate(16)">
        {/* Awns / Beards */}
        <path d="M0 -30 L-18 -95" stroke="url(#wheatGoldLight)" strokeWidth="1" strokeLinecap="round" opacity="0.85" />
        <path d="M5 -20 L-6 -100" stroke="url(#wheatGoldLight)" strokeWidth="1" strokeLinecap="round" opacity="0.9" />
        <path d="M10 -10 L15 -105" stroke="url(#wheatGoldLight)" strokeWidth="1" strokeLinecap="round" opacity="0.9" />
        <path d="M12 0 L32 -90" stroke="url(#wheatGoldLight)" strokeWidth="1" strokeLinecap="round" opacity="0.85" />
        <path d="M15 15 L48 -75" stroke="url(#wheatGoldLight)" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
        <path d="M-8 -15 L-35 -80" stroke="url(#wheatGoldLight)" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
        <path d="M-10 10 L-42 -60" stroke="url(#wheatGoldLight)" strokeWidth="1" strokeLinecap="round" opacity="0.75" />

        {/* Spikelets / Grain Kernels left and right */}
        {[-30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70].map((y, idx) => (
          <React.Fragment key={`grain1-${idx}`}>
            {/* Left grain */}
            <path
              d={`M0 ${y} C -14 ${y - 4}, -14 ${y + 12}, 0 ${y + 16} Z`}
              fill="url(#wheatGoldLight)"
              stroke="#A87317"
              strokeWidth="0.75"
            />
            {/* Right grain */}
            <path
              d={`M0 ${y + 5} C 14 ${y + 1}, 14 ${y + 17}, 0 ${y + 21} Z`}
              fill="url(#wheatGold1)"
              stroke="#A87317"
              strokeWidth="0.75"
            />
            {/* Grain crease detail */}
            <path
              d={`M-7 ${y + 5} Q -3 ${y + 7} 0 ${y + 8}`}
              stroke="#87580D"
              strokeWidth="0.6"
              strokeLinecap="round"
            />
            <path
              d={`M7 ${y + 10} Q 3 ${y + 12} 0 ${y + 13}`}
              stroke="#87580D"
              strokeWidth="0.6"
              strokeLinecap="round"
            />
          </React.Fragment>
        ))}
      </g>

      {/* Wheat Ear 2 (Lower right leaning) */}
      <g transform="translate(180, 200) rotate(34)">
        {/* Awns */}
        <path d="M0 -25 L-12 -80" stroke="url(#wheatGoldLight)" strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
        <path d="M5 -15 L8 -85" stroke="url(#wheatGoldLight)" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
        <path d="M10 0 L26 -75" stroke="url(#wheatGoldLight)" strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
        <path d="M12 15 L38 -60" stroke="url(#wheatGoldLight)" strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />

        {[-25, -15, -5, 5, 15, 25, 35, 45, 55].map((y, idx) => (
          <React.Fragment key={`grain2-${idx}`}>
            <path
              d={`M0 ${y} C -12 ${y - 3}, -12 ${y + 10}, 0 ${y + 14} Z`}
              fill="url(#wheatGoldLight)"
              stroke="#A87317"
              strokeWidth="0.7"
            />
            <path
              d={`M0 ${y + 4} C 12 ${y + 1}, 12 ${y + 14}, 0 ${y + 18} Z`}
              fill="url(#wheatGold1)"
              stroke="#A87317"
              strokeWidth="0.7"
            />
          </React.Fragment>
        ))}
      </g>

      {/* Wheat Ear 3 (Left subtle) */}
      <g transform="translate(60, 160) rotate(-6)">
        <path d="M0 -20 L-8 -70" stroke="url(#wheatGoldLight)" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
        <path d="M6 -10 L14 -72" stroke="url(#wheatGoldLight)" strokeWidth="0.8" strokeLinecap="round" opacity="0.75" />
        {[-20, -10, 0, 10, 20, 30, 40].map((y, idx) => (
          <React.Fragment key={`grain3-${idx}`}>
            <path
              d={`M0 ${y} C -10 ${y - 3}, -10 ${y + 9}, 0 ${y + 12} Z`}
              fill="url(#wheatGoldLight)"
              stroke="#A87317"
              strokeWidth="0.65"
            />
            <path
              d={`M0 ${y + 3} C 10 ${y}, 10 ${y + 12}, 0 ${y + 15} Z`}
              fill="url(#wheatGold1)"
              stroke="#A87317"
              strokeWidth="0.65"
            />
          </React.Fragment>
        ))}
      </g>

      {/* Floating kernels */}
      <g opacity="0.85">
        <path
          d="M210 140 C 204 135, 204 147, 210 152 C 216 147, 216 135, 210 140 Z"
          fill="url(#wheatGoldLight)"
          stroke="#A87317"
          strokeWidth="0.6"
          transform="rotate(25 210 145)"
        />
        <path
          d="M250 175 C 245 171, 245 181, 250 185 C 255 181, 255 171, 250 175 Z"
          fill="url(#wheatGold1)"
          stroke="#A87317"
          strokeWidth="0.6"
          transform="rotate(-15 250 178)"
        />
      </g>
    </svg>
  );
};

export const WheatRightIllustration: React.FC<{ className?: string }> = ({
  className = 'w-56 sm:w-72 md:w-96 h-auto',
}) => {
  return (
    <svg
      viewBox="0 0 380 460"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wheatGoldRight1" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF3C7" />
          <stop offset="30%" stopColor="#E5B242" />
          <stop offset="70%" stopColor="#C68F26" />
          <stop offset="100%" stopColor="#966312" />
        </linearGradient>
        <linearGradient id="wheatGoldRight2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCE7A2" />
          <stop offset="50%" stopColor="#D99F2D" />
          <stop offset="100%" stopColor="#A87018" />
        </linearGradient>
      </defs>

      {/* Main stalk 1 */}
      <path
        d="M400 460 Q 320 280 250 90"
        stroke="url(#wheatGoldRight1)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Side stalk 2 */}
      <path
        d="M420 440 Q 340 320 180 170"
        stroke="url(#wheatGoldRight2)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* Side stalk 3 */}
      <path
        d="M390 470 Q 330 360 280 230"
        stroke="url(#wheatGoldRight1)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Side stalk 4 */}
      <path
        d="M430 430 Q 380 340 330 180"
        stroke="url(#wheatGoldRight2)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Primary Wheat Ear (Tall centerpiece) */}
      <g transform="translate(250, 90) rotate(-22)">
        {/* Awns */}
        <path d="M0 -35 L16 -110" stroke="url(#wheatGoldRight1)" strokeWidth="1.1" strokeLinecap="round" opacity="0.9" />
        <path d="M-6 -25 L-2 -115" stroke="url(#wheatGoldRight1)" strokeWidth="1.1" strokeLinecap="round" opacity="0.95" />
        <path d="M-12 -12 L-22 -110" stroke="url(#wheatGoldRight1)" strokeWidth="1" strokeLinecap="round" opacity="0.9" />
        <path d="M-15 2 L-38 -95" stroke="url(#wheatGoldRight1)" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
        <path d="M-18 18 L-52 -78" stroke="url(#wheatGoldRight1)" strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
        <path d="M12 -15 L40 -90" stroke="url(#wheatGoldRight1)" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
        <path d="M16 10 L50 -70" stroke="url(#wheatGoldRight1)" strokeWidth="0.85" strokeLinecap="round" opacity="0.8" />

        {/* Spikelets / Grain Kernels */}
        {[-35, -24, -13, -2, 9, 20, 31, 42, 53, 64, 75, 86].map((y, idx) => (
          <React.Fragment key={`rgrain1-${idx}`}>
            <path
              d={`M0 ${y} C 15 ${y - 4}, 15 ${y + 13}, 0 ${y + 17} Z`}
              fill="url(#wheatGoldRight1)"
              stroke="#9E6914"
              strokeWidth="0.8"
            />
            <path
              d={`M0 ${y + 5} C -15 ${y + 1}, -15 ${y + 18}, 0 ${y + 22} Z`}
              fill="url(#wheatGoldRight2)"
              stroke="#9E6914"
              strokeWidth="0.8"
            />
            <path
              d={`M8 ${y + 5} Q 4 ${y + 8} 0 ${y + 9}`}
              stroke="#7E4F0B"
              strokeWidth="0.65"
              strokeLinecap="round"
            />
            <path
              d={`M-8 ${y + 11} Q -4 ${y + 14} 0 ${y + 15}`}
              stroke="#7E4F0B"
              strokeWidth="0.65"
              strokeLinecap="round"
            />
          </React.Fragment>
        ))}
      </g>

      {/* Secondary Wheat Ear (Arching leftwards) */}
      <g transform="translate(180, 170) rotate(-38)">
        <path d="M0 -28 L14 -90" stroke="url(#wheatGoldRight1)" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
        <path d="M-6 -18 L-5 -95" stroke="url(#wheatGoldRight1)" strokeWidth="0.9" strokeLinecap="round" opacity="0.9" />
        <path d="M-12 -5 L-28 -88" stroke="url(#wheatGoldRight1)" strokeWidth="0.85" strokeLinecap="round" opacity="0.8" />
        <path d="M-14 10 L-42 -72" stroke="url(#wheatGoldRight1)" strokeWidth="0.8" strokeLinecap="round" opacity="0.75" />

        {[-28, -18, -8, 2, 12, 22, 32, 42, 52, 62].map((y, idx) => (
          <React.Fragment key={`rgrain2-${idx}`}>
            <path
              d={`M0 ${y} C 13 ${y - 3}, 13 ${y + 11}, 0 ${y + 15} Z`}
              fill="url(#wheatGoldRight1)"
              stroke="#9E6914"
              strokeWidth="0.7"
            />
            <path
              d={`M0 ${y + 4} C -13 ${y + 1}, -13 ${y + 15}, 0 ${y + 19} Z`}
              fill="url(#wheatGoldRight2)"
              stroke="#9E6914"
              strokeWidth="0.7"
            />
          </React.Fragment>
        ))}
      </g>

      {/* Tertiary Wheat Ear (Lower branch) */}
      <g transform="translate(280, 230) rotate(-10)">
        <path d="M0 -22 L8 -75" stroke="url(#wheatGoldRight1)" strokeWidth="0.8" strokeLinecap="round" opacity="0.75" />
        <path d="M-5 -12 L-10 -78" stroke="url(#wheatGoldRight1)" strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
        {[-22, -12, -2, 8, 18, 28, 38, 48].map((y, idx) => (
          <React.Fragment key={`rgrain3-${idx}`}>
            <path
              d={`M0 ${y} C 11 ${y - 3}, 11 ${y + 10}, 0 ${y + 13} Z`}
              fill="url(#wheatGoldRight1)"
              stroke="#9E6914"
              strokeWidth="0.65"
            />
            <path
              d={`M0 ${y + 3} C -11 ${y}, -11 ${y + 13}, 0 ${y + 16} Z`}
              fill="url(#wheatGoldRight2)"
              stroke="#9E6914"
              strokeWidth="0.65"
            />
          </React.Fragment>
        ))}
      </g>

      {/* Floating Kernels */}
      <g opacity="0.85">
        <path
          d="M130 190 C 124 186, 124 196, 130 200 C 136 196, 136 186, 130 190 Z"
          fill="url(#wheatGoldRight1)"
          stroke="#9E6914"
          strokeWidth="0.6"
          transform="rotate(35 130 195)"
        />
        <path
          d="M90 220 C 85 216, 85 226, 90 230 C 95 226, 95 216, 90 220 Z"
          fill="url(#wheatGoldRight2)"
          stroke="#9E6914"
          strokeWidth="0.6"
          transform="rotate(-20 90 225)"
        />
        <path
          d="M150 250 C 145 246, 145 256, 150 260 C 155 256, 155 246, 150 250 Z"
          fill="url(#wheatGoldRight1)"
          stroke="#9E6914"
          strokeWidth="0.6"
          transform="rotate(15 150 255)"
        />
      </g>
    </svg>
  );
};

export const RollingHillsLandscape: React.FC<{ className?: string }> = ({
  className = 'w-full h-32 md:h-44',
}) => {
  return (
    <svg
      viewBox="0 0 1440 180"
      fill="none"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hillFade1" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#78AF31" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#D6A43A" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id="hillFade2" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#087A4B" stopOpacity="0.07" />
          <stop offset="60%" stopColor="#78AF31" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#FAFAF7" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hillFade3" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#E2C172" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#FAFAF7" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Distant rolling hill 1 */}
      <path
        d="M0 180 L0 110 Q 240 60 520 100 T 1050 70 Q 1280 90 1440 120 L1440 180 Z"
        fill="url(#hillFade1)"
      />

      {/* Middle rolling contours with crop terrace lines */}
      <path
        d="M0 180 L0 135 Q 360 85 720 125 T 1440 110 L1440 180 Z"
        fill="url(#hillFade2)"
      />

      {/* Field contour ridges */}
      <path
        d="M120 130 Q 320 90 540 120"
        stroke="#78AF31"
        strokeWidth="1.2"
        strokeDasharray="4 6"
        opacity="0.25"
      />
      <path
        d="M480 125 Q 780 85 1060 115"
        stroke="#D6A43A"
        strokeWidth="1.2"
        strokeDasharray="5 7"
        opacity="0.3"
      />
      <path
        d="M920 110 Q 1180 80 1380 105"
        stroke="#78AF31"
        strokeWidth="1.2"
        strokeDasharray="4 6"
        opacity="0.25"
      />

      {/* Foreground terrace slope */}
      <path
        d="M0 180 L0 155 Q 400 130 800 160 T 1440 145 L1440 180 Z"
        fill="url(#hillFade3)"
      />
    </svg>
  );
};

export const FloatingGrainsScattered: React.FC<{ className?: string }> = ({
  className = 'w-full h-full',
}) => {
  return (
    <svg
      viewBox="0 0 1200 300"
      fill="none"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none absolute inset-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="scatGrain" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F9E29D" />
          <stop offset="60%" stopColor="#DEAA3A" />
          <stop offset="100%" stopColor="#A87317" />
        </linearGradient>
      </defs>

      {/* Soft floating kernels across the footer bottom margin */}
      <g opacity="0.6">
        <path
          d="M80 220 C 74 216 74 227 80 231 C 86 227 86 216 80 220 Z"
          fill="url(#scatGrain)"
          stroke="#9E6914"
          strokeWidth="0.5"
          transform="rotate(18 80 225)"
        />
        <path
          d="M140 250 C 134 246 134 257 140 261 C 146 257 146 246 140 250 Z"
          fill="url(#scatGrain)"
          stroke="#9E6914"
          strokeWidth="0.5"
          transform="rotate(-25 140 255)"
        />
        <path
          d="M320 265 C 314 261 314 272 320 276 C 326 272 326 261 320 265 Z"
          fill="url(#scatGrain)"
          stroke="#9E6914"
          strokeWidth="0.5"
          transform="rotate(40 320 270)"
        />
        <path
          d="M620 255 C 614 251 614 262 620 266 C 626 262 626 251 620 255 Z"
          fill="url(#scatGrain)"
          stroke="#9E6914"
          strokeWidth="0.5"
          transform="rotate(-15 620 260)"
        />
        <path
          d="M890 245 C 884 241 884 252 890 256 C 896 252 896 241 890 245 Z"
          fill="url(#scatGrain)"
          stroke="#9E6914"
          strokeWidth="0.5"
          transform="rotate(30 890 250)"
        />
        <path
          d="M980 260 C 974 256 974 267 980 271 C 986 267 986 256 980 260 Z"
          fill="url(#scatGrain)"
          stroke="#9E6914"
          strokeWidth="0.5"
          transform="rotate(-35 980 265)"
        />
        <path
          d="M1060 230 C 1054 226 1054 237 1060 241 C 1066 237 1066 226 1060 230 Z"
          fill="url(#scatGrain)"
          stroke="#9E6914"
          strokeWidth="0.5"
          transform="rotate(12 1060 235)"
        />
      </g>
    </svg>
  );
};
