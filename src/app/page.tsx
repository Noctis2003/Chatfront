// now we gotta start the process of connecting to a room from the said room key
// but do i hash the room key or just use it as is?
// for now i'll just use it as is
// first we need to ge the room key from local storage
// 
"use client";
import React, { useEffect, useState } from "react";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { useGeolocation } from "../hooks/useGeolocation";
import axios from "axios";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

interface StyledSvg {
  src: string | StaticImageData;
  style: React.CSSProperties;
}

function Page() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [styledSvgs, setStyledSvgs] = useState<StyledSvg[]>([]);

  const router = useRouter();
  const { location, error, loading } = useGeolocation();


 useEffect(() => {

  if (!location) return;

  const fetchRoom = async () => {
    try {
      const lat = location.latitude;
      const lon = location.longitude;

      console.log("Sending to backend:", lat, lon);

      const res = await axios.post(
        "https://chatserverv0-0-1.onrender.com/getroom",
        { lat, lon }
      );

      console.log("Room fetched:", res.data.room.key);
      localStorage.setItem("room_key", res.data.room.key);
      router.push("/anon");
    } catch (err) {
      console.error("Error fetching room:", err);
    }
  };

  fetchRoom();
}, [loading]);


  return (
    <div
      className={`relative ${poppins.className} font-bold w-full h-screen flex flex-col items-center justify-center text-white text-6xl overflow-hidden bg-gradient-to-b from-sky-400 via-sky-300 to-blue-200`}
    >
      {/* Cloud layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large cloud 1 */}
        <div className="absolute top-[10%] left-[5%] w-72 h-20 bg-white/70 rounded-full blur-md animate-[drift_25s_linear_infinite]" />
        <div className="absolute top-[8%] left-[8%] w-48 h-16 bg-white/80 rounded-full blur-sm" style={{ animation: "drift 25s linear infinite" }} />

        {/* Large cloud 2 */}
        <div className="absolute top-[25%] right-[10%] w-80 h-24 bg-white/60 rounded-full blur-md" style={{ animation: "drift 30s linear infinite reverse" }} />
        <div className="absolute top-[23%] right-[14%] w-52 h-18 bg-white/70 rounded-full blur-sm" style={{ animation: "drift 30s linear infinite reverse" }} />

        {/* Small cloud 3 */}
        <div className="absolute top-[45%] left-[20%] w-56 h-16 bg-white/50 rounded-full blur-md" style={{ animation: "drift 35s linear infinite", animationDelay: "-10s" }} />

        {/* Cloud 4 */}
        <div className="absolute top-[15%] left-[40%] w-64 h-20 bg-white/65 rounded-full blur-md" style={{ animation: "drift 28s linear infinite", animationDelay: "-5s" }} />
        <div className="absolute top-[13%] left-[44%] w-40 h-14 bg-white/75 rounded-full blur-sm" style={{ animation: "drift 28s linear infinite", animationDelay: "-5s" }} />

        {/* Cloud 5 */}
        <div className="absolute top-[60%] right-[25%] w-60 h-18 bg-white/40 rounded-full blur-lg" style={{ animation: "drift 32s linear infinite reverse", animationDelay: "-8s" }} />

        {/* Cloud 6 - bottom haze */}
        <div className="absolute bottom-[5%] left-[10%] w-96 h-24 bg-white/30 rounded-full blur-xl" style={{ animation: "drift 40s linear infinite", animationDelay: "-15s" }} />
        <div className="absolute bottom-[8%] right-[5%] w-80 h-20 bg-white/25 rounded-full blur-xl" style={{ animation: "drift 38s linear infinite reverse", animationDelay: "-12s" }} />
      </div>

      {/* Soft overlay for text readability */}
      <div className="absolute inset-0 bg-sky-900/15"></div>

      {/* Cloud drift animation */}
      <style jsx>{`
        @keyframes drift {
          0% { transform: translateX(-20%); }
          50% { transform: translateX(20%); }
          100% { transform: translateX(-20%); }
        }
      `}</style>

      {styledSvgs.map((svg, index) => (
        <Image
          key={index}
          src={svg.src}
          alt="icon"
          className="w-[40px] opacity-60"
          style={svg.style}
          width={100}
          height={100}
        />
      ))}

      {/* Radar animation */}
      {loading && !error && !location && (
        <div className="z-10 flex flex-col items-center justify-center gap-6">
          <div className="relative w-48 h-48 sm:w-64 sm:h-64">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-white/50" />
            {/* Middle ring */}
            <div className="absolute inset-6 rounded-full border border-white/40" />
            {/* Inner ring */}
            <div className="absolute inset-12 rounded-full border border-white/30" />
            {/* Innermost ring */}
            <div className="absolute inset-[4.5rem] rounded-full border border-white/25" />
            {/* Cross lines */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-px bg-white/25" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-full w-px bg-white/25" />
            </div>
            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
            </div>
            {/* Radar sweep */}
            <div
              className="absolute inset-0 rounded-full animate-spin"
              style={{ animationDuration: "2s" }}
            >
              <div
                className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left"
                style={{
                  background:
                    "conic-gradient(from 0deg at 0% 100%, transparent 0deg, rgba(255,255,255,0.4) 40deg, transparent 80deg)",
                }}
              />
            </div>
            {/* Ping dots that appear randomly */}
            <div className="absolute top-[30%] left-[65%] w-1.5 h-1.5 rounded-full bg-white/80 animate-ping" style={{ animationDuration: "3s" }} />
            <div className="absolute top-[55%] left-[25%] w-1 h-1 rounded-full bg-white/60 animate-ping" style={{ animationDuration: "4s", animationDelay: "1s" }} />
            <div className="absolute top-[70%] left-[60%] w-1 h-1 rounded-full bg-white/50 animate-ping" style={{ animationDuration: "3.5s", animationDelay: "2s" }} />
          </div>
          <p className="text-base font-normal text-white/90 tracking-widest uppercase animate-pulse drop-shadow-md">
            Scanning area...
          </p>
        </div>
      )}

      {/* Title & status (shown when not loading) */}
      {!loading && (
        <>
          <div className="z-10 cursor-pointer text-center text-3xl sm:text-4xl md:text-6xl px-4 drop-shadow-lg text-white/90 animate-fadeIn text-shadow-lg">
            {error ? "Allow location access" : "No names just vibes ."}
          </div>

          <div className="z-10 mt-6 text-lg font-normal text-white/80 drop-shadow-md">
            {error && <span className="text-red-600 font-semibold drop-shadow-sm">Error: {error}</span>}
            {location && (
              <p className="text-sm">
                🌍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Page;
