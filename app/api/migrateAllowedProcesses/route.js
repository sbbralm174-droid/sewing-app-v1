import mongoose from 'mongoose';
import Operator from '../../../models/Operator';
import { NextResponse } from 'next/server';

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGODB_URI);
}

export async function POST(req) {
  try {
    await connectDB();

    const operators = await Operator.find({});
    let updatedCount = 0;

    for (const op of operators) {
      if (Array.isArray(op.allowedProcesses) && op.allowedProcesses.length > 0) {
        const newMap = {};

        // প্রতিটা string কে key বানাও, value = 0
        op.allowedProcesses.forEach(item => {
          if (typeof item === 'string') {
            newMap[item] = 0; 
          }
        });

        op.allowedProcesses = newMap;
        await op.save();
        updatedCount++;
      }
    }

    console.log(`Migration completed! Updated ${updatedCount} operators.`);

    return NextResponse.json({
      message: `Migration completed! Updated ${updatedCount} operators.`
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: 'Migration failed', error: err.message },
      { status: 500 }
    );
  }
}
