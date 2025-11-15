// Next.js App Router API Route Handler
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import DailyProduction from '@/models/DailyProduction'; // আপনার মডেল ইম্পোর্ট করুন
// dbConnect ইম্পোর্ট করার প্রয়োজন হলে এখানে করুন, যেমন: import dbConnect from '@/lib/dbConnect';

// ----------------------------------------------------

export async function GET(request) {
    try {
        // ডেটাবেস কানেকশন স্থাপন করুন (যদি dbConnect ব্যবহার করেন)
        // await dbConnect(); 

        const { searchParams } = new URL(request.url);
        const operatorId = searchParams.get('operatorId');
        const process = searchParams.get('process');

        if (!operatorId || !process) {
            return NextResponse.json(
                { message: 'Operator ID এবং Process উভয়ই প্রয়োজন।' },
                { status: 400 }
            );
        }
        
        // ----------------------------------------------------------------
        // Mongoose Aggregation Pipeline
        // ----------------------------------------------------------------
        const result = await DailyProduction.aggregate([
            // 1. ফিল্টারিং: নির্দিষ্ট operatorId এবং process ম্যাচ করা
            {
                $match: {
                    'operator.operatorId': operatorId,
                    'process': process,
                },
            },
            // 2. ডেটা ডিসট্রাকচারিং: hourlyProduction অ্যারের প্রতিটি এলিমেন্টকে আলাদা রো-তে আনা
            {
                $unwind: '$hourlyProduction',
            },
            // 3. গ্রুপিং এবং যোগফল: ডেইলি প্রোডাকশন ডকুমেন্ট ID অনুযায়ী গ্রুপিং করে মোট অ্যাচিভমেন্ট বের করা
            {
                $group: {
                    _id: '$_id', // ডেইলি প্রোডাকশন ডকুমেন্ট ID
                    date: { $first: '$date' }, // দিনের তারিখ
                    totalAchievement: { $sum: '$hourlyProduction.productionCount' }, // hourlyProduction-এর মোট যোগফল
                },
            },
            // 4. সর্টিং: মোট অ্যাচিভমেন্ট-এর ভিত্তিতে ডিসেন্ডিং অর্ডারে সাজানো
            {
                $sort: {
                    totalAchievement: -1,
                },
            },
            // 5. লিমিটিং: সর্বোচ্চ এবং দ্বিতীয় সর্বোচ্চ অ্যাচিভমেন্টসহ প্রথম দুটি ডকুমেন্ট নেওয়া
            {
                $limit: 2, // <-- পরিবর্তন
            },
        ]);
        // ----------------------------------------------------------------

        if (result.length === 0) {
            return NextResponse.json(
                { message: `Operator ID: ${operatorId} এবং Process: ${process}-এর জন্য কোনো ডেটা পাওয়া যায়নি।` },
                { status: 404 }
            );
        }

        // ----------------------------------------------------------------
        // ডেটা এক্সট্র্যাকশন
        // ----------------------------------------------------------------
        const maxAchievementData = result[0];
        // দ্বিতীয় সর্বোচ্চ স্কোর: যদি অ্যারেতে কমপক্ষে 2টি এন্ট্রি থাকে
        const secondMaxAchievementData = result.length > 1 ? result[1] : null; 

        // UI-তে পাঠানোর জন্য প্রয়োজনীয় ডেটা ফেরত দেওয়া
        return NextResponse.json({
            operatorId: operatorId,
            process: process,

            // সর্বোচ্চ অ্যাচিভমেন্ট (Highest)
            maxAchievement: maxAchievementData.totalAchievement,
            dateOfMax: maxAchievementData.date, 

            // দ্বিতীয় সর্বোচ্চ অ্যাচিভমেন্ট (Second Highest)
            secondMaxAchievement: secondMaxAchievementData ? secondMaxAchievementData.totalAchievement : null,
            dateOfSecondMax: secondMaxAchievementData ? secondMaxAchievementData.date : null,
            
            // দ্বিতীয় সর্বোচ্চ স্কোর না পেলে, মেসেজ দিতে পারেন
            hasSecondMax: result.length > 1,
        });

    } catch (error) {
        console.error('API Error in Max Achievement:', error);
        return NextResponse.json(
            { message: 'সার্ভার ত্রুটি, সর্বোচ্চ ও দ্বিতীয় সর্বোচ্চ অ্যাচিভমেন্ট খুঁজে বের করা যায়নি।', error: error.message },
            { status: 500 }
        );
    }
}