import { describe, expect, it } from 'vitest';
import { calculateCommission } from '../src/commission.js';

describe('calculateCommission', () => {
  it('comissão percentual sem taxa de gateway', () => {
    const result = calculateCommission({
      grossCents: 100_000,
      platformFee: { kind: 'PERCENTAGE', basisPoints: 1000 }, // 10%
    });
    expect(result.platformFeeCents).toBe(10_000);
    expect(result.gatewayFeeCents).toBe(0);
    expect(result.netToProviderCents).toBe(90_000);
  });

  it('comissão percentual com taxa de gateway', () => {
    const result = calculateCommission({
      grossCents: 100_000,
      platformFee: { kind: 'PERCENTAGE', basisPoints: 1000 },
      gatewayFeeCents: 2990,
    });
    expect(result.platformFeeCents).toBe(10_000);
    expect(result.gatewayFeeCents).toBe(2990);
    expect(result.netToProviderCents).toBe(87_010);
  });

  it('comissão fixa', () => {
    const result = calculateCommission({
      grossCents: 100_000,
      platformFee: { kind: 'FIXED', cents: 500 },
    });
    expect(result.platformFeeCents).toBe(500);
    expect(result.netToProviderCents).toBe(99_500);
  });

  it('limita a taxa fixa que excederia o bruto', () => {
    const result = calculateCommission({
      grossCents: 1000,
      platformFee: { kind: 'FIXED', cents: 5000 },
    });
    expect(result.platformFeeCents).toBe(1000);
    expect(result.netToProviderCents).toBe(0);
  });

  it('a taxa da plataforma nunca invade a do gateway', () => {
    const result = calculateCommission({
      grossCents: 1000,
      platformFee: { kind: 'PERCENTAGE', basisPoints: 5000 }, // 50% = 500
      gatewayFeeCents: 800,
    });
    expect(result.gatewayFeeCents).toBe(800);
    expect(result.platformFeeCents).toBe(200);
    expect(result.netToProviderCents).toBe(0);
  });

  it('mantém a invariante bruto = plataforma + gateway + líquido', () => {
    const cases = [
      { grossCents: 123_45, bps: 1234, gw: 199 },
      { grossCents: 1, bps: 5000, gw: 0 },
      { grossCents: 999_99, bps: 750, gw: 3210 },
      { grossCents: 50_000, bps: 0, gw: 0 },
    ];
    for (const c of cases) {
      const r = calculateCommission({
        grossCents: c.grossCents,
        platformFee: { kind: 'PERCENTAGE', basisPoints: c.bps },
        gatewayFeeCents: c.gw,
      });
      expect(r.platformFeeCents + r.gatewayFeeCents + r.netToProviderCents).toBe(c.grossCents);
    }
  });

  it('rejeita bruto negativo', () => {
    expect(() =>
      calculateCommission({
        grossCents: -1,
        platformFee: { kind: 'FIXED', cents: 0 },
      }),
    ).toThrow();
  });
});
