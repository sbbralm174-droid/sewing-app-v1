// app/api/processInformationFromDP/route.js

import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/db";
import DailyProduction from '@/models/DailyProduction';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    
    const date = searchParams.get('date');
    const floor = searchParams.get('floor');
    const line = searchParams.get('line');
    
    // 🔥 সবচেয়ে গুরুত্বপূর্ণ: full process string নেওয়া
    let processQuery = searchParams.get('process') || '';

    const matchStage = {};

    // ============== DATE FILTER ==============
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      matchStage.date = { $gte: start, $lte: end };
    } else {
      // default today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      matchStage.date = { $gte: today, $lte: endOfDay };
    }

    if (floor) matchStage.floor = floor;
    if (line) matchStage.line = line;

    // ============== PROCESS MULTI-WORD SEARCH (Fixed) ==============
    if (processQuery) {
      // & চিহ্ন এবং অতিরিক্ত স্পেস সরিয়ে শব্দগুলো আলাদা করা
      const cleanQuery = processQuery
        .replace(/&/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const words = cleanQuery.split(' ').filter(word => word.length > 0);

      if (words.length > 0) {
        // প্রতিটি শব্দ process অথবা breakdownProcess এ থাকতে হবে
        matchStage.$and = words.map(word => ({
          $or: [
            { process: { $regex: word, $options: 'i' } },
            { breakdownProcess: { $regex: word, $options: 'i' } }
          ]
        }));
      }
    }

    // ============== AGGREGATION ==============
    const pipeline = [
      { $match: matchStage },

      {
        $addFields: {
          effectiveProcess: {
            $trim: {
              input: {
                $cond: [
                  { $and: [{ $ne: ["$breakdownProcess", null] }, { $ne: ["$breakdownProcess", ""] }] },
                  "$breakdownProcess",
                  "$process"
                ]
              }
            }
          },
          smv: "$smv"
        }
      },

      {
        $group: {
          _id: { process: "$effectiveProcess", line: "$line" },
          usageCount: { $sum: 1 },
          smv: { $first: "$smv" }
        }
      },

      {
        $group: {
          _id: "$_id.process",
          smv: { $first: "$smv" },
          totalUsage: { $sum: "$usageCount" },
          lineWise: {
            $push: { line: "$_id.line", count: "$usageCount" }
          }
        }
      },

      { $sort: { totalUsage: -1 } },

      {
        $project: {
          _id: 0,
          process: "$_id",
          smv: 1,
          totalUsage: 1,
          lineWise: 1
        }
      }
    ];

    const results = await DailyProduction.aggregate(pipeline);

    return NextResponse.json({
      success: true,
      data: results,
      totalProcesses: results.length,
      filtersApplied: {
        date: date || "today",
        searchedProcess: processQuery || "all"
      },
      message: processQuery 
        ? `"${processQuery}" এর স্ট্যাটিসটিক্স (সব শব্দ মিলিয়ে)` 
        : "আজকের সব প্রসেসের তথ্য"
    });

  } catch (error) {
    console.error("Process Stats Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}