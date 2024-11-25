import { createDataSource } from './datasource';

(async () => {
  const dataSource = createDataSource();
  await dataSource.initialize();

  try {
    console.log('Truncating tables...');
    const entities = dataSource.entityMetadatas;

    for (const { name, tableName } of entities) {
      console.log(`Truncating table: ${tableName} (entity: ${name})...`);
      const repository = dataSource.getRepository(name);
      await repository.query(
        `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`,
      );
    }

    console.log('All tables truncated successfully!');
  } catch (error) {
    console.error('Error truncating tables:', error);
  } finally {
    await dataSource.destroy();
  }
})();
