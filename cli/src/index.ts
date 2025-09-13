#!/usr/bin/env node

import { greet } from '@rs-planner/core';

function main() {
  console.log('RS Planner CLI');
  console.log('==============');
  
  const message = greet('RuneScape Player');
  console.log(message);
  
  // Example of using data
  console.log('\nAvailable commands:');
  console.log('- help: Show this help message');
  console.log('- test: Run test functionality');
  
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help') {
    console.log('\nUsage: rs-planner <command>');
    return;
  }
  
  switch (args[0]) {
    case 'test':
      console.log('\nTesting functionality from lib...');
      console.log('✓ All tests passed!');
      break;
    default:
      console.log(`Unknown command: ${args[0]}`);
      console.log('Use "rs-planner help" for available commands.');
  }
}

if (require.main === module) {
  main();
}
