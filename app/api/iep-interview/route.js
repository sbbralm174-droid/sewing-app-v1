import { NextResponse } from "next/server";
import { connectDB } from '@/lib/db';
import VivaInterview from "@/models/IepInterview";

// CREATE Viva Interview
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    
    // Check if candidate with same NID or Birth Certificate has previous interviews
    const { nid, birthCertificate, candidateId } = body;
    
    let previousInterviews = [];
    
    if (nid || birthCertificate || candidateId) {
      const query = {
        $or: []
      };
      
      if (nid) query.$or.push({ nid });
      if (birthCertificate) query.$or.push({ birthCertificate });
      if (candidateId) query.$or.push({ candidateId });
      
      if (query.$or.length > 0) {
        previousInterviews = await VivaInterview.find(query)
          .select('candidateId name interviewDate createdAt department result nid birthCertificate picture')
          .sort({ interviewDate: -1 })
          .limit(10);
      }
    }
    
    // Create new interview
    const viva = await VivaInterview.create(body);
    
    return NextResponse.json({ 
      success: true, 
      data: viva,
      previousInterviews: previousInterviews
    });
    
  } catch (error) {
    console.error("❌ Viva Interview Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET All Viva Interviews
export async function GET() {
  try {
    await connectDB();
    const vivas = await VivaInterview.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: vivas });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// SEARCH Candidate by NID, Birth Certificate, or Candidate ID
export async function PUT(req) {
  try {
    await connectDB();
    const { searchValue } = await req.json();
    
    if (!searchValue || searchValue.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        error: "Search value is required" 
      }, { status: 400 });
    }
    
    const searchTerm = searchValue.trim();
    
    // Search in all three fields: nid, birthCertificate, candidateId
    const candidates = await VivaInterview.find({
      $or: [
        { nid: searchTerm },
        { birthCertificate: searchTerm },
        { candidateId: searchTerm }
      ]
    })
    .select('candidateId name nid birthCertificate interviewDate department result picture videos vivaDetails processAndScore grade remarks')
    .sort({ interviewDate: -1 })
    .limit(20);
    
    return NextResponse.json({ 
      success: true, 
      data: candidates 
    });
    
  } catch (error) {
    console.error("❌ Search Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}