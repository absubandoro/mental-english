/** Sama seperti slugify di API: huruf kecil, angka, tanda - */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-/, '')
    .slice(0, 40);
}
