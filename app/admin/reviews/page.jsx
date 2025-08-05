'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { 
  Star, 
  MessageSquare, 
  Check, 
  X, 
  Eye, 
  User, 
  Calendar,
  Package,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { supabase, safeQuery } from '@/lib/supabase'
import { toast } from 'sonner'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedReview, setSelectedReview] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      console.log('Admin: Fetching all reviews...')
      
      // Use the admin function to bypass RLS issues
      let { data, error } = await safeQuery(async () => 
        supabase.rpc('get_all_reviews_admin')
      )
        console.warn('Admin function failed, trying direct query:', error)
        
        // Fallback to direct query
        const { data: fallbackData, error: fallbackError } = await safeQuery(async () => 
          supabase
            .from('reviews')
            .select(`
              *,
              profiles!reviews_user_id_fkey (
                full_name,
                email
              ),
              products (
                name,
                image_url,
                image_urls
              )
            `)
            .order('created_at', { ascending: false })
        )
        
        if (fallbackError) {
          throw fallbackError
        }
        
        // Transform fallback data to match expected format
        data = fallbackData.map(review => ({
          ...review,
          user_name: review.profiles?.full_name || 'Anonymous User',
          user_email: review.profiles?.email || null,
          product_name: review.products?.name || 'Unknown Product',
          product_image: review.products?.image_urls?.[0] || review.products?.image_url || '/placeholder.jpg'
        }))
      if (error) throw error
      
      console.log('Admin: Reviews fetched successfully:', data?.length || 0)
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveReview = async (reviewId) => {
    setActionLoading(true)
    try {
      console.log('Approving review:', reviewId)
      
      const { error } = await safeQuery(async () => 
        supabase
          .from('reviews')
          .update({ 
            is_approved: true,
            approved_at: new Date().toISOString(),
            approved_by: user?.id
          })
          .eq('id', reviewId)
      )

      if (error) throw error

      console.log('Review approved successfully')
      toast.success('Review approved successfully')
      fetchReviews()
    } catch (error) {
      console.error('Error approving review:', error)
      toast.error('Failed to approve review')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectReview = async (reviewId) => {
    setActionLoading(true)
    try {
      console.log('Rejecting review:', reviewId)
      
      const { error } = await safeQuery(async () => 
        supabase
          .from('reviews')
          .update({ 
            is_approved: false,
            approved_at: null,
            approved_by: null
          })
          .eq('id', reviewId)
      )

      if (error) throw error

      console.log('Review rejected successfully')
      toast.success('Review rejected successfully')
      fetchReviews()
    } catch (error) {
      console.error('Error rejecting review:', error)
      toast.error('Failed to reject review')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return
    }

    setActionLoading(true)
    try {
      console.log('Deleting review:', reviewId)
      
      const { error } = await safeQuery(async () => 
        supabase
          .from('reviews')
          .delete()
          .eq('id', reviewId)
      )

      if (error) throw error

      console.log('Review deleted successfully')
      toast.success('Review deleted successfully')
      fetchReviews()
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.error('Failed to delete review')
    } finally {
      setActionLoading(false)
    }
  }

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const getStatusBadge = (isApproved) => {
    if (isApproved === true) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      )
    } else if (isApproved === false) {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <X className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    }
  }

  const filterReviews = (status) => {
    switch (status) {
      case 'pending':
        return reviews.filter(review => review.is_approved === false || review.is_approved === null)
      case 'approved':
        return reviews.filter(review => review.is_approved === true)
      case 'all':
        return reviews
      default:
        return reviews
    }
  }

  const ReviewCard = ({ review }) => (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            {/* Product Image */}
            <div className="flex-shrink-0">
              <Image
                src={review.products?.image_urls?.[0] || review.products?.image_url || '/placeholder.jpg'}
                alt={review.products?.name || 'Product'}
                width={60}
                height={60}
                className="object-cover rounded border"
                onError={(e) => {
                  e.target.src = '/placeholder.jpg'
                }}
              />
            </div>
            
            {/* Review Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-medium text-gray-900">
                  {review.products?.name || 'Unknown Product'}
                </h3>
                {getStatusBadge(review.is_approved)}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{review.profiles?.full_name || 'Anonymous'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mb-3">
                {renderStars(review.rating)}
                <span className="text-sm text-gray-600">({review.rating}/5)</span>
              </div>
              
              {review.title && (
                <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
              )}
              
              <p className="text-gray-700 mb-3 line-clamp-3">{review.comment}</p>
              
              {review.image_urls && review.image_urls.length > 0 && (
                <div className="flex space-x-2 mb-3">
                  {review.image_urls.slice(0, 3).map((imageUrl, index) => (
                    <Image
                      key={index}
                      src={imageUrl}
                      alt={`Review image ${index + 1}`}
                      width={50}
                      height={50}
                      className="object-cover rounded border"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  ))}
                  {review.image_urls.length > 3 && (
                    <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-600">
                      +{review.image_urls.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col space-y-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setSelectedReview(review)}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Review Details</DialogTitle>
                  <DialogDescription>
                    Detailed information about the customer review.
                  </DialogDescription>
                </DialogHeader>
                {selectedReview && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Product</label>
                        <p className="font-medium">{selectedReview.products?.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Customer</label>
                        <p className="font-medium">{selectedReview.profiles?.full_name || 'Anonymous User'}</p>
                        <p className="text-sm text-gray-600">{selectedReview.profiles?.email || 'No email'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Rating</label>
                        <div className="flex items-center space-x-2">
                          {renderStars(selectedReview.rating)}
                          <span>({selectedReview.rating}/5)</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Date</label>
                        <p>{new Date(selectedReview.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {selectedReview.title && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Title</label>
                        <p className="font-medium">{selectedReview.title}</p>
                      </div>
                    )}
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Review</label>
                      <p className="mt-1">{selectedReview.comment}</p>
                    </div>
                    
                    {selectedReview.image_urls && selectedReview.image_urls.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Images</label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {selectedReview.image_urls.map((imageUrl, index) => (
                            <Image
                              key={index}
                              src={imageUrl}
                              alt={`Review image ${index + 1}`}
                              width={150}
                              height={150}
                              className="object-cover rounded border"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
            
            {(review.is_approved === false || review.is_approved === null) && (
              <Button
                size="sm"
                onClick={() => handleApproveReview(review.id)}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
            )}
            
            {review.is_approved === true && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRejectReview(review.id)}
                disabled={actionLoading}
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
            )}
            
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDeleteReview(review.id)}
              disabled={actionLoading}
            >
              <X className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reviews Management</h1>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const pendingReviews = filterReviews('pending')
  const approvedReviews = filterReviews('approved')
  const allReviews = filterReviews('all')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reviews Management</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MessageSquare className="h-4 w-4" />
            <span>{allReviews.length} Total Reviews</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{pendingReviews.length}</p>
                <p className="text-sm text-gray-600">Pending Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{approvedReviews.length}</p>
                <p className="text-sm text-gray-600">Approved Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{allReviews.length}</p>
                <p className="text-sm text-gray-600">Total Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Pending ({pendingReviews.length})</span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Approved ({approvedReviews.length})</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>All ({allReviews.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingReviews.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Reviews</h3>
                <p className="text-gray-600">All reviews have been processed.</p>
              </CardContent>
            </Card>
          ) : (
            pendingReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedReviews.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Approved Reviews</h3>
                <p className="text-gray-600">No reviews have been approved yet.</p>
              </CardContent>
            </Card>
          ) : (
            approvedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {allReviews.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews</h3>
                <p className="text-gray-600">No reviews have been submitted yet.</p>
              </CardContent>
            </Card>
          ) : (
            allReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}