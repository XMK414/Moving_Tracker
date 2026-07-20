const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();
console.log('Add these to your Netlify environment variables:\n');
console.log('VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
console.log('VAPID_EMAIL=mailto:your@email.com');
console.log('\nAlso add VITE_VAPID_PUBLIC_KEY=' + keys.publicKey);
