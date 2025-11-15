// api/all-operator-process-score-list (Final Version with Sorting)

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Operator from '@/models/Operator';

export async function GET(request) {
    try {
        await connectDB(); 

        const { searchParams } = new URL(request.url);
        const process = searchParams.get('process');

        if (!process) {
            return NextResponse.json({ 
                success: false, 
                // Translation: Please provide "process" in the query parameter.
                message: 'Please provide "process" in the query parameter.' 
            }, { status: 400 });
        }
        
        const searchProcessName = process.trim();
        const lowerSearchProcessName = searchProcessName.toLowerCase();

        // Translation: 2. Using Aggregation Pipeline for Case-Insensitive Matching
        // 2. Aggregation Pipeline ব্যবহার করে কেস-ইনসেনসিটিভ ম্যাচিং
        const operators = await Operator.aggregate([
            {
                // Translation: If allowedProcesses is null/an array, replace it with {}
                // allowedProcesses যদি null/অ্যারে থাকে, তবে {} দ্বারা প্রতিস্থাপন
                $addFields: {
                    safeAllowedProcesses: {
                        $cond: {
                            if: { $isArray: "$allowedProcesses" }, 
                            // Translation: then: {}, else: { $ifNull: ["$allowedProcesses", {}] }
                            then: {},
                            else: { $ifNull: ["$allowedProcesses", {}] } 
                        }
                    }
                }
            },
            {
                // Translation: Convert allowedProcesses to an array
                // allowedProcesses কে একটি অ্যারেতে রূপান্তর
                $addFields: {
                    allowedProcessesArray: { $objectToArray: "$safeAllowedProcesses" }
                }
            },
            {
                // Translation: Case-insensitive matching using $match and $expr
                // $match এবং $expr ব্যবহার করে কেস-ইনসেনসিটিভ ম্যাচিং
                $match: {
                    $expr: {
                        $in: [ 
                            lowerSearchProcessName,
                            { 
                                $map: { 
                                    input: "$allowedProcessesArray",
                                    as: "item",
                                    in: { $toLower: "$$item.k" } 
                                }
                            }
                        ]
                    }
                }
            },
            {
                // Translation: Keep the necessary fields
                // প্রয়োজনীয় ফিল্ডগুলো রাখা
                $project: {
                    _id: 1,
                    name: 1,
                    operatorId: 1,
                    allowedProcesses: "$safeAllowedProcesses",
                    allowedProcessesArray: 1
                }
            }
        ]);
        
        if (operators.length === 0) {
            return NextResponse.json({
                success: true,
                // Translation: No operator authorized for the process "..." was found.
                message: `No operator authorized for the process "${searchProcessName}" was found.`,
                data: []
            }, { status: 404 });
        }

        // Translation: 3. Formatting the results into the required format
        // 3. ফলাফলকে প্রয়োজনীয় format এ তৈরি করা
        const formattedResults = operators.map(operator => {
            let score = 0;
            let actualProcessName = searchProcessName;

            const matchedProcess = operator.allowedProcessesArray.find(item => 
                item.k.toLowerCase() === lowerSearchProcessName
            );

            if (matchedProcess) {
                score = matchedProcess.v; 
                actualProcessName = matchedProcess.k; 
            }
            
            return {
                _id: operator._id,
                name: operator.name,
                operatorId: operator.operatorId,
                processName: actualProcessName,
                score: score || 0 
            };
        });

        // ⭐ Translation: 4. Sorting: Highest score to lowest score (Descending Order)
        // ⭐ 4. সাজানো (Sorting): বড় স্কোর থেকে ছোট স্কোর (Descending Order)
        formattedResults.sort((a, b) => b.score - a.score);


        return NextResponse.json({
            success: true,
            totalOperators: formattedResults.length,
            processSearched: searchProcessName,
            data: formattedResults,
        });

    } catch (error) {
        console.error('Error in API route:', error);
        return NextResponse.json({ 
            success: false, 
            // Translation: Server error. Data could not be accessed.
            message: 'Server error. Data could not be accessed.' 
        }, { status: 500 });
    }
}