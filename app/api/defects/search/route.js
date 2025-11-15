import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await connectDB();
    
    // ✅ operatorId, startDate, এবং endDate রিসিভ করা হচ্ছে
    const { operatorId, startDate, endDate } = await request.json(); 
    
    if (!operatorId) {
      return NextResponse.json(
        { error: 'Operator ID is required' },
        { status: 400 }
      );
    }

    // Build query
    let query = {
      'operator.operatorId': operatorId
    };

    // ✅ ডেট রেঞ্জ ফিল্টারিং লজিক
    if (startDate && endDate) {
      const start = new Date(startDate);
      
      // নিশ্চিত করা যে endDate দিনের শেষে (end of day) সেট করা হচ্ছে।
      // উদাহরণস্বরূপ: যদি 2023-01-01 দেওয়া হয়, তাহলে এটি 2023-01-02 এর শুরু পর্যন্ত সার্চ করবে।
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      end.setHours(0, 0, 0, 0); 
      
      query.date = {
        $gte: start,
        $lt: end 
      };
    }
    // Note: যদি শুধুমাত্র startDate দেওয়া হয় এবং endDate না থাকে, তবে শুধুমাত্র startDate-এর পরের ডেটা আসবে। 
    // যদি আপনি চান যে শুধু একটি তারিখ দিলে শুধু সেই দিনের ডেটা আসুক, তবে লজিকটি আরও জটিল করতে হবে।
    // বর্তমান লজিক ডেটাবেস থেকে startDate থেকে শুরু করে endDate পর্যন্ত (endDate inclusive) সমস্ত ডেটা আনবে।

    // Find productions for the operator
    const productions = await DailyProduction.find(query)
      .populate('buyerId', 'name')
      .populate('styleId', 'styleName styleCode')
      .sort({ date: -1 })
      .lean();

    // Calculate total defects and organize by defect type (আপনার সেফ মোড লজিকটি রাখা হয়েছে)
    const defectSummary = {};
    let totalDefects = 0;
    let totalProduction = 0;

    productions.forEach(production => {
      // সেফ মোড: hourlyProduction না থাকলে খালি অ্যারে [] ব্যবহার করা হবে
      (production.hourlyProduction || []).forEach(hour => { 
        totalProduction += hour.productionCount || 0;
        
        // সেফ মোড: defects না থাকলে খালি অ্যারে [] ব্যবহার করা হবে
        (hour.defects || []).forEach(defect => { 
          if (defect.count > 0) {
            totalDefects += defect.count;
            
            const defectKey = defect.defectId?.toString() || defect.code;
            
            if (!defectSummary[defectKey]) {
              defectSummary[defectKey] = {
                defectId: defect.defectId,
                name: defect.name,
                code: defect.code,
                totalCount: 0,
                occurrences: []
              };
            }
            
            defectSummary[defectKey].totalCount += defect.count;
            defectSummary[defectKey].occurrences.push({
              date: production.date,
              hour: hour.hour,
              count: defect.count,
              productionId: production._id,
              line: production.line,
              process: production.process
            });
          }
        });
      });
    });

    // Convert to array and sort by count descending
    const defectsArray = Object.values(defectSummary).sort((a, b) => b.totalCount - a.totalCount);

    return NextResponse.json({
      success: true,
      operator: productions.length > 0 ? productions[0].operator : null,
      totalProductions: productions.length,
      totalProduction,
      totalDefects,
      defectRate: totalProduction > 0 ? ((totalDefects / totalProduction) * 100).toFixed(2) : 0,
      defects: defectsArray,
      productions: productions.map(p => ({
        date: p.date,
        line: p.line,
        process: p.process,
        supervisor: p.supervisor,
        // সেফ মোড: reducer-এও hourlyProduction এর জন্য সুরক্ষা যোগ করা হয়েছে
        totalProduction: (p.hourlyProduction || []).reduce((sum, hour) => sum + (hour.productionCount || 0), 0), 
        // সেফ মোড: nested reducer-এও defects এর জন্য সুরক্ষা যোগ করা হয়েছে
        totalDefects: (p.hourlyProduction || []).reduce((sum, hour) => 
          sum + (hour.defects || []).reduce((defectSum, defect) => defectSum + (defect.count || 0), 0), 0)
      }))
    });

  } catch (error) {
    console.error('Defect search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}