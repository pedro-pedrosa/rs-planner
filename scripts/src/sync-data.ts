import { loadGameData } from '@rs-planner/core';

/**
 * Example script to sync skill data from external sources
 */
async function syncSkillData() {
  console.log('🔄 Syncing skill data...');
  
  try {
    // In a real implementation, this would fetch from an API
    // For now, we'll just validate our existing data
    const skills = await loadGameData('skills.json');
    console.log(`✅ Found ${(skills as any).skills.length} skills in data/skills.json`);
    
    const woodcuttingData = await loadGameData('woodcutting.json');
    console.log(`✅ Found ${(woodcuttingData as any).items.length} woodcutting items in data/woodcutting.json`);
    
    console.log('✅ Data sync completed successfully!');
  } catch (error) {
    console.error('❌ Error syncing data:', error);
    process.exit(1);
  }
}

/**
 * Main function to run the sync process
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npm run sync-data <command>');
    console.log('Commands:');
    console.log('  skills    - Sync skill data');
    console.log('  items     - Sync item data');
    console.log('  all       - Sync all data');
    return;
  }
  
  switch (args[0]) {
    case 'skills':
    case 'items':
    case 'all':
      await syncSkillData();
      break;
    default:
      console.log(`Unknown command: ${args[0]}`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
