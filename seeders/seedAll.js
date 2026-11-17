require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Issue = require('../models/Issue');
const Category = require('../models/Category');
const StatusHistory = require('../models/StatusHistory');
const seedCategories = require('./seedCategories');

const seedAll = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for full seeding...');

    // 1. Seed Categories
    await seedCategories();

    // 2. Create Admin
    const adminEmail = 'admin@civicfix.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: 'Admin123!',
        role: 'admin',
        city: 'Abuja',
        state: 'FCT'
      });
      console.log(`👑 Admin created: ${adminEmail} / Admin123!`);
    } else {
      console.log(`👑 Admin already exists: ${adminEmail}`);
    }

    // 3. Create Moderator
    const modEmail = 'moderator@civicfix.com';
    let mod = await User.findOne({ email: modEmail });
    if (!mod) {
      mod = await User.create({
        name: 'Jane Moderator',
        email: modEmail,
        password: 'Mod1234!', // Fixed: now 8 characters
        role: 'moderator',
        city: 'Owerri',
        state: 'Imo'
      });
      console.log(`🛡️ Moderator created: ${modEmail} / Mod1234!`);
    } else {
      console.log(`🛡️ Moderator already exists: ${modEmail}`);
    }

    // 4. Create Demo Resident
    const residentEmail = 'resident@civicfix.com';
    let resident = await User.findOne({ email: residentEmail });
    if (!resident) {
      resident = await User.create({
        name: 'Don Steve',
        email: residentEmail,
        password: 'Resident123!',
        role: 'resident',
        city: 'Lagos',
        state: 'Lagos'
      });
      console.log(`👤 Resident created: ${residentEmail} / Resident123!`);
    } else {
      console.log(`👤 Resident already exists: ${residentEmail}`);
    }

    // 5. Create Demo Issues (if none exist)
    const issueCount = await Issue.countDocuments();
    if (issueCount === 0) {
      const cats = await Category.find().limit(3);
      if (cats.length < 3) {
        console.log('⚠️ Not enough categories to create demo issues.');
      } else {
        const issue1 = await Issue.create({
          reference: `CIV-${new Date().getFullYear()}-00001`,
          title: 'Large pothole on Main Market Road',
          description: 'A very deep pothole is causing traffic and damaging vehicles.',
          category: cats[0]._id,
          reporter: resident._id,
          status: 'IN PROGRESS',
          priority: 'High',
          location: 'Main Market Road',
          city: 'Owerri',
          state: 'Imo',
          country: 'Nigeria',
          followers: [resident._id],
          followerCount: 1
        });

        await StatusHistory.create([
          { issue: issue1._id, previousStatus: 'NONE', newStatus: 'REPORTED', changedBy: resident._id, note: 'Issue reported' },
          { issue: issue1._id, previousStatus: 'REPORTED', newStatus: 'VERIFIED', changedBy: mod._id, note: 'Verified by moderator' },
          { issue: issue1._id, previousStatus: 'VERIFIED', newStatus: 'IN PROGRESS', changedBy: mod._id, note: 'Contractors assigned' }
        ]);

        const issue2 = await Issue.create({
          reference: `CIV-${new Date().getFullYear()}-00002`,
          title: 'Streetlights out in Phase 2',
          description: 'The entire street has been dark for 3 weeks. Safety concern.',
          category: cats[1]._id,
          reporter: resident._id,
          status: 'REPORTED',
          priority: 'Medium',
          location: 'Phase 2 Layout',
          city: 'Abuja',
          state: 'FCT',
          country: 'Nigeria'
        });

        await StatusHistory.create({
          issue: issue2._id, previousStatus: 'NONE', newStatus: 'REPORTED', changedBy: resident._id, note: 'Issue reported'
        });

        console.log('📋 Demo issues created.');
      }
    } else {
      console.log(`📋 Issues already exist (${issueCount}). Skipping demo issue creation.`);
    }

    console.log('✅ Seeding complete.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seedAll();