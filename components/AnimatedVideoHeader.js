'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronLeft, ChevronRight, Home, Info, Briefcase, Phone, Star, Volume2, VolumeX } from 'lucide-react';

const AnimatedVideoHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef([]);

  const slides = [
    {
      id: 1,
      title: "Innovative Digital Solutions",
      subtitle: "Transforming Ideas into Reality",
      video: "/videos/tech-wave.mp4",
      fallbackColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
      id: 2,
      title: "Premium Web Experiences",
      subtitle: "Cutting-edge Technology & Design",
      video: "/videos/digital-network.mp4",
      fallbackColor: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    },
    {
      id: 3,
      title: "Next Generation Development",
      subtitle: "Where Creativity Meets Technology",
      video: "/videos/cyber-future.mp4",
      fallbackColor: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    },
  ];

  const navItems = [
    { name: 'Home', icon: Home, href: '#home' },
    { name: 'About', icon: Info, href: '#about' },
    { name: 'Services', icon: Briefcase, href: '#services' },
    { name: 'Contact', icon: Phone, href: '#contact' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    // Play current slide video and pause others
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentSlide) {
          video.play().catch(console.error);
          video.currentTime = 0; // Reset to start
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    videoRefs.current.forEach(video => {
      if (video) {
        video.muted = !isMuted;
      }
    });
  };

  const addVideoRef = (el, index) => {
    videoRefs.current[index] = el;
  };

  return (
    <header className="relative min-h-screen overflow-hidden bg-black">
      {/* Top Navigation Bar */}
      <nav className="relative z-50 px-6 py-4 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg blur-sm opacity-75"></div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              NEXUS
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.a
                  key={item.name}
                  href={item.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative group text-white/80 hover:text-white transition-colors duration-300"
                >
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Icon className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-cyan-400 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 group-hover:w-full transition-all duration-300"></div>
                </motion.a>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden relative p-2 text-white/80 hover:text-white transition-colors duration-300"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            <div className="absolute inset-0 bg-cyan-400 blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300 -z-10 rounded"></div>
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md border-b border-white/10"
            >
              <div className="px-6 py-4 space-y-4">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.a
                      key={item.name}
                      href={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 text-white/80 hover:text-white transition-colors duration-300 group"
                    >
                      <div className="relative">
                        <Icon className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-cyan-400 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                      </div>
                      <span className="font-medium">{item.name}</span>
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Header Area with Slider */}
      <div className="relative h-[calc(100vh-80px)]">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Slider with Videos */}
        <div className="relative h-full overflow-hidden">
          <AnimatePresence mode="wait">
            {slides.map((slide, index) => (
              currentSlide === index && (
                <motion.div
                  key={slide.id}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  {/* Video Background */}
                  <div className="absolute inset-0">
                    <video
                      ref={(el) => addVideoRef(el, index)}
                      className="w-full h-full object-cover"
                      muted={isMuted}
                      loop
                      playsInline
                      preload="auto"
                      poster={`/posters/${slide.video.split('/').pop().replace('.mp4', '.jpg')}`}
                    >
                      <source src={slide.video} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    {/* Fallback background if video fails to load */}
                    <div 
                      className="absolute inset-0"
                      style={{ background: slide.fallbackColor }}
                    ></div>
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40"></div>
                  
                  {/* Content */}
                  <div className="relative z-10 flex items-center justify-center h-full text-center">
                    <div className="max-w-4xl px-6">
                      <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-5xl md:text-7xl font-bold text-white mb-6"
                      >
                        {slide.title}
                      </motion.h1>
                      <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="text-xl md:text-2xl text-white/80 mb-8"
                      >
                        {slide.subtitle}
                      </motion.p>
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 0.8 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                      >
                        <button className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                          Get Started
                        </button>
                        <button className="px-8 py-4 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-105">
                          Learn More
                        </button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )
            ))}
          </AnimatePresence>

          {/* Video Controls */}
          <div className="absolute top-6 right-6 z-20">
            <button
              onClick={toggleMute}
              className="relative p-3 text-white/80 hover:text-white transition-colors duration-300 bg-black/50 rounded-full backdrop-blur-sm"
            >
              {isMuted ? (
                <VolumeX className="w-6 h-6" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
              <div className="absolute inset-0 bg-cyan-400 blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300 -z-10 rounded-full"></div>
            </button>
          </div>

          {/* Slider Controls */}
          <button
            onClick={prevSlide}
            className="absolute left-6 top-1/2 transform -translate-y-1/2 z-20 p-3 text-white/80 hover:text-white transition-colors duration-300 bg-black/50 rounded-full backdrop-blur-sm"
          >
            <div className="relative">
              <ChevronLeft className="w-8 h-8" />
              <div className="absolute inset-0 bg-cyan-400 blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300 -z-10 rounded-full"></div>
            </div>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 p-3 text-white/80 hover:text-white transition-colors duration-300 bg-black/50 rounded-full backdrop-blur-sm"
          >
            <div className="relative">
              <ChevronRight className="w-8 h-8" />
              <div className="absolute inset-0 bg-cyan-400 blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300 -z-10 rounded-full"></div>
            </div>
          </button>

          {/* Slider Indicators */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-white scale-125'
                    : 'bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Left Gear */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -left-32 top-1/4 z-10"
        >
          <svg
            width="256"
            height="256"
            viewBox="0 0 256 256"
            className="text-cyan-400/20 filter drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]"
          >
            <path
              fill="currentColor"
              d="M232,128a104,104,0,1,0-90.77,103.13l-8.33-28.45A76,76,0,1,1,204,128a75.44,75.44,0,0,1-4.06,23.78l26.64,9.69A103.21,103.21,0,0,0,232,128ZM128,152a24,24,0,1,1,24-24A24,24,0,0,1,128,152Zm104,24a8,8,0,0,1-8,8H224v16a8,8,0,0,1-16,0V184H192a8,8,0,0,1,0-16h16V152a8,8,0,0,1,16,0v16h16A8,8,0,0,1,232,176Z"
            />
          </svg>
        </motion.div>

        {/* Right Gear */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -right-32 bottom-1/4 z-10"
        >
          <svg
            width="256"
            height="256"
            viewBox="0 0 256 256"
            className="text-blue-400/20 filter drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]"
          >
            <path
              fill="currentColor"
              d="M232,128a104,104,0,1,0-90.77,103.13l-8.33-28.45A76,76,0,1,1,204,128a75.44,75.44,0,0,1-4.06,23.78l26.64,9.69A103.21,103.21,0,0,0,232,128ZM128,152a24,24,0,1,1,24-24A24,24,0,0,1,128,152Zm104,24a8,8,0,0,1-8,8H224v16a8,8,0,0,1-16,0V184H192a8,8,0,0,1,0-16h16V152a8,8,0,0,1,16,0v16h16A8,8,0,0,1,232,176Z"
            />
          </svg>
        </motion.div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-cyan-400/30 rounded-full"
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
              }}
              animate={{
                y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000)],
                x: [null, Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000)],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>
      </div>
    </header>
  );
};

export default AnimatedVideoHeader;