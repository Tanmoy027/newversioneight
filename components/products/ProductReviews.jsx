'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Star, MessageSquare, Camera, X, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()

  // Review form state
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [reviewImages, setReviewImages] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)

  // Define fetch functions with useCallback to prevent unnecessary re-renders
  const fetchReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('product_reviews_with_user')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching reviews:', error)
        toast.error(`Failed to load reviews: ${error.message || 'Unknown error'}`)
        return
      }
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error.message || error)
      toast.error(`Failed to load reviews: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [productId])

  const fetchReviewStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('product_review_stats')
        .select('*')
        .eq('product_id', productId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching review stats:', error)
        return
      }
      setReviewStats(data)
    } catch (error) {
      console.error('Error fetching review stats:', error.message || error)
    }
  }, [productId])
  
  // Fetch reviews and stats
  useEffect(() => {
    fetchReviews()
    fetchReviewStats()
  }, [fetchReviews, fetchReviewStats])

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return []
    
    setUploadingImages(true)
    const uploadedUrls = []

    try {
      // Check if the review bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        console.error('Error checking buckets:', bucketsError)
        toast.error(`Storage access error: ${bucketsError.message || 'Could not access storage'}`)
        return []
      }
      
      const reviewBucketExists = buckets.some(bucket => bucket.name === 'review')
      
      if (!reviewBucketExists) {
        console.error('Review bucket does not exist')
        toast.error('Storage not properly configured. Please contact support.')
        return []
      }
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { data, error } = await supabase.storage
          .from('review')
          .upload(fileName, file)

        if (error) {
          console.error('Upload error:', error)
          toast.error(`Failed to upload image ${file.name}: ${error.message || 'Unknown error'}`)
          continue // Skip this file but try to upload others
        }

        const { data: { publicUrl } } = supabase.storage
          .from('review')
          .getPublicUrl(fileName)

        uploadedUrls.push(publicUrl)
      }
      
      if (uploadedUrls.length === 0 && files.length > 0) {
        toast.error('Failed to upload any images. Please try again.')
      } else if (uploadedUrls.length < files.length) {
        toast.warning(`Uploaded ${uploadedUrls.length} of ${files.length} images.`)
      }
      
      return uploadedUrls
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error(`Failed to upload images: ${error.message || 'Unknown error'}`)
      return []
    } finally {
      setUploadingImages(false)
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('Please sign in to submit a review')
      return
    }

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    if (!comment.trim()) {
      toast.error('Please write a review comment')
      return
    }

    setSubmitting(true)

    try {
      // Upload images if any
      const imageUrls = reviewImages.length > 0 ? await handleImageUpload(reviewImages) : []

      // Prepare review data
      const reviewData = {
        product_id: productId,
        user_id: user.id,
        rating,
        title: title.trim() || null,
        comment: comment.trim(),
        image_urls: imageUrls.length > 0 ? imageUrls : null
      }
      
      console.log('Submitting review:', reviewData)
      
      // Submit review
      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()

      if (error) {
        console.error('Supabase error:', error)
        let errorMessage = 'Failed to submit review';
        
        if (error.code === '23503') {
          errorMessage = 'Invalid product or user reference';
        } else if (error.code === '23514') {
          errorMessage = 'Rating must be between 1 and 5';
        } else if (error.message) {
          errorMessage += `: ${error.message}`;
        }
        
        toast.error(errorMessage);
        return;
      }

      toast.success('Review submitted successfully! It will be visible after admin approval.')
      
      // Reset form
      setRating(0)
      setTitle('')
      setComment('')
      setReviewImages([])
      setDialogOpen(false)
      
      // Refresh reviews
      fetchReviews()
      fetchReviewStats()
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit review: ' + (error.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (rating, interactive = false, onStarClick = null) => {
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${
              interactive ? 'cursor-pointer hover:text-yellow-400' : ''
            }`}
            onClick={() => interactive && onStarClick && onStarClick(i + 1)}
          />
        ))}
      </div>
    )
  }

  const renderRatingDistribution = () => {
    if (!reviewStats) return null

    const total = reviewStats.total_reviews
    const ratings = [
      { stars: 5, count: reviewStats.five_star_count },
      { stars: 4, count: reviewStats.four_star_count },
      { stars: 3, count: reviewStats.three_star_count },
      { stars: 2, count: reviewStats.two_star_count },
      { stars: 1, count: reviewStats.one_star_count }
    ]

    return (
      <div className="space-y-2">
        {ratings.map(({ stars, count }) => {
          const percentage = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={stars} className="flex items-center space-x-2 text-sm">
              <span className="w-8">{stars}</span>
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-gray-600">{count}</span>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Customer Reviews</span>
            </span>
            {user ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDialogOpen(true)}
                >
                  Write Review
                </Button>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Write a Review</DialogTitle>
                    <DialogDescription>
                      Share your experience with this product. Your review will help other customers make better purchasing decisions.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    {/* Rating */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Rating *</label>
                      {renderStars(rating, true, setRating)}
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Review Title (Optional)</label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Summarize your review"
                        maxLength={100}
                      />
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Your Review *</label>
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience with this product"
                        rows={4}
                        maxLength={1000}
                        required
                      />
                    </div>

                    {/* Images */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Photos (Optional)</label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => setReviewImages(Array.from(e.target.files))}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                        />
                        {reviewImages.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {reviewImages.map((file, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded border"
                                />
                                <button
                                  type="button"
                                  onClick={() => setReviewImages(prev => prev.filter((_, i) => i !== index))}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting || uploadingImages}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                      </Button>
                    </div>
                  </form>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => toast.error('Please sign in to write a review')}
              >
                Write Review
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviewStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-600 mb-2">
                  {reviewStats.average_rating || '0.0'}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(reviewStats.average_rating || 0))}
                </div>
                <p className="text-gray-600">
                  Based on {reviewStats.total_reviews} review{reviewStats.total_reviews !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Rating Distribution */}
              <div>
                <h4 className="font-medium mb-3">Rating Distribution</h4>
                {renderRatingDistribution()}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Reviews */}
      {reviews.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Reviews ({reviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-amber-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {review.user_name || 'Anonymous User'}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {review.title && (
                        <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                      )}
                      
                      <p className="text-gray-700 mb-3">{review.comment}</p>
                      
                      {review.image_urls && review.image_urls.length > 0 && (
                        <div className="flex space-x-2 overflow-x-auto">
                          {review.image_urls.map((imageUrl, index) => (
                            <div key={index} className="flex-shrink-0">
                              <Image
                                src={imageUrl}
                                alt={`Review image ${index + 1}`}
                                width={80}
                                height={80}
                                className="object-cover rounded border"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}