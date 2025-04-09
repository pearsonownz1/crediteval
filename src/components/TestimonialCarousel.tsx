import React from "react";
import Slider from "react-slick";
import { Star } from "lucide-react"; // Assuming you use lucide-react for icons
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"; // Import Avatar components

// Define the testimonial structure
interface Testimonial {
  id: number;
  name: string;
  headshotUrl: string; // URL to the customer's headshot
  rating: number; // Assuming a 1-5 rating, though we'll display 5 stars visually
  testimonial: string;
}

// Example Testimonial Data (Replace with your actual data)
const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Maria Garcia",
    headshotUrl: "https://via.placeholder.com/100/8FBC8F/FFFFFF?text=MG", // Placeholder image
    rating: 5,
    testimonial: "Incredible service! The translation was accurate and delivered ahead of schedule. Highly recommend!",
  },
  {
    id: 2,
    name: "John Smith",
    headshotUrl: "https://via.placeholder.com/100/ADD8E6/FFFFFF?text=JS", // Placeholder image
    rating: 5,
    testimonial: "The credential evaluation process was smooth and professional. They helped me immensely with my university application.",
  },
  {
    id: 3,
    name: "Aisha Khan",
    headshotUrl: "https://via.placeholder.com/100/FFB6C1/FFFFFF?text=AK", // Placeholder image
    rating: 5,
    testimonial: "Fast, reliable, and excellent communication. The expert opinion letter was exactly what I needed.",
  },
  {
    id: 4,
    name: "David Lee",
    headshotUrl: "https://via.placeholder.com/100/FFD700/FFFFFF?text=DL", // Placeholder image
    rating: 5,
    testimonial: "I was impressed by the quality and speed of the translation. Very professional team.",
  },
  {
    id: 5,
    name: "Sophia Müller",
    headshotUrl: "https://via.placeholder.com/100/E6E6FA/FFFFFF?text=SM", // Placeholder image
    rating: 5,
    testimonial: "Their evaluation report was detailed and accepted without any issues. Thank you!",
  },
];

const TestimonialCarousel = () => {
  const settings = {
    dots: true, // Show pagination dots
    infinite: true,
    speed: 500, // Transition speed
    slidesToShow: 3, // Default for desktop
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000, // Time between slides
    pauseOnHover: true,
    arrows: false, // Hide default arrows, can add custom ones if needed
    responsive: [
      {
        breakpoint: 1024, // Tablet breakpoint (adjust as needed)
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 640, // Mobile breakpoint (adjust as needed)
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
    // Custom styling for dots if needed
    appendDots: (dots: React.ReactNode) => (
      <div style={{ bottom: "-30px" }}> {/* Adjust position */}
        <ul style={{ margin: "0px" }}> {dots} </ul>
      </div>
    ),
    customPaging: (i: number) => (
      <div className="w-2 h-2 bg-gray-300 rounded-full mt-4 transition-colors duration-300 slick-dot-inactive">
        {/* Active dot styling is handled by slick-theme.css or custom CSS */}
      </div>
    )
  };

  return (
    <div className="py-12 bg-gray-50"> {/* Section background */}
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
          What Our Clients Say
        </h2>
        <Slider {...settings}>
          {testimonials.map((testimonial) => {
            // Generate initials for fallback
            const initials = testimonial.name
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('');

            return (
              <div key={testimonial.id} className="px-2 md:px-4"> {/* Add padding between slides */}
                <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col"> {/* Ensure consistent height if needed */}
                  <div className="flex items-center mb-4">
                    <Avatar className="w-16 h-16 mr-4">
                      <AvatarImage src={testimonial.headshotUrl} alt={testimonial.name} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-lg text-gray-900">{testimonial.name}</p>
                      <div className="flex text-yellow-400 mt-1">
                        {/* Static 5 stars */}
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div> {/* This closes the flex items-center div */}
                  <p className="text-gray-600 italic flex-grow">"{testimonial.testimonial}"</p>
                </div> {/* This closes the bg-white card div */}
              </div> // This closes the px-2 wrapper div
            );
          })}
        </Slider>
      </div>
    </div>
  );
};

export default TestimonialCarousel;
