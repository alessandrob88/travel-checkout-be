import { execSync } from 'child_process';

export const runSeed = () => {
  console.log('Running seed...');
  execSync('npm run seed:run', { stdio: 'inherit' });
};

export const truncateSeed = () => {
  console.log('Truncating database...');
  execSync('npm run seed:truncate', { stdio: 'inherit' });
};
