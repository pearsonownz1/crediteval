import { useState, useEffect } from "react"; // Re-import useState, useEffect
import { motion } from "framer-motion"; // Re-import motion

interface User {
  name: string;
  degree: string;
  img: string;
}

const users: User[] = [
  { name: "Ayana Peralta", degree: "Bachelor’s Equivalency", img: "https://randomuser.me/api/portraits/women/11.jpg" },
  { name: "Neil Fitzpatrick", degree: "Master’s Equivalency", img: "https://randomuser.me/api/portraits/men/12.jpg" },
  { name: "Lauren Kim", degree: "Associate’s Equivalency", img: "https://randomuser.me/api/portraits/women/13.jpg" },
  { name: "Joseph Doyle", degree: "Bachelor’s Equivalency", img: "https://randomuser.me/api/portraits/men/14.jpg" }
];

export default function DegreeEvaluationCarousel() {
  // Re-introduce state and effect for cycling
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % users.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Recent Evaluations</h2>
      {/* Re-introduce height, overflow, relative */}
      <div className="h-[88px] overflow-hidden relative">
        {/* Re-introduce motion.div and animation */}
        <motion.div
          className="space-y-4 absolute top-0 left-0 w-full"
          animate={{ y: `-${currentIndex * 88}px` }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        >
          {users.map((user, index) => (
            <div
              key={user.name}
              // Re-introduce active state styling and explicit height
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 h-[88px]`}
              style={{
                borderColor: index === currentIndex ? 'rgb(59 130 246)' : 'rgb(229 231 235)',
                backgroundColor: index === currentIndex ? 'rgb(239 246 255)' : 'rgb(255 255 255)',
              }}
            >
              <img
                src={user.img}
                alt={user.name}
                className="w-14 h-14 rounded-lg object-cover border border-gray-300"
              />
              <div>
                {/* Re-introduce conditional text color */}
                <div className={`text-lg font-semibold ${index === currentIndex ? "text-gray-900" : "text-gray-700"}`}>{user.name}</div>
                <div className="text-sm text-gray-500">{user.degree}</div>
              </div>
            </div>
          ))}
          {/* Re-introduce duplicated item for seamless loop */}
          <div
              key={users[0].name + "-clone"}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 h-[88px]`}
              style={{
                borderColor: 0 === currentIndex ? 'rgb(59 130 246)' : 'rgb(229 231 235)',
                backgroundColor: 0 === currentIndex ? 'rgb(239 246 255)' : 'rgb(255 255 255)',
              }}
            >
              <img
                src={users[0].img}
                alt={users[0].name}
                className="w-14 h-14 rounded-lg object-cover border border-gray-300"
              />
              <div>
                <div className={`text-lg font-semibold ${0 === currentIndex ? "text-gray-900" : "text-gray-700"}`}>{users[0].name}</div>
                <div className="text-sm text-gray-500">{users[0].degree}</div>
              </div>
            </div>
        </motion.div>
      </div>
    </div>
  );
}
