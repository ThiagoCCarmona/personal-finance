// Gerador Oficial de Payload PIX EMV (BR Code) conforme especificações do Banco Central do Brasil

function formatEMV(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

// Cálculo CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF)
function calcularCRC16(payload: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Remove acentos e caracteres especiais para nomes/cidades no padrão EMV
function normalizarTexto(texto: string, maxLen: number): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .substring(0, maxLen);
}

export interface PixPayloadParams {
  chave: string;
  nomeRecebedor: string;
  cidadeRecebedor: string;
  valor?: number;
  mensagem?: string;
  txid?: string;
}

export function gerarPayloadPix(params: PixPayloadParams): string {
  const {
    chave,
    nomeRecebedor,
    cidadeRecebedor,
    valor,
    mensagem,
    txid = '***'
  } = params;

  // ID 00: Payload Format Indicator
  let payload = formatEMV('00', '01');

  // ID 26: Merchant Account Information
  // Sub-ID 00: GUI (br.gov.bcb.pix)
  // Sub-ID 01: Chave PIX
  // Sub-ID 02: Descrição (opcional)
  let mai = formatEMV('00', 'br.gov.bcb.pix') + formatEMV('01', chave);
  if (mensagem && mensagem.trim().length > 0) {
    mai += formatEMV('02', normalizarTexto(mensagem, 60));
  }
  payload += formatEMV('26', mai);

  // ID 52: Merchant Category Code
  payload += formatEMV('52', '0000');

  // ID 53: Transaction Currency (986 = BRL)
  payload += formatEMV('53', '986');

  // ID 54: Transaction Amount (opcional, se > 0)
  if (valor && valor > 0) {
    payload += formatEMV('54', valor.toFixed(2));
  }

  // ID 58: Country Code (BR)
  payload += formatEMV('58', 'BR');

  // ID 59: Merchant Name
  payload += formatEMV('59', normalizarTexto(nomeRecebedor, 25) || 'RECEBEDOR');

  // ID 60: Merchant City
  payload += formatEMV('60', normalizarTexto(cidadeRecebedor, 15) || 'CIDADE');

  // ID 62: Additional Data Field Template
  // Sub-ID 05: Reference Label (TXID)
  const cleanTxid = (txid && txid.trim().length > 0) 
    ? normalizarTexto(txid, 25).replace(/ /g, '') 
    : '***';
  const additionalData = formatEMV('05', cleanTxid || '***');
  payload += formatEMV('62', additionalData);

  // ID 63: CRC16
  const payloadComId63 = payload + '6304';
  const crc = calcularCRC16(payloadComId63);

  return payloadComId63 + crc;
}
