import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { connectDB } from '@/lib/db';
import { Breakdown } from '@/models/Breakdown';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('excelFile');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ message: 'No file found.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = 'BREAKDOWN';
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      return NextResponse.json({ message: `"${sheetName}" tab not found.` }, { status: 404 });
    }

    // 1. First get the entire sheet as array (without any range)
    const allRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    // 2. Dynamically find the header row containing "S/NO."
    let headerRowIndex = -1;
    for (let i = 0; i < allRows.length; i++) {
      if (allRows[i].includes("S/NO.") || allRows[i].includes("S/NO")) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      return NextResponse.json({ message: 'Table header (S/NO.) not found.' }, { status: 400 });
    }

    // 3. Start taking data from the row after header row
    const tableDataRows = allRows.slice(headerRowIndex + 1);

    // 4. Map the data to match your desired schema
    const finalData = tableDataRows
      .map((row) => {
        if (!row || row.length === 0 || row[1] === null) return null;

        return {
          sno: row[0]?.toString() || "",
          process: row[1]?.toString() || "",
          mcTypeHp: row[2]?.toString() || "",
          smv: parseFloat(row[3]) || 0,
          capacity: parseFloat(row[4]) || 0,
          manPower: parseFloat(row[5]) || 0,
          balanceCapacity: parseFloat(row[6]) || 0,
          supportOperation: row[7]?.toString() || "",
          adjustTarget: parseFloat(row[8]) || 0,
          remarks: row[9]?.toString() || ""
        };
      })
      .filter((item) => item !== null && item.sno !== null);

    console.log(`✅ Table found at row ${headerRowIndex + 1}.`);
    console.log(`Total records: ${finalData.length}`);

    // Save to MongoDB
    await connectDB();
    
    const savedData = await Breakdown.create({
      fileName: file.name,
      data: finalData,
      totalRecords: finalData.length
    });

    console.log(`✅ Data saved to MongoDB with ID: ${savedData._id}`);

    return NextResponse.json({
      success: true,
      message: 'Data successfully saved to database',
      mongoId: savedData._id,
      headerFoundAt: headerRowIndex + 1,
      totalRecords: finalData.length,
      data: finalData,
      savedAt: savedData.uploadedAt
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// GET request to fetch all uploaded data
export async function GET(req) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const allData = await Breakdown.find()
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v'); // Exclude __v field

    const total = await Breakdown.countDocuments();

    return NextResponse.json({
      success: true,
      data: allData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}