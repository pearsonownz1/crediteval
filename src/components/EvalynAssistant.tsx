import { useEffect, useState } from 'react'

const evalynSteps = [
  'Hi, I’m Evalyn – your credential assistant 🤖',
  'Scanning your uploaded documents...',
  'Verifying formatting and quality standards...',
  'Cross-referencing credential format with USCIS guidelines...',
  '✅ Looks great – your documents meet official requirements!'
]

export default function EvalynAssistant() {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    // Start the interval only after the initial message has been shown for a bit
    const initialDelay = setTimeout(() => {
      const interval = setInterval(() => {
        setStepIndex((prev) =>
          prev < evalynSteps.length - 1 ? prev + 1 : prev // Stop at the last step
        )
      }, 4000) // Change step every 4 seconds

      // Clear interval when component unmounts or if step reaches the end
      return () => clearInterval(interval);
    }, 2000); // Show initial message for 2 seconds

    // Clear timeout if component unmounts early
    return () => clearTimeout(initialDelay);

  }, []) // Empty dependency array ensures this runs only once on mount

  // Stop interval explicitly when the last step is reached
  useEffect(() => {
    if (stepIndex === evalynSteps.length - 1) {
      // Potentially clear interval here if needed, though the logic above already stops incrementing
    }
  }, [stepIndex]);


  return (
    <div className="fixed bottom-4 left-4 bg-white/95 border border-gray-200 shadow-lg rounded-xl max-w-xs w-full flex items-start gap-3 p-4 animate-fade-in z-50">
      <img
        // Using a specific professional headshot from randomuser.me
        src="https://randomuser.me/api/portraits/women/75.jpg"
        alt="Evalyn AI Assistant"
        className="w-10 h-10 rounded-full object-cover border border-gray-300 flex-shrink-0"
        onError={(e) => {
          // Fallback if the image fails to load
          console.error("Failed to load Evalyn avatar");
          // Optionally set a default image source here
          // e.currentTarget.src = '/path/to/default-avatar.png';
        }}
      />
      <p className="text-sm text-gray-700 leading-snug pt-1"> {/* Added slight top padding for better alignment */}
        {evalynSteps[stepIndex]}
      </p>
    </div>
  )
}
