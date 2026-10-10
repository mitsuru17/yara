function Tree({ x, h = 60 }: { x: number; h?: number }) {
  const top = 240 - h;
  return (
    <g>
      <rect x={x - 2} y={top + 20} width="4" height={h - 20} fill="#4d8a3a" />
      <ellipse cx={x} cy={top + 18} rx="22" ry="26" fill="#6cc04a" />
      <ellipse cx={x - 6} cy={top + 10} rx="10" ry="12" fill="#86d35f" />
    </g>
  );
}

function Building({ x, y, w, fill, windows = "#e7efff" }: { x: number; y: number; w: number; fill: string; windows?: string }) {
  const rows = Math.floor((232 - y - 30) / 26);
  return (
    <g>
      <rect x={x} y={y} width={w} height={240 - y} fill={fill} rx="2" />
      {Array.from({ length: rows }).map((_, r) =>
        [0, 1].map((c) => (
          <rect
            key={`${r}-${c}`}
            x={x + 10 + c * (w / 2 - 4)}
            y={y + 16 + r * 26}
            width={w / 2 - 16}
            height="14"
            fill={windows}
            rx="1.5"
          />
        )),
      )}
      <rect x={x + w / 2 - 8} y={218} width="16" height="22" fill="#fff" stroke={fill} />
    </g>
  );
}

export function CityIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 700 260"
      className={`w-full rounded-2xl border border-line bg-gradient-to-b from-[#f2f6ff] to-white ${className}`}
      role="img"
      aria-label="Ilustración de un distrito protegido"
    >
      <ellipse cx="130" cy="70" rx="34" ry="13" fill="#dbe7ff" />
      <ellipse cx="150" cy="62" rx="22" ry="14" fill="#dbe7ff" />
      <ellipse cx="490" cy="62" rx="34" ry="13" fill="#dbe7ff" />
      <ellipse cx="510" cy="54" rx="22" ry="14" fill="#dbe7ff" />

      <Building x={250} y={56} w={70} fill="#8fb1f3" />
      <polygon points="250,56 285,40 320,56" fill="#a9c3f6" />
      <Building x={332} y={118} w={62} fill="#b7cdf7" windows="#8fb1f3" />
      <Building x={406} y={90} w={52} fill="#c9d9fa" windows="#9fbcf4" />
      <polygon points="406,90 432,74 458,90" fill="#d7e3fb" />

      <path d="M0 236 C120 200 240 226 350 214 S580 206 700 228 V260 H0Z" fill="#a8dc8c" />
      <path d="M0 246 C160 228 300 248 420 238 S620 236 700 244 V260 H0Z" fill="#8fd16e" />

      <Tree x={50} h={84} />
      <Tree x={180} h={66} />
      <Tree x={232} h={52} />
      <Tree x={480} h={60} />
      <Tree x={530} h={70} />
      <Tree x={660} h={80} />

      <g transform="translate(560 40)">
        <path d="M44 0 6 13v27c0 25 16 43 38 50 22-7 38-25 38-50V13L44 0Z" fill="#0b4fe0" />
        <path d="M44 8 14 18v22c0 20 13 35 30 41 17-6 30-21 30-41V18L44 8Z" fill="#2463eb" />
        <path d="m44 24 6 12 13 2-9.5 9 2.3 13L44 54l-11.8 6 2.3-13L25 38l13-2 6-12Z" fill="#fff" />
      </g>
    </svg>
  );
}
