/**
 * Validação de documentos brasileiros pelos dígitos verificadores.
 * Implementação real dos algoritmos oficiais de CPF e CNPJ — não usa apenas
 * checagem de formato/comprimento.
 */

function digits(value: string): number[] {
  return value.replace(/\D+/g, '').split('').map(Number);
}

function allSame(values: number[]): boolean {
  return values.every((digit) => digit === values[0]);
}

/**
 * Calcula um dígito verificador módulo 11 a partir de uma lista de dígitos e pesos.
 * Regra brasileira: se o resto for menor que 2, o dígito é 0; senão, 11 - resto.
 */
function mod11CheckDigit(source: number[], weights: number[]): number {
  const sum = source.reduce((acc, digit, index) => acc + digit * weights[index]!, 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/** Valida um CPF (com ou sem máscara). */
export function isValidCPF(value: string): boolean {
  const d = digits(value);
  if (d.length !== 11 || allSame(d)) return false;

  const firstWeights = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

  const dv1 = mod11CheckDigit(d.slice(0, 9), firstWeights);
  const dv2 = mod11CheckDigit(d.slice(0, 10), secondWeights);

  return dv1 === d[9] && dv2 === d[10];
}

/** Valida um CNPJ (com ou sem máscara). */
export function isValidCNPJ(value: string): boolean {
  const d = digits(value);
  if (d.length !== 14 || allSame(d)) return false;

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const dv1 = mod11CheckDigit(d.slice(0, 12), firstWeights);
  const dv2 = mod11CheckDigit(d.slice(0, 13), secondWeights);

  return dv1 === d[12] && dv2 === d[13];
}

/** Valida um CEP brasileiro apenas por formato (8 dígitos). */
export function isValidCEP(value: string): boolean {
  return /^\d{8}$/.test(value.replace(/\D+/g, ''));
}

/**
 * Valida um telefone brasileiro (10 dígitos para fixo, 11 para celular).
 * Para celular, o nono dígito (após o DDD) deve ser 9.
 */
export function isValidPhoneBR(value: string): boolean {
  const d = value.replace(/\D+/g, '');
  if (d.length === 10) return true;
  if (d.length === 11) return d[2] === '9';
  return false;
}
