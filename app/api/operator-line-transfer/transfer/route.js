import { connectDB } from "@/lib/db";
import DailyProduction from "@/models/DailyProduction";
import HistoryDailyProduction from "@/models/HistoryDailyProduction";
import mongoose from 'mongoose';

export async function POST(request) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    await connectDB();
    
    const body = await request.json();
    const { 
      operatorId, 
      date, 
      newLine, 
      workingHoursInPreviousLine, // ফ্রন্টেন্ড থেকে পাঠানো মোট মিনিট (যেমন: ১৮০)
      transferredBy 
    } = body;
    
    // ১. ফিল্ড ভ্যালিডেশন
    if (!operatorId || !date || !newLine || workingHoursInPreviousLine === undefined) {
      return new Response(
        JSON.stringify({ success: false, message: 'সবগুলো তথ্য প্রদান করা হয়নি।' }), 
        { status: 400 }
      );
    }
    
    const transferDate = new Date(date);
    const startOfDay = new Date(new Date(transferDate).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(transferDate).setHours(23, 59, 59, 999));

    // ২. হিস্ট্রি থেকে ওই অপারেটরের আজকের আগের জমানো মিনিট বের করা
    const historyStats = await HistoryDailyProduction.aggregate([
      {
        $match: {
          "operator.operatorId": operatorId,
          date: { $gte: startOfDay, $lte: endOfDay },
          action: 'line_change'
        }
      },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: "$previousLineWorkingTime" }
        }
      }
    ]).session(session);

    const alreadySavedMinutes = historyStats.length > 0 ? historyStats[0].totalMinutes : 0;
    
    // ৩. নিট মিনিট ক্যালকুলেশন (যেমন: ১৮০ - ১২০ = ৬০)
    const netMinutesToSave = workingHoursInPreviousLine - alreadySavedMinutes;

    // ৪. জিরো বা নেগেটিভ ভ্যালু চেক (ট্রান্সফার বন্ধ করার লজিক)
    if (netMinutesToSave <= 0) {
      await session.abortTransaction();
      session.endSession();
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `ট্রান্সফার ব্যর্থ! অপারেটর ইতিমধ্যে ${alreadySavedMinutes} মিনিট কাজ করেছেন। বর্তমান সময় অনুযায়ী নতুন কোনো কাজের সময় অবশিষ্ট নেই।` 
        }), 
        { status: 400 }
      );
    }

    // ৫. বর্তমান DailyProduction ডাটা খুঁজে বের করা
    const existingData = await DailyProduction.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
      "operator.operatorId": operatorId
    }).session(session);
    
    if (!existingData) {
      await session.abortTransaction();
      session.endSession();
      return new Response(
        JSON.stringify({ success: false, message: 'এই অপারেটরের কোনো প্রোডাকশন ডাটা পাওয়া যায়নি।' }), 
        { status: 404 }
      );
    }
    
    // ৬. নতুন লাইনের কমন ডাটা সংগ্রহ করা (Auto-fill এর জন্য)
    const commonFieldData = await DailyProduction.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
      line: newLine,
      "operator.operatorId": { $ne: operatorId }
    }).session(session);
    
    if (!commonFieldData) {
      await session.abortTransaction();
      session.endSession();
      return new Response(
        JSON.stringify({ success: false, message: 'টার্গেট লাইনে (New Line) কোনো ডাটা পাওয়া যায়নি।' }), 
        { status: 404 }
      );
    }
    
    // ৭. হিস্ট্রিতে ডাটা সেভ করা (শুধুমাত্র নিট মিনিটটুকু)
    const historyDoc = new HistoryDailyProduction({
      ...existingData.toObject(),
      originalId: existingData._id,
      previousLineWorkingTime: netMinutesToSave, 
      action: 'line_change',
      movedToLine: newLine,
      movedAt: new Date(),
      transferredBy: transferredBy || 'system'
    });
    await historyDoc.save({ session });
    
    // ৮. পুরনো রেকর্ড ডিলিট করা
    await DailyProduction.findByIdAndDelete(existingData._id).session(session);
    
    // ৯. নতুন লাইনে নতুন রেকর্ড তৈরি করা
    const newProductionData = new DailyProduction({
      ...existingData.toObject(),
      _id: new mongoose.Types.ObjectId(), // নতুন আইডি নিশ্চিত করা
      line: newLine,
      supervisor: commonFieldData.supervisor,
      floor: commonFieldData.floor,
      jobNo: commonFieldData.jobNo,
      buyerId: commonFieldData.buyerId,
      styleId: commonFieldData.styleId,
      supervisorId: commonFieldData.supervisorId,
      floorId: commonFieldData.floorId,
      lineId: commonFieldData.lineId,
      previousLineWorkingTime: 0, // মেইন টেবিলে এখন ০ থাকবে
      hourlyProduction: [] // নতুন লাইনে নতুন করে প্রোডাকশন শুরু হবে
    });
    
    await newProductionData.save({ session });
    
    // ট্রানজ্যাকশন সম্পন্ন করা
    await session.commitTransaction();
    session.endSession();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'সাফল্যের সাথে লাইন ট্রান্সফার হয়েছে।',
        netMinutesSaved: netMinutesToSave 
      }), 
      { status: 200 }
    );
    
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    session.endSession();
    console.error('Transfer API Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।' }), 
      { status: 500 }
    );
  }
}