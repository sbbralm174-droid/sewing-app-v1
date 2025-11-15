import { connectDB } from '@/lib/db';
import Process from '@/models/UniqueProcess';
import Buyer from '@/models/Buyer';

export async function POST(request) {
  try {
    await connectDB();
    const { processes, selectedBuyers } = await request.json();

    if (!processes || processes.length === 0 || !selectedBuyers || selectedBuyers.length === 0) {
      return Response.json({
        success: false,
        error: 'Process names and at least one buyer is required'
      }, { status: 400 });
    }

    const results = [];
    const errors = [];

    // Process each process name for each selected buyer
    for (const processName of processes) {
      for (const buyerId of selectedBuyers) {
        try {
          // Check if buyer exists
          const buyer = await Buyer.findById(buyerId);
          if (!buyer) {
            errors.push(`Buyer not found: ${buyerId}`);
            continue;
          }

          // Generate unique ID
          const uniqueId = `${processName.trim()}-${buyer.name}`
            .replace(/\s+/g, '_')
            .toUpperCase();

          // Check if process already exists
          const existingProcess = await Process.findOne({ uniqueId });
          if (existingProcess) {
            results.push({
              processName: processName.trim(),
              buyer: buyer.name,
              uniqueId,
              status: 'skipped',
              message: 'Process already exists'
            });
            continue;
          }

          // Create new process
          const newProcess = new Process({
            processName: processName.trim(),
            buyerName: buyer.name,
            uniqueId,
            buyerId: buyer._id
          });

          await newProcess.save();
          
          results.push({
            processName: processName.trim(),
            buyer: buyer.name,
            uniqueId,
            status: 'created',
            message: 'Process created successfully'
          });

        } catch (error) {
          if (error.code === 11000) {
            // Duplicate key error
            results.push({
              processName: processName.trim(),
              buyer: buyer.name,
              uniqueId,
              status: 'skipped',
              message: 'Process already exists'
            });
          } else {
            errors.push(`Error for process "${processName}" and buyer ${buyerId}: ${error.message}`);
          }
        }
      }
    }

    return Response.json({
      success: true,
      data: results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const processes = await Process.find({})
      .populate('buyerId', 'name')
      .sort({ createdAt: -1 });
    
    return Response.json({
      success: true,
      data: processes
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Delete a process
export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({
        success: false,
        error: 'Process ID is required'
      }, { status: 400 });
    }

    const deletedProcess = await Process.findByIdAndDelete(id);
    
    if (!deletedProcess) {
      return Response.json({
        success: false,
        error: 'Process not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: 'Process deleted successfully'
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}