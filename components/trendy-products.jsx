"use client"
import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
export default function TrendyProducts({ products = [] }) {
  // Refs for scrollable containers
  const centerTableScrollRef = useRef(null);
  const diningScrollRef = useRef(null);
  const diningChairScrollRef = useRef(null);
  // Group products by category dynamically
  const productsByCategory = products.reduce((acc, product) => {
    const categoryName = product.categories?.name || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {});
  
  // Define preferred category order
  const preferredCategories = ['Center Table', 'Dining Table', 'Dining Chair'];
  
  // Get categories in preferred order, fallback to categories with most products
  const topCategories = [];
  
  // First, add preferred categories if they have products
  preferredCategories.forEach(categoryName => {
    if (productsByCategory[categoryName] && productsByCategory[categoryName].length > 0) {
      topCategories.push({
        name: categoryName,
        products: productsByCategory[categoryName].slice(0, 4)
      });
    }
  });
  
  // If we don't have 3 categories yet, fill with other categories by product count
  if (topCategories.length < 3) {
    const remainingCategories = Object.entries(productsByCategory)
      .filter(([categoryName]) => !preferredCategories.includes(categoryName))
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 3 - topCategories.length)
      .map(([categoryName, categoryProducts]) => ({
        name: categoryName,
        products: categoryProducts.slice(0, 4)
      }));
    
    topCategories.push(...remainingCategories);
  }
  // Create a placeholder image - use relative path instead of direct URL
  const placeholderImage = "/placeholder.jpg";
  // Scroll handlers
  const scroll = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  // Custom Image component to handle loading errors consistently
  function TrendyProductImage({ src, alt }) {
    const [imgSrc, setImgSrc] = useState(src || placeholderImage);
    return (
      <Image
        src={imgSrc}
        alt={alt}
        fill
        sizes="100vw"
        className="object-cover hover:scale-105 transition-transform duration-300"
        onError={() => setImgSrc(placeholderImage)}
        unoptimized={false}
      />
    );
  }
  // Function to render a product grid with category heading
  const renderProductGrid = (products, categoryTitle, scrollRef, categoryLink) => {
    // Don't render if no products
    if (products.length === 0) return null;
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <Link href={categoryLink} className="text-xl font-medium text-amber-600 hover:text-amber-700 transition-colors">
            {categoryTitle}
          </Link>
          {/* Navigation arrows - only visible on mobile */}
          <div className="flex md:hidden space-x-2">
            <button
              onClick={() => scroll(scrollRef, 'left')}
              className="p-1 bg-amber-100 rounded-full hover:bg-amber-200"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} className="text-amber-600" />
            </button>
            <button
              onClick={() => scroll(scrollRef, 'right')}
              className="p-1 bg-amber-100 rounded-full hover:bg-amber-200"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} className="text-amber-600" />
            </button>
          </div>
        </div>
        {/* Mobile: Horizontal scrollable container */}
        <div
          ref={scrollRef}
          className="flex md:hidden overflow-x-auto gap-3 pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div
              key={`mobile-${product.id}`}
              className="min-w-[200px] bg-white p-3 shadow-sm hover:shadow-md transition-shadow rounded-md"
            >
              <Link href={`/products/${product.id}`}>
                <div className="relative h-40 mb-2 overflow-hidden rounded-md">
                  <TrendyProductImage
                    src={(product.image_urls && product.image_urls.length > 0 ? product.image_urls[0] : product.image_url) || placeholderImage}
                    alt={product.name}
                  />
                  {product.discount_price && (
                    <span className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 text-xs rounded-md">
                      SALE
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-sm truncate">{product.name}</h3>
                <div className="flex items-center mt-1 mb-1">
                  <div className="flex text-amber-500 text-xs">★★★★★</div>
                </div>
                <div className="flex items-center">
                  {product.discount_price ? (
                    <>
                      <span className="text-amber-600 font-bold text-sm">৳{product.discount_price}</span>
                      <span className="ml-2 text-gray-400 line-through text-xs">৳{product.price}</span>
                    </>
                  ) : (
                    <span className="text-gray-800 font-bold text-sm">৳{product.price}</span>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
        {/* Desktop: Grid layout */}
        <div className="hidden md:grid grid-cols-4 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white p-3 shadow-sm hover:shadow-md transition-shadow rounded-md">
              <Link href={`/products/${product.id}`}>
                <div className="relative h-40 mb-2 overflow-hidden rounded-md">
                  <TrendyProductImage
                    src={(product.image_urls && product.image_urls.length > 0 ? product.image_urls[0] : product.image_url) || placeholderImage}
                    alt={product.name}
                  />
                  {product.discount_price && (
                    <span className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 text-xs rounded-md">
                      SALE
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-sm truncate">{product.name}</h3>
                <div className="flex items-center mt-1 mb-1">
                  <div className="flex text-amber-500 text-xs">★★★★★</div>
                </div>
                <div className="flex items-center">
                  {product.discount_price ? (
                    <>
                      <span className="text-amber-600 font-bold text-sm">৳{product.discount_price}</span>
                      <span className="ml-2 text-gray-400 line-through text-xs">৳{product.price}</span>
                    </>
                  ) : (
                    <span className="text-gray-800 font-bold text-sm">৳{product.price}</span>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  };
  return (
    <section className="py-8 md:py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-medium mb-4">
            TRENDY PRODUCTS
          </h2>
        </div>
        {topCategories.map((category, index) => {
          const scrollRef = index === 0 ? centerTableScrollRef : index === 1 ? diningScrollRef : diningChairScrollRef;
          return (
            <div key={category.name}>
              {renderProductGrid(
                category.products, 
                category.name, 
                scrollRef, 
                `/products?category=${encodeURIComponent(category.name)}`
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}