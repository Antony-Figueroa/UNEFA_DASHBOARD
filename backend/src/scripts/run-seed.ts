
import { seedGeographicData } from '../services/address-seed.service.js';

async function run() {
  console.log('Starting seed...');
  await seedGeographicData();
  console.log('Seed finished.');
  process.exit(0);
}

run();
