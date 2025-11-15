// components/VideoBackground.jsx
export default function VideoBackground() {
  return (
    <div className="absolute inset-0 z-0">
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black opacity-60 z-10"></div>
      
      {/* Video Element */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
        poster="/placeholder-video-poster.jpg" // Optional placeholder
      >
        <source src="/hero-video.mp4" type="video/mp4" />
        <source src="/hero-video.webm" type="video/webm" />
        {/* Fallback text if video doesn't load */}
        Your browser does not support the video tag.
      </video>
      
      {/* Fallback Image for mobile or if video fails */}
      <div 
        className="absolute inset-0 bg-cover bg-center md:hidden"
        style={{ backgroundImage: "url('/hero-fallback.jpg')" }}
      />
    </div>
  );
}