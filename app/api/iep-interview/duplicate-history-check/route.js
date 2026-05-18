import { NextResponse } from "next/server";
import { connectDB } from '@/lib/db';

import IepInterviewStepOne from "@/models/IepInterviewStepOne";
import ResignHistory from "@/models/ResignHistory";

export async function GET() {
  try {
    await connectDB();

    // সব candidate আনো
    const candidates = await IepInterviewStepOne.find(
      {},
      {
        nid: 1,
        birthCertificate: 1,
      }
    ).lean();

    // duplicate check
    const idMap = new Map();

    candidates.forEach((c) => {
      const id = c.nid || c.birthCertificate;

      if (!id) return;

      if (!idMap.has(id)) {
        idMap.set(id, 1);
      } else {
        idMap.set(id, idMap.get(id) + 1);
      }
    });

    // যেগুলো multiple
    const duplicateIds = [];

    idMap.forEach((count, id) => {
      if (count > 1) {
        duplicateIds.push(id);
      }
    });

    // resign history check
    const resignHistoryData = await ResignHistory.find(
      {
        nid: { $in: [...idMap.keys()] },
      },
      {
        nid: 1,
      }
    ).lean();

    const resignIds = resignHistoryData.map((r) => r.nid);

    return NextResponse.json({
      success: true,

      duplicateIds,
      duplicateCount: duplicateIds.length,

      resignIds,
      resignCount: resignIds.length,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}