import { connectDB } from '@/lib/db';
import Machine from '@/models/Machine';
import DailyProduction from '@/models/DailyProduction'; // DailyProduction মডেলটি ইমপোর্ট করুন
import { NextResponse } from 'next/server';
import '@/models/MachineType'; // MachineType পপুলেট করার জন্য

// GET function (সংশোধিত)
export async function GET() {
  try {
    await connectDB();

    // 1. সকল মেশিন fetch করুন
    // .lean() ব্যবহার করে দ্রুত জাভাস্ক্রিপ্ট অবজেক্ট পাওয়া যায়
    const machines = await Machine.find({}).populate('machineType').lean();

    // 2. সকল মেশিনের শেষ ব্যবহারের ডেটা Aggregation দিয়ে একবারে বের করুন
    const lastUsages = await DailyProduction.aggregate([
      {
        $sort: { date: -1 } // তারিখ অনুসারে সাজান (নতুন থেকে পুরানো)
      },
      {
        $group: {
          _id: '$uniqueMachine', // প্রতিটি uniqueMachine এর জন্য গ্রুপ করুন
          lastDate: { $first: '$date' }, // গ্রুপের প্রথম (অর্থাৎ সর্বশেষ) তারিখ নিন
          lastFloor: { $first: '$floor' },
          lastLine: { $first: '$line' }
        }
      },
    ]);

    // 3. Last Usages কে একটি Map এ সংরক্ষণ করুন দ্রুত খোঁজার জন্য
    const lastUsageMap = new Map();
    lastUsages.forEach(usage => {
      const date = usage.lastDate ? new Date(usage.lastDate).toLocaleDateString() : 'N/A';
      const location = `${usage.lastFloor || 'N/A'} - Line ${usage.lastLine || 'N/A'}`;
      
      lastUsageMap.set(usage._id, {
        lastUsageDate: date,
        lastUsageLocation: location
      });
    });

    // 4. সকল মেশিনের ডেটা একত্রিত করুন
    const machinesWithLastUsage = machines.map(machine => {
      const usage = lastUsageMap.get(machine.uniqueId);

      return {
        ...machine,
        lastUsageDate: usage?.lastUsageDate || 'N/A',
        lastUsageLocation: usage?.lastUsageLocation || 'No usage data',
      };
    });

    return NextResponse.json(machinesWithLastUsage);
  } catch (error) {
    console.error('Error fetching machines data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST function (অপরিবর্তিত)
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const machine = await Machine.create(body);
    return NextResponse.json(machine, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}