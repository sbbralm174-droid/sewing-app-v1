import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const type = formData.get("type"); // 'photo' or 'video'

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/ogg"];
    
    if (type === 'photo' && !allowedImageTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }
    
    if (type === 'video' && !allowedVideoTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid video format" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const fileExtension = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExtension}`;
    
    // Determine upload directory
    const uploadDir = type === 'photo' ? 'uploads/photos' : 'uploads/videos';
    const uploadPath = path.join(process.cwd(), 'public', uploadDir, fileName);

    // Ensure directory exists
    await mkdir(path.dirname(uploadPath), { recursive: true });

    // Save file
    await writeFile(uploadPath, buffer);

    // Return public URL
    const publicUrl = `/${uploadDir}/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      fileName: file.name,
      type: type
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}