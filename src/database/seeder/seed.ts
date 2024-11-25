import { DataSource } from 'typeorm';
import { Mood } from '../../domains/travel/entities/mood.entity';
import { Travel } from '../../domains/travel/entities/travel.entity';
import { MoodType } from '../../domains/travel/enums/mood-type.enum';

import { createDataSource } from './datasource';
import * as travelData from './seed-data/travels.json';

const seedTravelData = async (dataSource: DataSource) => {
  const travelRepository = dataSource.getRepository(Travel);
  const moodRepository = dataSource.getRepository(Mood);

  for (const travel of travelData) {
    console.log(`Seeding travel: ${travel.id}`);
    const newTravel = travelRepository.create({
      ...travel,
      moods: Object.entries(travel.moods).map(([moodType, score]) =>
        moodRepository.create({
          mood: moodType as MoodType,
          score,
        }),
      ),
    });

    await travelRepository.save(newTravel);
  }
};

(async () => {
  const dataSource = createDataSource();
  await dataSource.initialize();

  try {
    await seedTravelData(dataSource);
    console.log('Seed completed with success!');
    await dataSource.destroy();
  } catch (error) {
    console.error('Error while seeding:', error);
  }
})();
