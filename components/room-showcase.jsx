"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function RoomShowcase() {
  // Array to track the current image index for each room
  const [currentImages, setCurrentImages] = useState([0, 0, 0, 0]);

  // Define rooms with multiple images per room
  const rooms = [
    {
      name: "Living Room",
      images: [
        "https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/276583/pexels-photo-276583.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
      ],
      category: "Living Room Set",
      description: "Elegant and comfortable living room furniture for your home",
    },
    {
      name: "Bedroom",
      images: [
        "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/3773575/pexels-photo-3773575.png?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
      ],
      category: "Bedroom Set",
      description: "Stylish bedroom furniture for a peaceful night's sleep",
    },
    {
      name: "Dining Room",
      images: [
        "https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/1395967/pexels-photo-1395967.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/2092058/pexels-photo-2092058.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
      ],
      category: "Dining Table",
      description: "Beautiful dining sets for memorable family gatherings",
    },
    {
      name: "Kid's Room",
      images: [
        "https://images.pexels.com/photos/3932929/pexels-photo-3932929.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/3932930/pexels-photo-3932930.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/1648768/pexels-photo-1648768.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
      ],
      category: "Bedroom Set",
      description: "Colorful and functional furniture for children's rooms",
    },
  ];

  // Auto-slide images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImages(prev => 
        prev.map((current, idx) => (current + 1) % rooms[idx].images.length)
      );
    }, 5000);
    
    return () => clearInterval(interval);
  }, [rooms]);

  // Function to navigate to the previous image
  const prevImage = (roomIndex) => {
    setCurrentImages(prev => {
      const newImages = [...prev];
      newImages[roomIndex] = (newImages[roomIndex] - 1 + rooms[roomIndex].images.length) % rooms[roomIndex].images.length;
      return newImages;
    });
  };

  // Function to navigate to the next image
  const nextImage = (roomIndex) => {
    setCurrentImages(prev => {
      const newImages = [...prev];
      newImages[roomIndex] = (newImages[roomIndex] + 1) % rooms[roomIndex].images.length;
      return newImages;
    });
  };

  // State for interior images
  const [currentInteriorImages, setCurrentInteriorImages] = useState([0, 0, 0, 0]);
  
  // Interior designs with multiple images per design
  const interiorDesigns = [
    {
      name: "Modern Interior",
      images: [
        "/intorior/img1.jpg",
        "/intorior/product1.jpg",
      ],
      category: "Interior Modern",
      description: "Sleek and contemporary interior designs for modern living",
    },
    {
      name: "Classic Interior",
      images: [
        "/intorior/img2.jpg",
        "/intorior/product2.jpg",
      ],
      category: "Interior Classic",
      description: "Timeless classic interior designs with elegant touches",
    },
    {
      name: "Minimalist Interior",
      images: [
        "/intorior/img3.jpg",
        "/intorior/product3.jpg",
      ],
      category: "Interior Minimalist",
      description: "Clean and uncluttered designs for minimalist aesthetics",
    },
    {
      name: "Luxury Interior",
      images: [
        "/intorior/img4.jpg",
        "/intorior/product4.jpg",
        "/intorior/img5.jpg",
      ],
      category: "Interior Luxury",
      description: "Premium interior designs with luxurious finishes",
    },
  ];
  
  // Auto-slide interior images
  useEffect(() => {
    const interiorInterval = setInterval(() => {
      setCurrentInteriorImages(prev => 
        prev.map((current, idx) => (current + 1) % interiorDesigns[idx].images.length)
      );
    }, 5000);
    
    return () => clearInterval(interiorInterval);
  }, [interiorDesigns]);
  
  // Function to navigate to the previous interior image
  const prevInteriorImage = (interiorIndex) => {
    setCurrentInteriorImages(prev => {
      const newImages = [...prev];
      newImages[interiorIndex] = (newImages[interiorIndex] - 1 + interiorDesigns[interiorIndex].images.length) % interiorDesigns[interiorIndex].images.length;
      return newImages;
    });
  };

  // Function to navigate to the next interior image
  const nextInteriorImage = (interiorIndex) => {
    setCurrentInteriorImages(prev => {
      const newImages = [...prev];
      newImages[interiorIndex] = (newImages[interiorIndex] + 1) % interiorDesigns[interiorIndex].images.length;
      return newImages;
    });
  };
  
  return (
    <section className="py-8 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-medium text-center mb-8">
          EXPLORE OUR ROOM COLLECTIONS
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-8">
          {rooms.map((room, roomIndex) => (
            <div 
              key={roomIndex}
              className="group relative overflow-hidden rounded-2xl shadow-lg h-36 sm:h-48 md:h-80 border border-gray-100"
            >
              <div className="relative w-full h-full">
                {room.images.map((image, imageIndex) => (
                  <div
                    key={imageIndex}
                    className="absolute inset-0"
                    style={{ 
                      display: currentImages[roomIndex] === imageIndex ? "block" : "none",
                      opacity: currentImages[roomIndex] === imageIndex ? 1 : 0,
                      transition: "opacity 0.7s ease-in-out"
                    }}
                  >
                    <Image
                      src={image}
                      alt={`${room.name} - View ${imageIndex + 1}`}
                      fill
                      className="object-cover rounded-2xl"
                      priority={imageIndex === 0}
                    />
                  </div>
                ))}
                
                {/* Navigation Dots - Hide on smallest screens */}
                <div className="absolute bottom-1 md:bottom-4 left-0 right-0 flex justify-center space-x-1 md:space-x-2 z-10">
                  {room.images.map((_, imageIndex) => (
                    <button
                      key={imageIndex}
                      className={`w-1 h-1 md:w-2 md:h-2 rounded-full transition-all duration-300 ${
                        currentImages[roomIndex] === imageIndex 
                          ? "bg-white md:w-4 w-2" 
                          : "bg-white/50"
                      }`}
                      onClick={() => {
                        setCurrentImages(prev => {
                          const newImages = [...prev];
                          newImages[roomIndex] = imageIndex;
                          return newImages;
                        });
                      }}
                      aria-label={`View image ${imageIndex + 1}`}
                    />
                  ))}
                </div>
                
                {/* Navigation Arrows - Hide on mobile */}
                <button 
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"
                  onClick={(e) => {
                    e.preventDefault();
                    prevImage(roomIndex);
                  }}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <button 
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"
                  onClick={(e) => {
                    e.preventDefault();
                    nextImage(roomIndex);
                  }}
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              
              <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all duration-300 rounded-2xl">
                <Link
                  href={`/products?category=${encodeURIComponent(room.category)}`}
                  className="absolute inset-0 flex flex-col items-center justify-center text-white p-2 md:p-6 z-5"
                >
                  <div 
                    className="bg-white/80 backdrop-blur-sm text-gray-900 py-1 px-3 md:py-2 md:px-6 rounded-xl mb-1 md:mb-3"
                  >
                    <h3 className="text-sm md:text-xl font-bold">{room.name}</h3>
                  </div>
                  
                  <p 
                    className="text-center text-white text-shadow hidden md:block max-w-xs"
                  >
                    {room.description}
                  </p>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Interior Design Section */}
        <div className="mt-8 md:mt-16">
          <h2 className="text-2xl font-medium text-center mb-8">
            INTERIOR DESIGN COLLECTIONS
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-8">
            {interiorDesigns.map((design, designIndex) => (
              <div 
                key={designIndex}
                className="group relative overflow-hidden rounded-2xl shadow-lg h-36 sm:h-48 md:h-80 border border-gray-100"
              >
                <div className="relative w-full h-full">
                  {design.images.map((image, imageIndex) => (
                    <div
                      key={imageIndex}
                      className="absolute inset-0"
                      style={{ 
                        display: currentInteriorImages[designIndex] === imageIndex ? "block" : "none",
                        opacity: currentInteriorImages[designIndex] === imageIndex ? 1 : 0,
                        transition: "opacity 0.7s ease-in-out"
                      }}
                    >
                      <Image
                        src={image}
                        alt={`${design.name} - View ${imageIndex + 1}`}
                        fill
                        className="object-cover rounded-2xl"
                        priority={imageIndex === 0}
                      />
                    </div>
                  ))}
                  
                  {/* Navigation Dots - Hide on smallest screens */}
                  <div className="absolute bottom-1 md:bottom-4 left-0 right-0 flex justify-center space-x-1 md:space-x-2 z-10">
                    {design.images.map((_, imageIndex) => (
                      <button
                        key={imageIndex}
                        className={`w-1 h-1 md:w-2 md:h-2 rounded-full transition-all duration-300 ${
                          currentInteriorImages[designIndex] === imageIndex 
                            ? "bg-white md:w-4 w-2" 
                            : "bg-white/50"
                        }`}
                        onClick={() => {
                          setCurrentInteriorImages(prev => {
                            const newImages = [...prev];
                            newImages[designIndex] = imageIndex;
                            return newImages;
                          });
                        }}
                        aria-label={`View interior image ${imageIndex + 1}`}
                      />
                    ))}
                  </div>
                  
                  {/* Navigation Arrows - Hide on mobile */}
                  <button 
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"
                    onClick={(e) => {
                      e.preventDefault();
                      prevInteriorImage(designIndex);
                    }}
                    aria-label="Previous interior image"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <button 
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"
                    onClick={(e) => {
                      e.preventDefault();
                      nextInteriorImage(designIndex);
                    }}
                    aria-label="Next interior image"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                
                <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all duration-300 rounded-2xl">
                  <Link
                    href={`/products?category=${encodeURIComponent(design.category)}`}
                    className="absolute inset-0 flex flex-col items-center justify-center text-white p-2 md:p-6 z-5"
                  >
                    <div 
                      className="bg-white/80 backdrop-blur-sm text-gray-900 py-1 px-3 md:py-2 md:px-6 rounded-xl mb-1 md:mb-3"
                    >
                      <h3 className="text-sm md:text-xl font-bold">{design.name}</h3>
                    </div>
                    
                    <p 
                      className="text-center text-white text-shadow hidden md:block max-w-xs"
                    >
                      {design.description}
                    </p>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
