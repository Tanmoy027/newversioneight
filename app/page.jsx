import { supabase } from '@/lib/supabase';
import Hero from "@/components/Hero"
import FeaturesSection from "@/components/features-section"
import TrendyProducts from "@/components/trendy-products"
import AboutSection from "@/components/about-section"
import RoomShowcase from "@/components/room-showcase"
import Achievements from "@/components/achievements"
import ContactForm from "@/components/contact-form"
import FurnitureCategories from "@/components/furniture-categories" // Fixed import path
import ServicesSection from "@/components/services-section"

export default async function Home() {
  let products = [];
  
  try {
    // Fetch all products instead of limiting to specific categories
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false })
      .limit(20); // Limit to 20 most recent products for performance
    
    if (error) {
      console.error("Supabase error:", error);
    } else {
      products = data || [];
    }
  } catch (err) {
    console.error("Failed to fetch products:", err);
  }
  
  // Ensure all products have necessary properties to prevent hydration errors
  products = products.map(product => ({
    ...product,
    price: product.price || 0,
    discount_price: product.discount_price || null,
    name: product.name || 'Product',
    id: product.id || `temp-${Math.random().toString(36).substring(7)}`,
  }));
  
  return (
    <div>
      <Hero />
      <FurnitureCategories /> 
    
      {products.length > 0 && <TrendyProducts products={products} /> }
      <RoomShowcase />
        <ServicesSection />
      <AboutSection />
      <Achievements />
      <ContactForm />
      <FeaturesSection />
    </div>
  )
}
