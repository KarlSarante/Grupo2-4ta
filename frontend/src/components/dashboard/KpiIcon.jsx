const iconos = {
  balance: (
    <>
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1ZM2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10M12 3v18M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </>
  ),
  ingresos: (
    <>
      <path d="m3 17 7-7 4 4 7-7" />
      <path d="M15 7h6v6" />
    </>
  ),
  gastos: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M6 15h4" />
    </>
  ),
};

const decorativos = {
  balance: (
    <g fill="none" stroke="#6EA884" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 22v-5a6 6 0 0 1 6-6h29a4 4 0 0 1 4 4v6" />
      <path d="M14 17h29" />
      <rect x="7" y="21" width="43" height="30" rx="6" />
      <path d="M14 27h18" />
      <circle cx="45" cy="45" r="13" fill="#104D3D" />
      <path d="M49 38h-6a4 4 0 0 0 0 6h4a4 4 0 0 1 0 8h-6M45 35v22" />
    </g>
  ),
  ingresos: (
    <g fill="none" stroke="#6EA884" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 55h50" />
      <rect x="11" y="37" width="9" height="18" rx="1.7" />
      <rect x="25" y="29" width="9" height="26" rx="1.7" />
      <rect x="39" y="39" width="9" height="16" rx="1.7" />
      <circle cx="47" cy="18" r="12" fill="#104D3D" />
      <path d="M51 12h-6a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-6M47 9v18" />
    </g>
  ),
  gastos: (
    <g fill="none" stroke="#6EA884" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h8l7 32h33l7-23H16M20 49h32" />
      <circle cx="25" cy="55" r="3.5" />
      <circle cx="48" cy="55" r="3.5" />
      <path d="M29 9h20v28l-4-3-4 3-4-3-4 3-4-3z" fill="#104D3D" />
      <path d="M34 16h10M34 22h10M34 28h6" />
    </g>
  ),
};

function KpiIcon({ tipo, decorativo = false }) {
  if (decorativo) {
    return (
      <svg viewBox="0 0 64 64" width="54" height="54" aria-hidden="true">
        {decorativos[tipo] ?? null}
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width="31"
      height="31"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconos[tipo] ?? null}
    </svg>
  );
}

export default KpiIcon;
