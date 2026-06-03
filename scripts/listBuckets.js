import { Storage } from '@google-cloud/storage';

const storage = new Storage({}); // Uses ADC

async function run() {
    try {
        const [buckets] = await storage.getBuckets();
        console.log("Buckets:");
        buckets.forEach(b => console.log(b.name));
    } catch(e) {
        console.error("Error:", e);
    }
}
run();
