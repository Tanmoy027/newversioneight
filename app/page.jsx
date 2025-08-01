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
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id')
      .in('name', ['Center Table', 'Dining Table', 'Dining Chair']);
    if (catError) {
      console.error("Supabase category error:", catError);
    } else {
      const catIds = categories?.map(c => c.id) || [];
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .in('category_id', catIds);
      if (error) {
        console.error("Supabase error:", error);
      } else {
        products = data || [];
      }
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
