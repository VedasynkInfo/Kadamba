import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './src/models/User';
import { Customer } from './src/models/Customer';
import { MeasurementTemplate } from './src/models/MeasurementTemplate';
import { seedTemplates } from './src/services/measurementTemplateService';

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kadamba';
  console.log(`Connecting to: ${uri}`);
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // 1. Seed admin user
  const existing = await User.findOne({ email: 'admin@kadamba.local' });
  if (!existing) {
    await User.create({
      name: 'Admin',
      email: 'admin@kadambastudio.com',
      password: 'Kadamba@9898',
      role: 'admin',
    });
    console.log('Created admin user');
  } else {
    console.log('Admin user already exists');
  }

  // 1b. Seed sample customers
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