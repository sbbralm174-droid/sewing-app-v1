import { NextResponse } from "next/server";
import { connectDB } from '@/lib/db'; // নিশ্চিত করুন এটি default export
import Machine from "@/models/Machine";
import MachineType from "@/models/MachineType";

export async function POST(req) {
  try {
    await connectDB();
    const { data } = await req.json();

    console.log("Received data in API, total rows:", data?.length);

    if (!data || data.length === 0) {
      return NextResponse.json({ successCount: 0, skipCount: 0, message: "Empty Data" });
    }

    let successCount = 0;
    let skipCount = 0;

    for (const row of data) {
      // যদি uniqueId (TEXTILESL-NO) না থাকে তবে সেটা বাদ যাবে
      if (!row.uniqueId) {
        console.log("Skipping row due to missing uniqueId");
        continue;
      }

      const exists = await Machine.findOne({ uniqueId: row.uniqueId });
      if (exists) {
        skipCount++;
        continue;
      }

      // MachineType ID খোঁজা বা তৈরি করা
      let typeId = null;
      if (row.machineType) {
        let typeDoc = await MachineType.findOne({ 
          name: { $regex: new RegExp(`^${row.machineType.trim()}$`, "i") } 
        });
        if (!typeDoc) {
          typeDoc = await MachineType.create({ typeName: row.machineType.trim() });
        }
        typeId = typeDoc._id;
      }

      // Date parsing (2018.08)
      let formattedDate = null;
      if (row.installationDate) {
        const parts = row.installationDate.split('.');
        formattedDate = new Date(parseInt(parts[0]), parseInt(parts[1] || 1) - 1, 1);
      }

      await Machine.create({
        uniqueId: row.uniqueId,
        brandName: row.brandName,
        model: row.model,
        machineType: typeId,
        installationDate: formattedDate,
        companyUniqueNumber: row.uniqueId,
        currentStatus: 'idle'
      });

      successCount++;
    }

    return NextResponse.json({ successCount, skipCount });

  } catch (error) {
    console.error("API Error Detailed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}