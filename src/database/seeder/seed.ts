import { DataSource } from 'typeorm';

import { Mood } from '../../domains/travel/entities/mood.entity';
import { Travel } from '../../domains/travel/entities/travel.entity';
import { User } from '../../domains/user/user.entity';
import { Booking, BookingStatus } from '../../domains/booking/booking.entity';
import { MoodType } from '../../domains/travel/mood-type.enum';

import { createDataSource } from './datasource';
import * as travelData from './seed-data/travels.json';
import * as userData from './seed-data/users.json';
import * as bookingData from './seed-data/bookings.json';

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

const seedUserData = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(User);

  for (const user of userData) {
    console.log(`Seeding user: ${user.id}`);
    const newTravel = userRepository.create(user);

    await userRepository.save(newTravel);
  }
};

const seedBookingData = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(User);
  const travelRepository = dataSource.getRepository(Travel);
  const bookingRepository = dataSource.getRepository(Booking);

  for (const booking of bookingData) {
    console.log(`Seeding booking: ${booking.id}`);

    const user = await userRepository.findOneBy({ id: booking.user.id });
    const travel = await travelRepository.findOneBy({ id: booking.travel.id });

    await bookingRepository.save({
      user,
      travel,
      selectedSeats: booking.selectedSeats,
      expirationTime: booking.expirationTime,
      totalPrice: booking.totalPrice,
      status: booking.status as BookingStatus,
    });
  }
};

(async () => {
  const dataSource = createDataSource();
  await dataSource.initialize();

  try {
    await seedTravelData(dataSource);
    await seedUserData(dataSource);
    await seedBookingData(dataSource);
    console.log('Seed completed with success!');
    await dataSource.destroy();
  } catch (error) {
    console.error('Error while seeding:', error);
  }
})();
