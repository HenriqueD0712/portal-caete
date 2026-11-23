import QRCode from "qrcode";

// QR Code estilizado do Estúdio Caeté: módulos arredondados que se "fundem"
// com os vizinhos, cantos de posicionamento em anel arredondado com bolinha
// no centro e cor verde-escura. O código lido é o mesmo de um QR comum.
export const QR_COR = "#17332E";

type Opcoes = { cor?: string; fundo?: string | null; margem?: number };

export function gerarQrSvg(texto: string, { cor = QR_COR, fundo = null, margem = 2 }: Opcoes = {}): string {
  // "Q" = boa margem de correção de erro, ajuda na leitura mesmo com o desenho arredondado.
  const qr = QRCode.create(texto, { errorCorrectionLevel: "Q" });
  const n = qr.modules.size;
  const total = n + margem * 2;

  // Os 3 cantos de posicionamento (7x7) são desenhados à parte.
  const emCanto = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const escuro = (r: number, c: number) =>
    r >= 0 && c >= 0 && r < n && c < n && !emCanto(r, c) && qr.modules.get(r, c) === 1;

  // Pequena sobra (e) em cada módulo evita fresta fina entre módulos vizinhos.
  const e = 0.01;
  const R = 0.5 + e;
  let d = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!escuro(r, c)) continue;
      const cima = escuro(r - 1, c), baixo = escuro(r + 1, c);
      const esq = escuro(r, c - 1), dir = escuro(r, c + 1);
      // Só arredonda o canto quando os dois lados dele não têm vizinho.
      const tl = !cima && !esq ? R : 0;
      const tr = !cima && !dir ? R : 0;
      const br = !baixo && !dir ? R : 0;
      const bl = !baixo && !esq ? R : 0;
      const x0 = c - e, y0 = r - e, x1 = c + 1 + e, y1 = r + 1 + e;
      d += `M${x0 + tl} ${y0}H${x1 - tr}`;
      if (tr) d += `A${tr} ${tr} 0 0 1 ${x1} ${y0 + tr}`;
      d += `V${y1 - br}`;
      if (br) d += `A${br} ${br} 0 0 1 ${x1 - br} ${y1}`;
      d += `H${x0 + bl}`;
      if (bl) d += `A${bl} ${bl} 0 0 1 ${x0} ${y1 - bl}`;
      d += `V${y0 + tl}`;
      if (tl) d += `A${tl} ${tl} 0 0 1 ${x0 + tl} ${y0}`;
      d += "Z";
    }
  }

  // Canto de posicionamento: anel arredondado (7x7) + bolinha central (3x3).
  const canto = (x: number, y: number) =>
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="6" height="6" rx="1.9" fill="none" stroke="${cor}" stroke-width="1"/>` +
    `<circle cx="${x + 3.5}" cy="${y + 3.5}" r="1.5" fill="${cor}"/>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total * 20}" height="${total * 20}">` +
    (fundo ? `<rect width="${total}" height="${total}" fill="${fundo}"/>` : "") +
    `<g transform="translate(${margem} ${margem})">` +
    `<path d="${d}" fill="${cor}"/>` +
    canto(0, 0) + canto(n - 7, 0) + canto(0, n - 7) +
    `</g></svg>`
  );
}

export function svgParaDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Converte o SVG em PNG (transparente, como o QR que vocês usam hoje) no navegador.
export function svgParaPng(svg: string, largura = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = largura;
      canvas.height = largura;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas indisponível"));
      ctx.drawImage(img, 0, 0, largura, largura);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Falha ao gerar PNG"));
    img.src = svgParaDataUrl(svg);
  });
}
