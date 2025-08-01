"use client";

import Link from "next/link";
import Image from "next/image";

export default function TrendyProducts({ products = [] }) {
  // If no products, show placeholder products
  const displayProducts = products.length > 0 ? products : [
    {
      id: 1,
      name: "Modern Sofa",
      price: 899,
      discount_price: 799,
      image_url: "https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    },
    {
      id: 2,
      name: "Elegant Chair",
      price: 299,
      discount_price: null,
      image_url: "https://images.pexels.com/photos/586316/pexels-photo-586316.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    },
    {
      id: 3,
      name: "Coffee Table",
      price: 449,
      discount_price: 399,
      image_url: "https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    },
    {
      id: 4,
      name: "Bookshelf",
      price: 599,
      discount_price: null,
      image_url: "https://images.pexels.com/photos/1395967/pexels-photo-1395967.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    }
  ];

  // Display up to 8 products
  const displayedProducts = displayProducts.slice(0, 8);

  return (
    <section className="py-8 md:py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-medium mb-4">
            TRENDY PRODUCTS
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our most popular and stylish furniture pieces
          </p>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedProducts.map((product) => (
              <div key={product.id} className="group">
                <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square">
                  <Image
                    src={(product.image_urls && product.image_urls.length > 0 ? product.image_urls[0] : product.image_url) || '/placeholder.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.discount_price && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs rounded">
                      Sale
                    </div>
                  )}
                </div>
                
                <div className="mt-4 text-center">
                  <h3 className="font-medium text-lg">{product.name}</h3>
                  <div className="mt-2">
                    {product.discount_price ? (
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-gray-500 line-through">৳{product.price}</span>
                        <span className="text-red-600 font-bold">৳{product.discount_price}</span>
                      </div>
                    ) : (
                      <span className="text-gray-900 font-bold">৳{product.price}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No navigation buttons as requested */}
        </div>

        <div className="text-center mt-8">
          <Link 
            href="/products" 
            className="inline-block bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}