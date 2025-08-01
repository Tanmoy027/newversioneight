"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ArrowLeft, X, Upload } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function EditProductPage({ params }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [newImages, setNewImages] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [deletedImages, setDeletedImages] = useState([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    stock: "",
    is_featured: false,
  })

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true)
        const response = await fetch('/api/categories')
        const result = await response.json()
        
        if (result.success) {
          setCategories(result.data || [])
        } else {
          console.error('Failed to fetch categories:', result.error)
          toast.error('Failed to load categories')
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        toast.error('Failed to load categories')
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/admin/products/${params.id}`)
        const result = await response.json()

        if (result.success) {
          const product = result.data
          setFormData({
            name: product.name || "",
            description: product.description || "",
            price: product.price || "",
            category_id: product.category_id || "",
            stock: product.stock || "",
            is_featured: product.is_featured || false,
          })
          setExistingImages(product.image_urls || [])
        } else {
          toast.error("Product not found")
          router.push("/admin/products")
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        toast.error("Failed to load product")
        router.push("/admin/products")
      } finally {
        setInitialLoading(false)
      }
    }

    if (params.id) {
      fetchProduct()
    }
  }, [params.id, router])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleImageUpload = (e) => {
  const maxNew = 4 - (existingImages.length - deletedImages.length + newImages.length);
  const files = Array.from(e.target.files).slice(0, maxNew);
  files.forEach(file => {
    if (file.size > 5 * 1024 * 1024) return toast.error("Image size should be less than 5MB");
    if (!file.type.startsWith('image/')) return toast.error("Please select a valid image file");
    const reader = new FileReader();
    reader.onload = (e) => setNewImages(prev => [...prev, {file, preview: e.target.result}]);
    reader.readAsDataURL(file);
  });
}

  const removeNewImage = (index) => {
  setNewImages(prev => prev.filter((_, i) => i !== index));
}
const removeExistingImage = (index, url) => {
  setDeletedImages(prev => [...prev, url]);
  setExistingImages(prev => prev.filter((_, i) => i !== index));
}

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.description || !formData.price || !formData.category_id) {
        toast.error("Please fill in all required fields")
        return
      }

      const totalImages = existingImages.length + newImages.length;
      if (totalImages === 0) {
        toast.error("Please add at least one product image")
        return
      }

      // Create FormData for file upload
      const submitData = new FormData()

      // Add form fields
      submitData.append('name', formData.name)
      submitData.append('description', formData.description)
      submitData.append('price', formData.price)
      submitData.append('category_id', formData.category_id)
      submitData.append('stock', formData.stock)
      submitData.append('is_featured', formData.is_featured)

      // Add deleted images
      submitData.append('deleted_images', JSON.stringify(deletedImages));
      // Add new images
      newImages.forEach((img, index) => {
        submitData.append(`image_${index}`, img.file);
      });

      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: "PUT",
        body: submitData,
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Product updated successfully!")
        router.push("/admin/products")
      } else {
        toast.error(result.error || "Failed to update product")
      }
    } catch (error) {
      console.error("Error updating product:", error)
      toast.error("Failed to update product")
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Product</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category_id">Category *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                    ) : categories.length > 0 ? (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-categories" disabled>No categories found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter product description"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (BDT) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="image">Upload New Images (up to 4 total)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="mt-1"
                  multiple
                />
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: JPG, PNG, WebP. Max size: 5MB per image. Max 4 images total.
                </p>
              </div>

              {/* Current Image */}
              {existingImages.length > 0 && (
                <div>
                  <Label>Existing Images</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    {existingImages.map((url, index) => (
                      <div key={index} className="relative w-48 h-48 border rounded-lg overflow-hidden">
                        <Image src={url} alt={`Existing image ${index + 1}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 192px" />
                        <button type="button" onClick={() => removeExistingImage(index, url)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {newImages.length > 0 && (
                <div>
                  <Label>New Image Previews</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    {newImages.map((img, index) => (
                      <div key={index} className="relative w-48 h-48 border-2 border-green-300 rounded-lg overflow-hidden">
                        <Image src={img.preview} alt={`New image ${index + 1}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 192px" />
                        <button type="button" onClick={() => removeNewImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {existingImages.length + newImages.length === 0 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No images. Please add at least one product image.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_featured"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleInputChange}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_featured">Featured Product</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading || categoriesLoading}>
            {loading ? "Updating Product..." : "Update Product"}
          </Button>
        </div>
      </form>
    </div>
  )
}