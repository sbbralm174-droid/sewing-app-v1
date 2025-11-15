// lib/socket.js (পরিবর্তন করতে হবে)

// 'ioInstance' এর বদলে 'global' অবজেক্ট ব্যবহার করুন 
// Next.js সার্ভার পরিবেশে গ্লোবাল ভ্যারিয়েবল ব্যবহার করা দরকার।

const GLOBAL_IO_KEY = 'globalSocketIoInstance';

export const setIoInstance = (io) => {
  // ioInstance = io; // ❌ এটি বাতিল
  if (!global[GLOBAL_IO_KEY]) {
    global[GLOBAL_IO_KEY] = io; // ✅ গ্লোবাল অবজেক্টে সেট করুন
    console.log("✅ Socket.io instance successfully set to global object.");
  }
};

export const getIoInstance = () => {
  const io = global[GLOBAL_IO_KEY]; // ✅ গ্লোবাল অবজেক্ট থেকে নিন
  if (!io) {
    console.warn('⚠️ Socket.io instance not initialized in global context.');
  }
  return io;
};