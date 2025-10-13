import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOffersTable1704358963000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE offer_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'expired');
      
      CREATE TABLE IF NOT EXISTS offers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "advertiserId" UUID NOT NULL,
        "bloggerId" UUID NOT NULL,
        message TEXT NOT NULL,
        "proposedBudget" DECIMAL(10,2) NOT NULL,
        status offer_status_enum DEFAULT 'pending',
        "projectTitle" VARCHAR(255),
        "projectDescription" TEXT,
        format VARCHAR(50),
        deadline TIMESTAMP,
        "rejectionReason" TEXT,
        "acceptedAt" TIMESTAMP,
        "rejectedAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_offers_advertiser FOREIGN KEY ("advertiserId") 
          REFERENCES advertisers(id) ON DELETE CASCADE,
        CONSTRAINT fk_offers_blogger FOREIGN KEY ("bloggerId") 
          REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE INDEX idx_offers_advertiser ON offers("advertiserId");
      CREATE INDEX idx_offers_blogger ON offers("bloggerId");
      CREATE INDEX idx_offers_status ON offers(status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS offers;
      DROP TYPE IF EXISTS offer_status_enum;
    `);
  }
}









