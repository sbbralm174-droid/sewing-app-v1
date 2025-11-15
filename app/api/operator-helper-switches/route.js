// app/api/operator-helper-switches/route.js
import { connectDB } from '@/lib/db';
import DailyProduction from '@/models/DailyProduction';
import Operator from '@/models/Operator';




export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    console.log('Request received for date:', date);
    
    if (!date) {
      return Response.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    const selectedDate = new Date(date);
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);

    console.log('Fetching data for date range:', selectedDate, nextDate);

    // তারিখভিত্তিক ডেটা fetch করুন
    const dailyProductions = await DailyProduction.find({
      date: {
        $gte: selectedDate,
        $lt: nextDate
      }
    })
    .populate('operator._id')
    .populate('buyerId')
    .populate('styleId')
    .lean();

    console.log('Found productions:', dailyProductions.length);

    // অপারেটররা যারা হেল্পার হিসেবে কাজ করেছে
    const operatorsAsHelpers = dailyProductions.filter(prod => 
      prod.operator && prod.operator.designation === 'operator' && prod.workAs === 'helper'
    );

    // হেল্পাররা যারা অপারেটর হিসেবে কাজ করেছে
    const helpersAsOperators = dailyProductions.filter(prod => 
      prod.operator && prod.operator.designation === 'helper' && prod.workAs === 'operator'
    );

    console.log('Operators as helpers:', operatorsAsHelpers.length);
    console.log('Helpers as operators:', helpersAsOperators.length);

    const result = {
      date: selectedDate.toISOString().split('T')[0],
      operatorsAsHelpers: {
        count: operatorsAsHelpers.length,
        employees: operatorsAsHelpers.map(emp => ({
          id: emp.operator?._id?._id || emp.operator?._id,
          operatorId: emp.operator?.operatorId || 'N/A',
          name: emp.operator?.name || 'Unknown',
          designation: emp.operator?.designation || 'Unknown',
          workAs: emp.workAs,
          floor: emp.floor,
          line: emp.line,
          process: emp.process,
          supervisor: emp.supervisor
        }))
      },
      helpersAsOperators: {
        count: helpersAsOperators.length,
        employees: helpersAsOperators.map(emp => ({
          id: emp.operator?._id?._id || emp.operator?._id,
          operatorId: emp.operator?.operatorId || 'N/A',
          name: emp.operator?.name || 'Unknown',
          designation: emp.operator?.designation || 'Unknown',
          workAs: emp.workAs,
          floor: emp.floor,
          line: emp.line,
          process: emp.process,
          supervisor: emp.supervisor
        }))
      },
      totalSwitches: operatorsAsHelpers.length + helpersAsOperators.length
    };

    return Response.json(result);
  } catch (error) {
    console.error('Error fetching operator-helper switches:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}