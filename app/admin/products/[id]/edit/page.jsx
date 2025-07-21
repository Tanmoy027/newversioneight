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
import { ArrowLeft, X } from "lucide-react"
import Link from "next/link"

export default function EditProductPage({ params }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [images, setImages] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock_quantity: "",
    specifications: "",
    materials: "",
    dimensions: "",
    weight: "",
    care_instructions: "",
    warranty_info: "",
    is_featured: false,
    is_available: true,
  })

  const categories = [
    "Living Room Set",
    "Dining Table",
    "Bedroom Set",
    "Office Desk",
    "Sofa/Couch/Bean",
    "Center Table",
    "End Table",
    "Arm Chair",
    "TV Cabinet",
    "Display Cabinet",
    "Shelf",
    "Carpet/Rug",
    "Lamp/Light/Chandelier",
    "Dining Chair",
    "Dinner Wagon",
    "Bed",
    "Murphy Bed",
    "Bed Side Table",
    "Dressing Table",
    "Study Table",
    "Conference Table",
    "Modular Work Station",
    "Visitor Chair",
    "Break Room Furniture",
    "Cabinet/Almira",
    "Book Shelf",
    "Shoe Rack",
    "Store Cabinet",
    "Fine Dining Furniture",
    "Reception Furniture",
    "Bar Stool",
    "Cash Counter",
    "PU Flooring",
    "Lab Clear Coat",
    "Interior Consultation",
    "Project Execution",
    "Epoxy Services",
    "Portable Partition",
    "Kitchen Counter Top",
    "Wooden Wash Basin",
  ]

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
            category: product.category || "",
            stock_quantity: product.stock_quantity || "",
            specifications: product.specifications || "",
            materials: product.materials || "",
            dimensions: product.dimensions || "",
            weight: product.weight || "",
            care_instructions: product.care_instructions || "",
            warranty_info: product.warranty_info || "",
            is_featured: product.is_featured || false,
            is_available: product.is_available !== false,
          })
          setExistingImages(product.images || [])
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
    const files = Array.from(e.target.files)
    const totalImages = existingImages.length + images.length + files.length

    if (totalImages > 5) {
      toast.error("Maximum 5 images allowed")
      return
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setImages((prev) => [
          ...prev,
          {
            file,
            preview: e.target.result,
            id: Date.now() + Math.random(),
          },
        ])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeNewImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  const removeExistingImage = (imageUrl) => {
    setExistingImages((prev) => prev.filter((img) => img !== imageUrl))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.description || !formData.price || !formData.category) {
        toast.error("Please fill in all required fields")
        return
      }

      if (existingImages.length === 0 && images.length === 0) {
        toast.error("Please add at least one product image")
        return
      }

      // Create FormData for file upload
      const submitData = new FormData()

      // Add form fields
      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key])
      })

      // Add existing images to keep
      submitData.append("existing_images", JSON.stringify(existingImages))

      // Add new images
      images.forEach((image, index) => {
        submitData.append(`image_${index}`, image.file)
      })

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
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
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
                <Label htmlFor="stock_quantity">Stock Quantity</Label>
                <Input
                  id="stock_quantity"
                  name="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
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
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="images">Upload New Images</Label>
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: JPG, PNG, WebP. Max size: 5MB per image. Total limit: 5 images.
                </p>
              </div>

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div>
                  <Label>Current Images</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-2">
                    {existingImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl || "/placeholder.svg"}
                          alt="Product image"
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(imageUrl)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images */}
              {images.length > 0 && (
                <div>
                  <Label>New Images</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-2">
                    {images.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.preview || "/placeholder.svg"}
                          alt="Product preview"
                          className="w-full h-24 object-cover rounded-lg border border-green-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(image.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="materials">Materials</Label>
                <Input
                  id="materials"
                  name="materials"
                  value={formData.materials}
                  onChange={handleInputChange}
                  placeholder="e.g., Solid Wood, Epoxy Resin"
                />
              </div>
              <div>
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleInputChange}
                  placeholder="e.g., 120cm x 60cm x 75cm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="e.g., 25kg"
                />
              </div>
              <div>
                <Label htmlFor="warranty_info">Warranty</Label>
                <Input
                  id="warranty_info"
                  name="warranty_info"
                  value={formData.warranty_info}
                  onChange={handleInputChange}
                  placeholder="e.g., 2 years"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="specifications">Specifications</Label>
              <Textarea
                id="specifications"
                name="specifications"
                value={formData.specifications}
                onChange={handleInputChange}
                placeholder="Enter detailed specifications"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="care_instructions">Care Instructions</Label>
              <Textarea
                id="care_instructions"
                name="care_instructions"
                value={formData.care_instructions}
                onChange={handleInputChange}
                placeholder="Enter care and maintenance instructions"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-6">
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
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_available"
                  name="is_available"
                  checked={formData.is_available}
                  onChange={handleInputChange}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_available">Available for Sale</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Updating Product..." : "Update Product"}
          </Button>
        </div>
      </form>
    </div>
  )
}
