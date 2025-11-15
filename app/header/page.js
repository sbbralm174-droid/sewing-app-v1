import AnimatedHeader from '@/components/AnimatedHeader';
import AnimatedVideoHeader from '@/components/AnimatedVideoHeader';
import AnimatedHeader2 from '@/components/AnimatedHeader2';
import SidebarNavLayout from '@/components/SidebarNavLayout';



export default function Home() {
  return (
    
    <main className="min-h-screen bg-black">
        <SidebarNavLayout />
      {/* <AnimatedHeader /> */}
      {/* <AnimatedVideoHeader/> */}
      {/* Rest of your content */}
      <AnimatedHeader2 />
      <section className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-8">Your Content Goes Here</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-gray-800 rounded-lg p-6 hover:transform hover:scale-105 transition-all duration-300">
                <h3 className="text-xl font-semibold mb-4">Feature {item}</h3>
                <p className="text-gray-300">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>

  );
}