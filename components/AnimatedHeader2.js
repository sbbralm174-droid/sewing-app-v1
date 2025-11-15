// components/HeroHeader.jsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import VideoBackground from './VideoBackground';
import NavBar from './NavBar';
import AnimatedOverlay from './AnimatedOverlay';
import Image from 'next/image';
import Layout from '../components/Layout';


export default function HeroHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="relative h-screen overflow-hidden">
      {/* Video Background */}
      <VideoBackground />
      
      {/* Navigation Bar */}
      {/* <NavBar isScrolled={isScrolled} /> */}
      
      {/* Animated Overlay Content */}
      <AnimatedOverlay />
      
      {/* Floating Geometric Shapes with PNG Images */}
      <FloatingShapes />
    </header>
  );
}

// Floating Shapes Component with PNG Images
function FloatingShapes() {
  return (
    
    <div className="absolute inset-0 pointer-events-none">
      {/* Abstract Shape 1 */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-16 h-16"
        animate={{
          y: [0, -40, 0],
          x: [0, 25, 0],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src="/images/abstract-shape-1.png" // আপনার PNG image path
          alt="Abstract Shape"
          width={64}
          height={64}
          className="w-full h-full object-contain opacity-70"
        />
      </motion.div>
      
      {/* Abstract Shape 2 */}
      <motion.div
        className="absolute top-1/3 right-1/4 w-20 h-20"
        animate={{
          y: [0, 30, 0],
          rotate: [0, -180, -360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src="/images/abstract-shape-2.png"
          alt="Abstract Shape"
          width={80}
          height={80}
          className="w-full h-full object-contain opacity-60"
        />
      </motion.div>
      
      {/* Abstract Shape 3 */}
      <motion.div
        className="absolute bottom-1/4 right-1/3 w-14 h-14"
        animate={{
          y: [0, -25, 0],
          rotate: [0, 90, 180, 270, 360],
          scale: [1, 0.9, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src="/images/abstract-shape-3.png"
          alt="Abstract Shape"
          width={1000}
          height={1000}
          className="w-full h-full object-contain opacity-80"
        />
      </motion.div>

      {/* Additional Small Particles */}
      <motion.div
        className="absolute top-1/2 left-1/5 w-8 h-8"
        animate={{
          y: [0, -20, 0],
          x: [0, 15, 0],
          rotate: [0, 360],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src="/images/particle-1.png"
          alt="Particle"
          width={32}
          height={32}
          className="w-full h-full object-contain opacity-50"
        />
      </motion.div>
    </div>
  );
}