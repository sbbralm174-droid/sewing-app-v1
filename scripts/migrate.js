// একটি অস্থায়ী ফাইল তৈরি করুন, যেমন: scripts/migrate.js

import mongoose from 'mongoose';
import Operator from '@/models/Operator'; 
import connectDB from '@/lib/mongodb'; 

async function migrate() {
  await connectDB();
  console.log("Starting migration...");

  const result = await Operator.updateMany(
    { occurrenceReport: { $type: 2 } }, // $type: 2 মানে MongoDB-তে String
    { $set: { occurrenceReport: [] } } // খালি অ্যারেতে সেট করুন
  );

  console.log(`Migration complete. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
  
  // একটি Operator ডকুমেন্ট চেক করুন
  const checkDoc = await Operator.findOne({ operatorId: 'TGS-005790' });
  console.log("Checked occurrenceReport type:", Array.isArray(checkDoc.occurrenceReport));
  
  mongoose.connection.close();
}

migrate();