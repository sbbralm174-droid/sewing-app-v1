import { connectDB } from '@/lib/db';
import AdminInterview from '@/models/AdminInterview';
import Operator from '@/models/Operator'; // Operator মডেল তৈরি করতে হবে

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const body = await request.json();
    
    // আপডেট করার জন্য ফিল্ড
    const { 
      joiningDate, 
      salary, 
      operatorId, 
      designation,
      floor,
      result,
      promotedToOperator,
      remarks 
    } = body;

    // আপডেট করার ডাটা প্রস্তুত
    const updateData = {};
    
    if (joiningDate !== undefined) updateData.joiningDate = joiningDate;
    if (salary !== undefined) updateData.salary = salary;
    if (designation !== undefined) updateData.designation = designation;
    if (floor !== undefined) updateData.floor = floor;
    if (result !== undefined) updateData.result = result;
    if (remarks !== undefined) updateData.remarks = remarks;
    
    // যদি promotedToOperator true হয় এবং operatorId দেয়া থাকে
    if (promotedToOperator && operatorId) {
      updateData.promotedToOperator = promotedToOperator;
      
      // Operator টেবিলে ডাটা সেভ করুন
      const adminInterview = await AdminInterview.findById(id).populate('candidateId');
      
      if (adminInterview) {
        const operatorData = {
          operatorId: operatorId,
          name: adminInterview.candidateId?.name || '',
          nid: adminInterview.candidateId?.nid || '',
          designation: designation || adminInterview.designation || '',
          salary: salary || adminInterview.salary || 0,
          joiningDate: joiningDate || adminInterview.joiningDate || new Date(),
          floor: floor || adminInterview.floor || 'SHAPLA',
          employeeId: operatorId,
          status: 'ACTIVE'
        };

        // Operator তৈরি করুন বা আপডেট করুন
        await Operator.findOneAndUpdate(
          { operatorId: operatorId },
          operatorData,
          { upsert: true, new: true }
        );
      }
    }

    // AdminInterview আপডেট করুন
    const updatedInterview = await AdminInterview.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('candidateId');

    if (!updatedInterview) {
      return Response.json({
        success: false,
        message: 'Interview not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: 'Interview updated successfully',
      data: updatedInterview
    });

  } catch (error) {
    console.error('Update error:', error);
    return Response.json({
      success: false,
      message: error.message || 'Failed to update interview'
    }, { status: 500 });
  }
}