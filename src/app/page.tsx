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
      className={`relative ${poppins.className} bg-cover bg-center bg-no-repeat bg-[url('/svg/brick.svg')] font-bold w-full h-screen flex flex-col items-center justify-center text-white text-6xl overflow-hidden`}
    >
      <div className="absolute inset-0 bg-black/50"></div>

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

      <div className="z-10 cursor-pointer text-center text-3xl sm:text-4xl md:text-6xl px-4">
        {error ? "Allow location access" : "No names just vibes ."}
      </div>

      <div className="z-10 mt-6 text-lg font-normal text-gray-200">
        {loading && "Detecting location..."}
        {error && <span className="text-red-400">Error: {error}</span>}
        {location && (
          <p className="text-sm">
            🌍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </p>
        )}
      </div>
    </div>
  );
}

export default Page;
