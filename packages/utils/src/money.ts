/**
 * Dinheiro em centavos.
 *
 * Regra do projeto: TODO valor monetário persistido e transportado é um inteiro
 * em centavos de Real (BRL). Isso elimina erros de ponto flutuante e garante
 * que somas/divisões sejam exatas. Conversões de/para reais só acontecem na
 * borda (entrada do usuário e formatação para exibição).
 */

/** Arredonda para o inteiro mais próximo, com metade para cima (round half up). */
function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}

/**
 * Converte um valor em reais (ex.: 19.9) para centavos inteiros (1990).
 * Trata a imprecisão de float arredondando explicitamente.
 */
export function reaisToCents(reais: number): number {
  if (!Number.isFinite(reais)) {
    throw new RangeError('Valor em reais inválido');
  }
  return roundHalfUp(reais * 100);
}

/** Converte centavos inteiros para reais (número). Use apenas para exibição/cálculo de UI. */
export function centsToReais(cents: number): number {
  assertIntegerCents(cents);
  return cents / 100;
}

/** Garante que o valor é um inteiro (centavos válidos). */
export function assertIntegerCents(cents: number): void {
  if (!Number.isInteger(cents)) {
    throw new RangeError(`Centavos devem ser inteiros, recebido: ${cents}`);
  }
}

/**
 * Aplica uma porcentagem expressa em pontos-base (basis points) sobre um valor
 * em centavos, retornando centavos inteiros. 100% = 10000 bps; 8.75% = 875 bps.
 * Usar bps (inteiro) evita floats na configuração de comissões/impostos.
 */
export function applyBasisPoints(cents: number, basisPoints: number): number {
  assertIntegerCents(cents);
  if (!Number.isInteger(basisPoints) || basisPoints < 0) {
    throw new RangeError('basisPoints deve ser um inteiro >= 0');
  }
  return roundHalfUp((cents * basisPoints) / 10_000);
}

/**
 * Distribui um valor total em N parcelas inteiras cuja soma é EXATAMENTE o total.
 * As primeiras `resto` parcelas recebem 1 centavo a mais (método do maior resto),
 * garantindo que nenhum centavo se perca no parcelamento.
 */
export function splitEvenly(totalCents: number, parts: number): number[] {
  assertIntegerCents(totalCents);
  if (!Number.isInteger(parts) || parts <= 0) {
    throw new RangeError('parts deve ser um inteiro > 0');
  }
  const base = Math.trunc(totalCents / parts);
  const remainder = totalCents - base * parts;
  return Array.from({ length: parts }, (_, index) => (index < remainder ? base + 1 : base));
}

/** Soma segura de uma lista de valores em centavos. */
export function sumCents(values: readonly number[]): number {
  return values.reduce((acc, value) => {
    assertIntegerCents(value);
    return acc + value;
  }, 0);
}

/** Limita um valor de centavos ao intervalo [min, max]. */
export function clampCents(cents: number, min: number, max: number): number {
  assertIntegerCents(cents);
  return Math.min(Math.max(cents, min), max);
}
