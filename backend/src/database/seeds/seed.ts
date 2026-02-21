import dataSource from '../data-source';
import { seedUsers } from './001-users.seed';
import { seedEntities } from './002-entities.seed';
import { seedMaterials } from './003-materials.seed';
import { seedYardLocations } from './004-yard-locations.seed';
import { seedVehicles } from './005-vehicles.seed';
import { seedContracts } from './006-contracts.seed';
import { seedInbounds } from './007-inbounds.seed';
import { seedPurchaseOrders } from './008-purchase-orders.seed';

async function runSeeds() {
  try {
    await dataSource.initialize();
    console.log('Database connected for seeding');

    // Check if already seeded by looking for admin user
    const existingUsers = await dataSource.query(
      `SELECT count(*) FROM "users" WHERE "email" = 'admin@ast.nl'`,
    );
    if (parseInt(existingUsers[0].count, 10) > 0) {
      console.log('Database already seeded, skipping');
      await dataSource.destroy();
      return;
    }

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userIds = await seedUsers(queryRunner);
      const entityIds = await seedEntities(queryRunner);
      const materialIds = await seedMaterials(queryRunner);
      const locationIds = await seedYardLocations(queryRunner);
      const vehicleIds = await seedVehicles(queryRunner, entityIds);
      const contractIds = await seedContracts(queryRunner, entityIds, materialIds);
      const inboundIds = await seedInbounds(
        queryRunner,
        entityIds,
        materialIds,
        contractIds,
        vehicleIds,
        locationIds,
      );
      await seedPurchaseOrders(queryRunner, entityIds, contractIds, inboundIds);

      await queryRunner.commitTransaction();
      console.log('Seeding completed successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Seeding failed, rolled back:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('Seed runner error:', error);
    process.exit(1);
  }
}

runSeeds();
