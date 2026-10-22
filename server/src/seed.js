import { openDatabase, seedMenu, countMenuItems } from './db.js';

const db = openDatabase();
const result = seedMenu(db);
const total = countMenuItems(db);

console.log(`Menu seeded: ${result.categories} categories and ${result.items} dishes (${total} rows).`);
console.log('Existing order data is left untouched.');
db.close();
