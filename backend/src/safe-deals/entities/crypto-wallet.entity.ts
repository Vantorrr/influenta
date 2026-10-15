import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum CryptoNetwork {
  TRC20 = 'TRC20',
  ERC20 = 'ERC20',
  BEP20 = 'BEP20',
  BTC = 'BTC',
  TON = 'TON',
}

export enum CryptoCurrency {
  USDT = 'USDT',
  USDC = 'USDC',
  BTC = 'BTC',
  TON = 'TON',
}

/**
 * Крипто-кошельки платформы для безопасных сделок.
 * Управление вручную через админку / ТП.
 */
@Entity('crypto_wallets')
export class CryptoWallet extends BaseEntity {
  @Column({ type: 'varchar', length: 64 })
  label: string;

  @Index('idx_crypto_wallets_network')
  @Column({ type: 'varchar', length: 16, default: CryptoNetwork.TRC20 })
  network: CryptoNetwork | string;

  @Column({ type: 'varchar', length: 16, default: CryptoCurrency.USDT })
  currency: CryptoCurrency | string;

  @Column({ type: 'varchar', length: 256 })
  address: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
