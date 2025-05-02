import { useEffect, useState } from 'react';

const firstNames = ['Maria', 'John', 'Amal', 'Li', 'Omar', 'Daniela', 'Carlos', 'Fatima'];
const cities = ['Miami', 'New York', 'Toronto', 'San Francisco', 'Houston', 'Chicago'];
const actions = [
  'completed checkout',
  'submitted a rush evaluation',
  'uploaded their diploma',
  'got USCIS approval',
  'requested same-day delivery',
];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Define the structure for the generated message object
interface SocialProofEntry {
  text: string;
  avatar: string;
}

function generateMessage(): SocialProofEntry {
  const name = firstNames[getRandomInt(0, firstNames.length - 1)];
  // const city = cities[getRandomInt(0, cities.length - 1)]; // Removed city
  const action = actions[getRandomInt(0, actions.length - 1)];
  const minutesAgo = getRandomInt(2, 59);
  // Determine gender randomly for avatar URL
  const gender = getRandomInt(0, 1) === 0 ? 'men' : 'women'; // Use 'men' or 'women' for randomuser.me paths
  // Generate random number for avatar ID
  const avatarId = getRandomInt(1, 99);
  const avatar = `https://randomuser.me/api/portraits/thumb/${gender}/${avatarId}.jpg`;

  return {
    // Updated text format to exclude city
    text: `${name} ${action} ${minutesAgo} minutes ago.`,
    avatar,
  };
}

export default function MiniSocialProof() {
  // Use the SocialProofEntry interface for state type
  const [entry, setEntry] = useState<SocialProofEntry>(generateMessage());

  useEffect(() => {
    const interval = setInterval(() => {
      setEntry(generateMessage());
    }, 6000); // Update every 6 seconds
    return () => clearInterval(interval);
  }, []);

  // Check if entry and entry.avatar exist before rendering
  if (!entry || !entry.avatar) {
    return null; // Or a loading state
  }

  return (
    // Use fixed positioning instead of absolute to ensure it stays relative to viewport
    <div className="fixed bottom-6 left-6 bg-white/90 border border-gray-200 shadow-md rounded-full px-4 py-2 flex items-center gap-3 text-sm text-gray-700 backdrop-blur-sm animate-fade-in transition-all z-50"> {/* Added z-index */}
      <img
        src={entry.avatar}
        alt="User avatar"
        className="w-7 h-7 rounded-full object-cover border border-white shadow" // Kept styling from user's code
        onError={(e) => {
          // Optional: Handle image loading errors, e.g., set a default avatar
          console.error("Failed to load avatar:", entry.avatar);
          // e.currentTarget.src = '/path/to/default-avatar.png';
        }}
      />
      <span className="whitespace-nowrap">{entry.text}</span>
    </div>
  );
}
