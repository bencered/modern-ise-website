"use client"
import { useEffect, useRef, useState } from "react";

const AnimatedBarChart = () => {
  const [isVisible, setIsVisible] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (isMobile) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.8 }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-5 lg:p-5" ref={chartRef}>
      <div className="w-full space-y-4 border-2 border-neutral-800/70 bg-background/70 p-8 lg:col-span-3">
        <h2 className="mb-6 text-2xl font-bold">Course Length</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium lg:hidden">ISE</span>
            <span className="hidden font-medium lg:block">Immersive Software Engineering</span>
            <span>4 year masters</span>
          </div>
          <div className="h-4 overflow-hidden drop-shadow-[0_0px_15px_rgba(74,222,128,1)]">
            <div
              className={`relative h-full overflow-hidden transition-all duration-1000 ease-out`}
              style={{
                width: isVisible ? `66%` : "0%",
              }}
            >
              <div className={`
                  background-animate absolute 
                  inset-0 rounded-sm bg-gradient-to-r
                  from-green-700 via-green-400 to-green-700
                `}>
                <style jsx>{`
                    .background-animate {
                      background-size: 200% 100%;
                      animation: flowGradient 2s linear infinite;
                    }
                    @keyframes flowGradient {
                      0% { background-position: 100% 0%; }
                      100% { background-position: -100% 0%; }
                    }
                  `}</style>
              </div>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="hidden font-medium lg:block">Traditional CS Course</span>
            <span className="font-medium lg:hidden">CS Course</span>

            <span className="hidden lg:block">4 year bachelor&apos;s + 2 year masters</span>
            <span className="lg:hidden">6 year masters</span>
          </div>
          <div className="h-4 overflow-hidden rounded-sm">
            <div
              className={`h-full bg-neutral-300 transition-all duration-1000 ease-out dark:bg-white/60`}
              style={{
                width: isVisible ? `100%` : "0%",
              }}
            />
          </div>
        </div>
      </div>

      <div className="w-full space-y-4 border-2 border-neutral-800/70 bg-background/70 p-8 lg:col-span-2">
        <h2 className="mb-6 text-2xl font-bold">Teaching Methodology</h2>
        <div>
          <h3 className="bg-gradient-to-r from-green-600 to-white bg-clip-text font-sans text-2xl font-bold text-transparent">[ISE]</h3>
          <h3>
            Learn in <span className="bg-gradient-to-r from-green-500 to-green-400 bg-clip-text text-transparent">
              studios
            </span>
            , working on <span className="bg-gradient-to-r from-sky-500 to-sky-300 bg-clip-text text-transparent">
              projects
            </span>, with a syllabus hand-crafted around <span className="bg-gradient-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent">
              you
            </span>.
          </h3>
        </div>

        <div>
          <h3 className="text-xl">Traditional CS</h3>
          <h3 className="text-neutral-600 dark:text-white/80">Sit in impersonal lecture halls scattered across campus.</h3>
        </div>
      </div>

      <div className="w-full space-y-4 border-2 border-neutral-800/70 bg-background/70 p-8 lg:col-span-5">
        <h2 className="mb-6 text-2xl font-bold">Real-World Placements</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium lg:hidden">ISE</span>
            <span className="hidden font-medium lg:block">Immersive Software Engineering</span>
            <span>5 residencies</span>
          </div>
          <div className="h-4 overflow-hidden drop-shadow-[0_0px_15px_rgba(74,222,128,1)]">
            <div
              className={`relative h-full overflow-hidden transition-all duration-1000 ease-out`}
              style={{
                width: isVisible ? `100%` : "0%",
              }}
            >
              <div className={`
                  background-animate absolute 
                  inset-0 rounded-sm bg-gradient-to-r
                  from-green-700 via-green-400 to-green-700
                `}>
                <style jsx>{`
                    .background-animate {
                      background-size: 200% 100%;
                      animation: flowGradient 2s linear infinite;
                    }
                    @keyframes flowGradient {
                      0% { background-position: 100% 0%; }
                      100% { background-position: -100% 0%; }
                    }
                  `}</style>
              </div>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Traditional CS Course</span>
            <span>1 summer placement</span>
          </div>
          <div className="h-4 overflow-hidden">
            <div
              className={`h-full rounded-sm bg-neutral-300 transition-all duration-1000 ease-out dark:bg-white/60`}
              style={{
                width: isVisible ? `20%` : "0%",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedBarChart;
