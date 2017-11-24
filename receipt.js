import { Receipt } from 'poker-helper';

function run(receipt) {
  console.log(Receipt.parse(receipt));
}

if (!process.argv[2]) {
  console.log('Usage: npm start receipt <signedReceipt>');
  process.exit(0);
}

run(process.argv[2]);
