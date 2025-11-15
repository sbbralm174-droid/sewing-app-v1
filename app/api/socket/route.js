// app/api/socket/route.js

import { NextResponse } from "next/server";

import { setIoInstance, getIoInstance } from "@/lib/socket";
import Notification from "@/models/Notification";
import { connectDB } from "@/lib/db";

// ------------------- GET: fetch all notifications -------------------
export const GET = async () => {
  await connectDB();
  const notifications = await Notification.find().sort({ createdAt: -1 });
  return NextResponse.json(notifications);
};

// ------------------- POST: create notification -------------------
export const POST = async (req) => {
  const body = await req.json();
  await connectDB();

  const newNotification = await Notification.create({ message: body.message });

  const io = getIoInstance();
  if (io) io.emit("new-notification", newNotification);

  return NextResponse.json(newNotification);
};

// ------------------- PUT: update notification -------------------
export const PUT = async (req) => {
  const body = await req.json();
  await connectDB();

  const updated = await Notification.findByIdAndUpdate(
    body.id,
    { message: body.message },
    { new: true }
  );

  const io = getIoInstance();
  if (io) io.emit("update-notification", updated);

  return NextResponse.json(updated);
};

// ------------------- DELETE: single/multiple notifications -------------------
export const DELETE = async (req) => {
  const body = await req.json();
  await connectDB();

  const io = getIoInstance();

  if (body.ids && Array.isArray(body.ids)) {
    // multiple delete
    await Notification.deleteMany({ _id: { $in: body.ids } });
    if (io) io.emit("delete-many-notifications", body.ids);
  } else if (body.id) {
    // single delete
    await Notification.findByIdAndDelete(body.id);
    if (io) io.emit("delete-notification", body.id);
  }

  return NextResponse.json({ success: true });
};
