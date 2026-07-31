import { applyBasisPoints, assertIntegerCents, clampCents } from './money.js';

/**
 * Configuração da comissão da plataforma para uma transação.
 * - PERCENTAGE: percentual em pontos-base (10% = 1000 bps).
 * - FIXED: valor fixo em centavos.
 */
export type PlatformFeeConfig =
  | { readonly kind: 'PERCENTAGE'; readonly basisPoints: number }
  | { readonly kind: 'FIXED'; readonly cents: number };

export interface CommissionInput {
  /** Valor bruto cobrado do cliente, em centavos. */
  readonly grossCents: number;
  /** Regra de comissão da plataforma. */
  readonly platformFee: PlatformFeeConfig;
  /**
   * Taxa cobrada pelo gateway nesta transação, em centavos (já conhecida a partir
   * do webhook/consulta ao provedor). Default 0 quando ainda não informada.
   */
  readonly gatewayFeeCents?: number;
}

export interface CommissionBreakdown {
  readonly grossCents: number;
  readonly platformFeeCents: number;
  readonly gatewayFeeCents: number;
  /** Valor líquido a repassar ao fornecedor. */
  readonly netToProviderCents: number;
}

/**
 * Calcula a divisão de uma transação entre taxa da plataforma, taxa do gateway
 * e valor líquido do fornecedor.
 *
 * Invariante garantida: gross === platformFee + gatewayFee + net.
 * As taxas são limitadas para nunca ultrapassarem o valor bruto; o líquido nunca
 * é negativo. Isto é registrado no ledger financeiro imutável.
 */
export function calculateCommission(input: CommissionInput): CommissionBreakdown {
  const { grossCents } = input;
  assertIntegerCents(grossCents);
  if (grossCents < 0) {
    throw new RangeError('grossCents não pode ser negativo');
  }

  const gatewayFeeRaw = input.gatewayFeeCents ?? 0;
  assertIntegerCents(gatewayFeeRaw);
  if (gatewayFeeRaw < 0) {
    throw new RangeError('gatewayFeeCents não pode ser negativo');
  }
  const gatewayFeeCents = clampCents(gatewayFeeRaw, 0, grossCents);

  const platformFeeRaw =
    input.platformFee.kind === 'PERCENTAGE'
      ? applyBasisPoints(grossCents, input.platformFee.basisPoints)
      : input.platformFee.cents;
  assertIntegerCents(platformFeeRaw);
  if (platformFeeRaw < 0) {
    throw new RangeError('platformFee não pode ser negativo');
  }

  // A taxa da plataforma nunca pode comer o que já foi para o gateway.
  const platformFeeCents = clampCents(platformFeeRaw, 0, grossCents - gatewayFeeCents);
  const netToProviderCents = grossCents - platformFeeCents - gatewayFeeCents;

  // Guarda de segurança: a soma tem de fechar exatamente.
  if (platformFeeCents + gatewayFeeCents + netToProviderCents !== grossCents) {
    throw new Error('Invariante de comissão violada: soma não fecha com o bruto');
  }

  return { grossCents, platformFeeCents, gatewayFeeCents, netToProviderCents };
}
