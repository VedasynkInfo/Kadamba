import 'dotenv/config';
import mongoose from 'mongoose';
import { Customer } from './src/models/Customer';
import { MeasurementTemplate } from './src/models/MeasurementTemplate';
import { seedTemplates } from './src/services/measurementTemplateService';

/**
 * Seeds measurement templates and (optionally) sample customers.
 *
 * NOTE: Admin accounts are intentionally NOT created here. Use the secure,
 * env-driven bootstrap instead so no credentials are ever committed:
 *
 *   ADMIN_NAME="..." ADMIN_EMAIL="..." ADMIN_PASSWORD="..." npm run seed:admin
 */
async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kadamba';
  console.log(`Connecting to: ${uri}`);
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // 1. Seed sample customers
  const sampleCustomers = [
    { name: 'Priya Sharma', phone: '9876543210', city: 'Kurnool' },
    { name: 'Ananya Reddy', phone: '9876543211', city: 'Kurnool' },
    { name: 'Lakshmi Devi', phone: '9876543212', city: 'Kurnool', email: 'lakshmi@example.com' },
    { name: 'Sita Rao', phone: '9876543213', city: 'Kurnool' },
    { name: 'Meera Patel', phone: '9876543214', city: 'Kurnool' },
  ];
  const existingCustomers = await Customer.countDocuments();
  if (existingCustomers === 0 || process.argv.includes('--force')) {
    if (existingCustomers > 0 && process.argv.includes('--force')) {
      await Customer.deleteMany({});
      console.log('Cleared customers for re-seed');
    }
    await Customer.insertMany(sampleCustomers);
    console.log(`Inserted ${sampleCustomers.length} sample customers`);
  } else {
    console.log(`${existingCustomers} customers already exist`);
  }

  // 2. Seed templates
  const before = await MeasurementTemplate.countDocuments();
  console.log(`Templates before: ${before}`);
  if (before > 0 && !process.argv.includes('--force')) {
    console.log('Already seeded. Use --force to re-seed.');
  } else {
    if (before > 0) {
      await mongoose.connection.dropCollection('measurementtemplates').catch(() => {});
      console.log('Dropped collection to remove stale unique indexes');
    }
    const result = await seedTemplates();
    console.log(`Seed result: ${JSON.stringify(result)}`);
  }

  const after = await MeasurementTemplate.countDocuments();
  console.log(`Total templates: ${after}`);

  await mongoose.disconnect();
  console.log('Done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});