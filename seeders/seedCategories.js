const Category = require('../models/Category');

const defaultCategories = [
  { name: 'Road Damage', slug: 'road-damage', icon: '🛣️', description: 'Potholes, broken roads, damaged pavements' },
  { name: 'Blocked Drainage', slug: 'blocked-drainage', icon: '🌊', description: 'Clogged drains, sewage overflow' },
  { name: 'Street Light', slug: 'street-light', icon: '💡', description: 'Broken or flickering street lights' },
  { name: 'Power Fault', slug: 'power-fault', icon: '⚡', description: 'Electrical faults, outages, exposed wires' },
  { name: 'Water Supply', slug: 'water-supply', icon: '💧', description: 'No water, pipe leaks, contaminated water' },
  { name: 'Waste Management', slug: 'waste-management', icon: '🗑️', description: 'Uncollected garbage, illegal dumping' },
  { name: 'Public Safety', slug: 'public-safety', icon: '🚨', description: 'Safety hazards, crime concerns' },
  { name: 'Flooding', slug: 'flooding', icon: '🌧️', description: 'Flooded streets, waterlogging' },
  { name: 'Traffic Problem', slug: 'traffic-problem', icon: '🚦', description: 'Traffic congestion, broken signals' },
  { name: 'Environmental Issue', slug: 'environmental-issue', icon: '🌿', description: 'Pollution, deforestation, erosion' },
  { name: 'Public Facility', slug: 'public-facility', icon: '🏛️', description: 'Damaged parks, public buildings, benches' },
  { name: 'Other', slug: 'other', icon: '📋', description: 'Other community issues' }
];

const seedCategories = async () => {
  for (const cat of defaultCategories) {
    await Category.findOneAndUpdate(
      { slug: cat.slug },
      cat,
      { upsert: true, returnDocument: 'after' }
    );
  }
  console.log('Categories seeded successfully');
};

module.exports = seedCategories;