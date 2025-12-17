import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import Breakdown from '@/models/Breakdown';
import { connectDB } from '@/lib/db';

export async function POST(req) {
  try {
    // Connect to MongoDB
    await connectDB();
    
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

    // Get the range of the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Collect all rows
    const allRows = [];
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const row = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = { c: C, r: R };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        const cell = worksheet[cellRef];
        row.push(cell ? cell.v : null);
      }
      allRows.push(row);
    }

    // Dynamically find the header row containing "S/NO."
    let headerRowIndex = -1;
    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      // Check if this row contains "S/NO." in any cell
      if (row.some(cell => 
        cell && 
        typeof cell === 'string' && 
        cell.trim().toUpperCase().includes('S/NO')
      )) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      return NextResponse.json({ message: 'Table header (S/NO.) not found.' }, { status: 400 });
    }

    // Get header names from the header row
    const headerRow = allRows[headerRowIndex];
    
    // Find column indices for each field
    const columnIndices = {
      sno: headerRow.findIndex(cell => 
        cell && typeof cell === 'string' && cell.trim().toUpperCase().includes('S/NO')
      ),
      process: headerRow.findIndex(cell => 
        cell && typeof cell === 'string' && (
          cell.trim().toUpperCase().includes('OPERATION') || 
          cell.trim().toUpperCase().includes('PROCESS')
        )
      ),
      mcTypeHp: headerRow.findIndex(cell => 
        cell && typeof cell === 'string' && (
          cell.trim().toUpperCase().includes('MC_TYPE') ||
          cell.trim().toUpperCase().includes('M/C TYPE')
        )
      ),
      smv: headerRow.findIndex(cell => 
        cell && typeof cell === 'string' && cell.trim().toUpperCase().includes('SMV')
      ),
      capacity: headerRow.findIndex(cell => 
        cell && typeof cell === 'string' && cell.trim().toUpperCase().includes('CAPACITY')
      ),
      manPower: headerRow.findIndex(cell => 
        cell && typeof cell === 'string' && (
          cell.trim().toUpperCase().includes('MAN POWER') ||
          cell.trim().toUpperCase().includes('MANPOWER')
        )
      ),
      balanceCapacity: headerRow.findIndex(cell => 
        cell && typeof cell === 'string' && (
          cell.trim().toUpperCase().includes('BALANCE') ||
          cell.trim().toUpperCase().includes('BALANCE CAPACITY')
        )
      ),
      supportOperation: headerRow.findIndex(cell => 
        cell && typeof cell === 'string' && cell.trim().toUpperCase().includes('SUPPORT')
      ),
      adjustTarget: headerRow.findIndex(cell => 
        cell && typeof cell === 'string' && (
          cell.trim().toUpperCase().includes('ADJUST') ||
          cell.trim().toUpperCase().includes('TARGET')
        )
      ),
      remarks: headerRow.findIndex(cell => 
        cell && typeof cell === 'string' && cell.trim().toUpperCase().includes('REMARKS')
      )
    };

    // Start taking data from the row after header row
    const tableDataRows = allRows.slice(headerRowIndex + 1);

    // Map the data with correct column mapping
    const extractedData = tableDataRows
      .map((row, rowIndex) => {
        // Skip if row is empty or S/NO column has no data
        if (!row || row.length === 0) return null;
        
        // Skip if all cells in row are empty
        if (row.every(cell => cell === null || cell === '' || cell === undefined)) return null;
        
        // Get the S/NO value
        const snoValue = columnIndices.sno >= 0 ? row[columnIndices.sno] : null;
        if (snoValue === null || snoValue === '' || snoValue === undefined) return null;

        return {
          sno: snoValue,
          process: columnIndices.process >= 0 ? row[columnIndices.process] : '',
          mcTypeHp: columnIndices.mcTypeHp >= 0 ? row[columnIndices.mcTypeHp] : '',
          smv: columnIndices.smv >= 0 ? row[columnIndices.smv] : 0,
          capacity: columnIndices.capacity >= 0 ? row[columnIndices.capacity] : 0,
          manPower: columnIndices.manPower >= 0 ? row[columnIndices.manPower] : 0,
          balanceCapacity: columnIndices.balanceCapacity >= 0 ? row[columnIndices.balanceCapacity] : 0,
          supportOperation: columnIndices.supportOperation >= 0 ? row[columnIndices.supportOperation] : '',
          adjustTarget: columnIndices.adjustTarget >= 0 ? row[columnIndices.adjustTarget] : 0,
          remarks: columnIndices.remarks >= 0 ? row[columnIndices.remarks] : '',
          fileName: file.name,
          rowNumber: rowIndex + headerRowIndex + 2 // Excel row number (1-based)
        };
      })
      .filter((item) => item !== null);

    console.log('✅ Header found at row:', headerRowIndex + 1);
    console.log('✅ Column indices:', columnIndices);
    console.log('✅ Total records found:', extractedData.length);

    // Save to MongoDB
    let savedCount = 0;
    let errors = [];

    for (const data of extractedData) {
      try {
        // Convert numeric values to numbers
        const processedData = {
          ...data,
          smv: parseFloat(data.smv) || 0,
          capacity: parseFloat(data.capacity) || 0,
          manPower: parseFloat(data.manPower) || 0,
          balanceCapacity: parseFloat(data.balanceCapacity) || 0,
          adjustTarget: parseFloat(data.adjustTarget) || 0
        };

        // Check if record already exists
        const existingRecord = await Breakdown.findOne({ 
          sno: processedData.sno.toString(),
          process: processedData.process,
          fileName: processedData.fileName
        });

        if (!existingRecord) {
          await Breakdown.create(processedData);
          savedCount++;
          console.log(`✅ Saved record ${processedData.sno}`);
        } else {
          // Update existing record
          await Breakdown.findByIdAndUpdate(existingRecord._id, processedData);
          savedCount++;
          console.log(`✅ Updated record ${processedData.sno}`);
        }
      } catch (error) {
        errors.push({
          sno: data.sno,
          error: error.message
        });
        console.error(`❌ Error saving record ${data.sno}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      headerFoundAt: headerRowIndex + 1,
      columnMapping: columnIndices,
      totalExtracted: extractedData.length,
      savedToDB: savedCount,
      errors: errors,
      sampleData: extractedData.slice(0, 5), // Send first 5 records for verification
      message: `Successfully extracted ${extractedData.length} records and saved ${savedCount} to database.`
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit')) || 100;
    const page = parseInt(searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;

    // Get total count
    const totalRecords = await Breakdown.countDocuments();
    
    // Get data with pagination
    const data = await Breakdown.find()
      .sort({ sno: 1 }) // Sort by S/NO ascending
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      totalRecords,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      data
    });

  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}