// app/api/users/route.js

import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/db";
import User from '@/models/User';

export async function POST(request) {
  console.log("🔥 API HIT: /api/users sabbir");

  try {
    await connectDB();
    
    const { userId, name, password } = await request.json();
    
    // Check if user already exists
    const existingUser = await User.findOne({ userId });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User ID already exists' },
        { status: 400 }
      );
    }
    
    // Create new user
    const user = new User({
      userId,
      name,
      password,
    });
    
    await user.save();
    
    return NextResponse.json(
      { message: 'User created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}