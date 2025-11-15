import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Operator from '@/models/Operator';
import { writeFile } from 'fs/promises';
import path from 'path';

// PUT: একটি অপারেটরের ডেটা আপডেট করা (File Upload Support সহ)
export async function PUT(request, { params }) {
    try {
        await connectDB();
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Operator ID is missing in the path' },
                { status: 400 }
            );
        }

        const contentType = request.headers.get('content-type');
        let updateData = {};
        let newVideos = []; // নতুন আপলোড করা ভিডিওগুলির জন্য অ্যারে

        // শুধু multipart/form-data চেক করা যথেষ্ট
        if (contentType && contentType.includes('multipart/form-data')) {
            // --- 1. Handle FormData (Files and Text fields) ---
            const formData = await request.formData();

            // Create a payload object from form text fields
            for (const [key, value] of formData.entries()) {
                // 'pictureFile' এবং 'newVideoFiles' ব্যতীত বাকি সব টেক্সট ডেটা
                if (key !== 'pictureFile' && key !== 'newVideoFiles' && !(value instanceof File)) {
                    try {
                        // JSON.parse করার চেষ্টা
                        if (typeof value === 'string' && (key === 'videos' || key === 'allowedProcesses' || key === 'occurrenceReports' || key === 'resignationHistory')) {
                            updateData[key] = JSON.parse(value);
                        } else {
                            updateData[key] = value; 
                        }
                    } catch (e) {
                        updateData[key] = value; // Treat as plain text otherwise
                    }
                }
            }

            // --- 2. Handle Picture File ---
            const pictureFile = formData.get('pictureFile');
            
            if (pictureFile && pictureFile instanceof File && pictureFile.size > 0) {
                const bytes = await pictureFile.arrayBuffer();
                const buffer = Buffer.from(bytes);
                
                const fileExtension = pictureFile.name.split('.').pop();
                const fileName = `${id}_picture_${Date.now()}.${fileExtension}`;
                const publicUrl = `/uploads/photos/${fileName}`;

                const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'photos');
                
                const fs = require('fs');
                if (!fs.existsSync(uploadDir)){
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                const filePath = path.join(uploadDir, fileName);
                await writeFile(filePath, buffer);
                
                updateData.picture = publicUrl;
            } 
            else if (formData.has('picture') && !pictureFile) {
                updateData.picture = updateData.picture || null;
            }


            // --- 3. Handle New Video Files (Core Change for Video Upload) ---
            const videoFiles = formData.getAll('newVideoFiles'); // একাধিক ফাইল পেতে getAll ব্যবহার করা
            
            const videoUploadDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
            const fs = require('fs');
            if (!fs.existsSync(videoUploadDir)){
                fs.mkdirSync(videoUploadDir, { recursive: true });
            }

            for (const videoFile of videoFiles) {
                if (videoFile && videoFile instanceof File && videoFile.size > 0) {
                    const bytes = await videoFile.arrayBuffer();
                    const buffer = Buffer.from(bytes);
                    
                    const fileExtension = videoFile.name.split('.').pop();
                    const fileName = `${id}_video_${Date.now()}.${fileExtension}`;
                    const publicUrl = `/uploads/videos/${fileName}`;

                    const filePath = path.join(videoUploadDir, fileName);
                    await writeFile(filePath, buffer);

                    newVideos.push({
                        name: videoFile.name, // ভিডিওর আসল নাম
                        url: publicUrl,
                        originalName: videoFile.name
                    });
                }
            }
            
        } else if (contentType && contentType.includes('application/json')) {
            // --- Handle Regular JSON (যদি ফাইল আপলোড না হয়) ---
            updateData = await request.json();
        } else {
             // Handle no body or unrecognized content type
             return NextResponse.json(
                { success: false, message: 'Unsupported Content-Type or missing request body' },
                { status: 415 }
            );
        }

        // Remove unnecessary fields before update
        delete updateData._id;
        delete updateData.operatorId;
        
        // MongoDB Update Operation
        let updateOperation = { $set: updateData };

        // যদি 'videos' ডেটা থাকে (URL টেক্সট এরিয়া থেকে), তবে তা $set করবে (পুরোনো URLগুলি প্রতিস্থাপিত/আপডেট করবে)
        // যদি নতুন ফাইল আপলোড হয়, তবে $push ব্যবহার করে সেই ফাইলগুলিকে অ্যারেতে যোগ করবে।

        // 1. URL থেকে আসা ভিডিও (যদি থাকে) updateData এর মধ্যেই আছে, যা $set এর মাধ্যমে আপডেটেড হবে।
        // 2. যদি নতুন ফাইল আপলোড হয় (newVideos অ্যারেতে ডেটা থাকে), তবে তা $push করবে।

        // যদি updateData.videos না থাকে, তবে existing videos array-তে নতুন ভিডিও যোগ করা যেতে পারে
        if (newVideos.length > 0) {
            // যদি videos field updateData-এ থাকে, তবে আমরা নতুন আপলোড হওয়া ভিডিওগুলি
            // সেই আপডেটেড list-এর সাথে merge করে দেব।
            if (updateData.videos) {
                 updateData.videos = [...updateData.videos, ...newVideos];
            } else {
                 // যদি videos field updateData-এ না থাকে, তবে $push ব্যবহার করে ডেটাবেসে যোগ করব।
                 // তবে যেহেতু আমরা ফ্রন্টএন্ড থেকে সব URL একসাথে পাঠাচ্ছি, তাই সবসময় $set ব্যবহার করাই সহজ।
                 // এখানে আমরা ধরে নিচ্ছি ফ্রন্টএন্ড থেকে সব ভিডিওর URL একটি list হিসেবে আসবে।
                 
                 // If the request is multipart/form-data and videos were not sent as text, 
                 // we need to fetch the current videos and then push. Let's simplify and assume 
                 // that the frontend sends ALL existing URLs AND the new files are APPENDED.
                 
                 // Since the frontend uses: updateFormData.append(key, JSON.stringify(videoObjects));
                 // the entire videos array is already being replaced in $set: updateData. 
                 
                 // We need to merge the uploaded files with the URL list from the frontend.
                 // We will merge it here just before the update if it wasn't merged in the frontend.
                 
                 // *** Easiest Approach: Find existing operator, then set new videos array. ***
                 const existingOperator = await Operator.findById(id);
                 if (existingOperator) {
                     const existingVideos = existingOperator.videos || [];
                     // Check if updateData.videos was successfully parsed from text area.
                     const updatedVideosFromText = updateData.videos || []; 

                     // Final videos array: (URLs from text area) + (newly uploaded files)
                     updateData.videos = [...updatedVideosFromText, ...newVideos];
                     updateOperation = { $set: updateData }; // Ensure the full array is set
                 } else {
                    // Operator not found will be caught later, but we ensure $set is prepared.
                    updateData.videos = newVideos;
                    updateOperation = { $set: updateData };
                 }
            }
        }
        
        // যদি নতুন ফাইল আপলোড না হয়, কিন্তু URL টেক্সট-এরিয়া থেকে এসেছে (যা updateData.videos এর ভেতরে আছে), 
        // তবে $set: updateData কাজ করবে।

        const updatedOperator = await Operator.findByIdAndUpdate(
            id,
            updateOperation, // $set দ্বারা পুরো অ্যারে প্রতিস্থাপিত হচ্ছে
            { new: true, runValidators: true }
        );

        if (!updatedOperator) {
            return NextResponse.json(
                { success: false, message: 'Operator not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { 
                success: true, 
                message: 'Operator data updated successfully', 
                data: updatedOperator 
            }, 
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating operator:', error);
        if (error.name === 'ValidationError') {
            // ... (validation error handling)
        }
        return NextResponse.json(
            { success: false, message: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};