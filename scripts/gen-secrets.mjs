// Generates VAPID keys and a CRON_SECRET. Paste the output into .env.local and Vercel.
import webpush from "web-push";
import crypto from "node:crypto";

const vapid = webpush.generateVAPIDKeys();
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapid.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapid.privateKey}`);
console.log(`CRON_SECRET=${crypto.randomBytes(32).toString("hex")}`);
