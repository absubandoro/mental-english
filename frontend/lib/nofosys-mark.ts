/**
 * Logo Nofosys: huruf N dari garis yang menghubungkan empat titik (simpul jaringan),
 * di atas kotak bergradasi ungu → cyan. Dipakai sebagai SVG string (ikon, preview link) dan komponen React.
 */
export const NOFOSYS_FROM = '#8b5cf6';
export const NOFOSYS_TO = '#22d3ee';

export function nofosysMarkSvg(size = 64, id = 'nf') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
<defs><linearGradient id="${id}" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop stop-color="${NOFOSYS_FROM}"/><stop offset="1" stop-color="${NOFOSYS_TO}"/></linearGradient></defs>
<rect width="64" height="64" rx="16" fill="url(#${id})"/>
<path d="M19 45V19L45 45V19" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="19" cy="45" r="5" fill="#fff"/><circle cx="45" cy="19" r="5" fill="#fff"/>
<circle cx="19" cy="19" r="3.2" fill="#fff" fill-opacity=".75"/><circle cx="45" cy="45" r="3.2" fill="#fff" fill-opacity=".75"/>
</svg>`;
}

export function nofosysMarkDataUrl(size = 64) {
  return `data:image/svg+xml;base64,${Buffer.from(nofosysMarkSvg(size)).toString('base64')}`;
}
