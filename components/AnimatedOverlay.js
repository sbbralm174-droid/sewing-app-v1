// components/AnimatedOverlay.jsx
'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function AnimatedOverlay() {
  const [isHovered, setIsHovered] = useState(false);

  // Text animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // Graph animation variants
  const graphVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.8
      }
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.3 }
    }
  };

  const barVariants = {
    hidden: { scaleY: 0 },
    visible: (i) => ({
      scaleY: 1,
      transition: {
        duration: 0.5,
        delay: i * 0.1 + 1.2,
        ease: "easeOut"
      }
    })
  };

  const title =  ' "Smarter Sewing, Stronger Management"  '.split(" ");

  return (
    <div className="relative z-20 flex items-center justify-center h-full px-4">
      <motion.div
        className="text-center max-w-6xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Animated Title */}
        <motion.h1 
          className="text-4xl md:text-6xl lg:text-5xl pt-50 font-bold text-white mb-6"
        >
          {title.map((word, index) => (
            <motion.span
              key={index}
              variants={itemVariants}
              className="inline-block mr-4 last:mr-0"
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-xl md:text-2xl italic text-gray-200 mb-8 max-w-2xl mx-auto"
          variants={itemVariants}
        >
          Integrated ERP empowering sewing efficiency, accuracy and business growth
        </motion.p>

        {/* CTA Button with Graph */}
        <div className="flex flex-col md:flex-row items-center justify-end gap-12 mb-12">
          {/* CTA Button */}
          

          {/* Animated Graph */}
          <motion.div
            className="flex-shrink-0 relative top-10 left-30"
            variants={graphVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-10 border border-white/20 shadow-2xl">
              {/* Graph Title */}
              <motion.p 
                className="text-white font-semibold mb-4 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
              >
                Heigher efficiency
              </motion.p>
              
              {/* Graph Bars */}
              <div className="flex  items-end justify-center gap-2 h-24">
                {[30, 50, 70, 90, 60, 40, 80].map((height, index) => (
                  <motion.div
                    key={index}
                    className="w-6 bg-gradient-to-t from-purple-500 to-blue-400 rounded-t-lg relative overflow-hidden"
                    style={{ height: `${height}%` }}
                    variants={barVariants}
                    custom={index}
                    animate={{
                      height: `${height}%`,
                      transition: {
                        duration: 0.8,
                        delay: index * 0.1 + 1.2,
                        ease: "easeOut"
                      }
                    }}
                  >
                    {/* Bar shine effect */}
                    <motion.div
                      className="absolute top-30 left-0 w-full h-full bg-gradient-to-b from-white/30 to-transparent"
                      animate={{
                        y: ['-100%', '100%']
                      }}
                      transition={{
                        duration: 2,
                        delay: index * 0.2 + 2,
                        repeat: Infinity,
                        repeatDelay: 3
                      }}
                    />
                  </motion.div>
                ))}
              </div>
              
              {/* Graph Labels */}
              <motion.div 
                className="flex justify-between mt-2 text-xs text-gray-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
              >
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
                <span>S</span>
              </motion.div>

              {/* Floating Data Points */}
              
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{
            y: [0, 10, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <motion.div
              className="w-1 h-3 bg-white rounded-full mt-2"
              animate={{
                y: [0, 12, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}