// Generates a stable key pair locally. Never print the private key.
const fs = require('node:fs');
const path = require('node:path');
const webpush = require('../backend/node_modules/web-push');
const subject = process.argv[2] || '';
if (!/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/.test(subject) && !/^https:\/\/[^\s]+$/.test(subject)) {
  console.error('Uso: node scripts/create-vapid.cjs mailto:admin@dominio-real.pt');
  process.exit(1);
}
const folder = path.join(__dirname, '..', '.secrets');
const file = path.join(folder, 'webpush.env');
fs.mkdirSync(folder, { recursive: true, mode: 0o700 });
try {
  const fd = fs.openSync(file, 'wx', 0o600);
  try {
    const pair = webpush.generateVAPIDKeys();
    fs.writeFileSync(fd, `VAPID_PUBLIC_KEY=${pair.publicKey}\nVAPID_PRIVATE_KEY=${pair.privateKey}\nVAPID_SUBJECT=${subject}\n`);
  } finally { fs.closeSync(fd); }
  console.log('Chaves criadas em .secrets/webpush.env com acesso privado. Guarde-as num gestor de segredos e faça cópia segura.');
} catch (err) {
  if (err.code === 'EEXIST') console.error('As chaves já existem. Não foram alteradas: alterá-las invalida as subscrições existentes.');
  else console.error('Não foi possível criar as chaves:', err.message);
  process.exit(1);
}
