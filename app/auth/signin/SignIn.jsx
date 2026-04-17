'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function SignIn() {
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        userId: formData.userId,
        password: formData.password,
      });
      
      if (result.error) {
        setError('Invalid credentials');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

return (
  /* h-screen এবং overflow-hidden স্ক্রল বন্ধ রাখবে। pt-20 যোগ করা হয়েছে যেন ওপর থেকে গ্যাপ থাকে */
  <div className="h-screen w-full flex items-center justify-center bg-[#8a43d6] p-6 md:p-12 lg:pt-24 lg:pb-16 font-sans overflow-hidden">
    
    {/* Main Container Card - h-auto এবং max-h-[80vh] যাতে কোনোভাবেই স্ক্রিনে লেগে না যায় */}
    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden h-auto max-h-[80vh] md:h-[500px] border border-white/20">
      
      {/* Left Side: Divider Color changed to exact form color #8a43d6 */}
      <div className="hidden md:flex md:w-[38%] bg-gray-50 relative items-center justify-center p-8 overflow-hidden border-r-[3.5px] border-[#8a43d6]/30">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)", backgroundSize: "20px 20px" }}></div>
        
        <div className="relative z-10 text-center flex flex-col items-center">
          <div className="mb-4 w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-purple-100 to-indigo-50 rounded-[2.5rem] shadow-inner flex items-center justify-center relative">
              <div className="absolute -top-3 -right-3 w-12 h-12 bg-purple-200/40 rounded-full blur-xl"></div>
              <svg className="w-10 h-10 lg:w-12 lg:h-12 text-[#8a43d6] opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-7h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
          </div>
          
          <h2 className="text-base lg:text-lg font-bold text-gray-800 tracking-tight px-2">
            Effortless Management
          </h2>
          <p className="text-gray-400 mt-1 text-[10px] lg:text-[11px] max-w-[150px] leading-relaxed opacity-70">
            Digitalizing production with precision.
          </p>
        </div>
      </div>

      {/* Right Side: Login Section */}
      <div className="w-full md:w-[62%] flex items-center justify-center bg-gray-50 p-4 sm:p-6">
        
        {/* Inner Login Card - Height আরও ছোট করা হয়েছে (max-w-[320px] ও p-6) */}
        <div className="w-full max-w-[320px] bg-[#8a43d6] rounded-[2.5rem] p-6 lg:p-7 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] border border-white/10 relative">
          
          <div className="w-full">
            <div className="text-center mb-5">
              <h1 className="text-4xl font-black mb-1 tracking-tighter text-white drop-shadow-md">
                GMS <span className="text-purple-200">Textiles Ltd.</span>
              </h1>
              <div className="h-0.5 w-6 bg-white/20 mx-auto rounded-full mb-2"></div>
              <p className="text-purple-100 text-[10px] font-bold uppercase tracking-[0.4em] opacity-60">
                Sign In
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[8px] font-black text-purple-200 ml-4 uppercase tracking-widest mb-1 opacity-70">User ID</label>
                <input
                  type="text"
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-2 bg-white/10 border border-white/10 rounded-full text-white placeholder-purple-300/30 focus:ring-2 focus:ring-white/20 focus:bg-white/20 outline-none transition-all text-xs"
                  placeholder="Enter ID"
                />
              </div>
              
              <div>
                <label className="block text-[8px] font-black text-purple-200 ml-4 uppercase tracking-widest mb-1 opacity-70">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-2 bg-white/10 border border-white/10 rounded-full text-white placeholder-purple-300/30 focus:ring-2 focus:ring-white/20 focus:bg-white/20 outline-none transition-all text-xs"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex justify-end pr-2">
                <Link href="#" className="text-[8px] font-bold text-purple-200 hover:text-white transition tracking-tighter">
                  FORGOT PASSWORD?
                </Link>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-[#8a43d6] py-2 rounded-full font-black text-[10px] tracking-widest hover:bg-gray-100 active:scale-[0.98] transition-all shadow-lg mt-1"
              >
                {loading ? 'PROCESSING...' : 'LOGIN'}
              </button>
            </form>
            
            <div className="mt-5 text-center border-t border-white/5 pt-4">
              <p className="text-[9px] text-purple-200">
                New here?{' '}
                <Link href="/auth/signup" className="text-white font-black hover:underline transition">
                  CREATE ACCOUNT
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
);
}