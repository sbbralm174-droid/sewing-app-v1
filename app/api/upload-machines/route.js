import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Machine from '@/models/Machine';
import MachineType from '@/models/MachineType';
import * as XLSX from 'xlsx';

export async function POST(req) {
  try {
    await connectDB();
    
    const formData = await req.formData();
    const file = formData.get('file');

    // চেক ১: ফাইল আদৌ আছে কিনা
    if (!file) {
      return NextResponse.json({ error: "No file found in request" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json(workbook[sheetName]);

    // চেক ২: ডেটা রিড করা যাচ্ছে কিনা
    if (!rawData || rawData.length === 0) {
      return NextResponse.json({ error: "Excel/CSV file is empty or unreadable" }, { status: 400 });
    }

    let importedCount = 0;
    let skippedCount = 0;
    let errors = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      
      // কলামের নামগুলো পরিষ্কার করা (Trim whitespace)
      const cleanRow = {};
      Object.keys(row).forEach(key => {
        cleanRow[key.trim()] = row[key];
      });

      const uniqueId = cleanRow['TEXTILESL-NO'];
      const machineName = cleanRow['NAME OF MACHINE'];

      if (!uniqueId) {
        errors.push(`Row ${i + 2}: Unique ID missing`);
        skippedCount++;
        continue;
      }

      // ১. ডুপ্লিকেট চেক
      const exists = await Machine.findOne({ uniqueId: uniqueId.toString().trim() });
      if (exists) {
        skippedCount++;
        continue;
      }

      // ২. Machine Type খুঁজে বের করা
      let typeDoc = await MachineType.findOne({ 
        name: { $regex: new RegExp(`^${machineName?.trim()}$`, 'i') } 
      });

      // যদি টাইপ খুঁজে না পাওয়া যায়, তবে এই রো স্কিপ হবে
      if (!typeDoc) {
        errors.push(`Row ${i + 2}: Machine Type "${machineName}" not found in DB`);
        skippedCount++;
        continue;
      }

      // ৩. Installation Date প্রসেস (2018.08 ফরম্যাট)
      let finalDate = null;
      const rawDate = cleanRow['INSTALLATION YEAR'];
      if (rawDate) {
        const dateStr = rawDate.toString().trim();
        const parts = dateStr.split('.');
        const year = parts[0];
        const month = parts[1] || '01';
        finalDate = new Date(`${year}-${month}-01`);
      }

      // ৪. ডাটা সেভ
      await Machine.create({
        uniqueId: uniqueId.toString().trim(),
        brandName: cleanRow['BRAND'] || 'N/A',
        model: cleanRow['MODEL'] || 'N/A',
        companyUniqueNumber: cleanRow['M/C SERIAL NO'] || uniqueId,
        machineType: typeDoc._id,
        installationDate: finalDate,
        currentStatus: 'idle',
        lastLocation: {
          line: 'N/A',
          supervisor: 'N/A',
          floor: 'N/A',
          updatedAt: new Date('2000-01-01')
        }
      });

      importedCount++;
    }

    return NextResponse.json({
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      details: errors // এখানে দেখা যাবে কেন স্কিপ হয়েছে
    });

  } catch (error) {
    console.error("Critical Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}