"use client";

import React, { useEffect, useState } from "react";
import {
  MessageSquare,
  RefreshCcw,
  Search,
  MoreHorizontal,
  X,
  AlertTriangle,
  Loader2,
  Eye,
  Edit,
  Trash2,
  Plus,
  ToggleLeft,
  ToggleRight,
  Star,
  Image as ImageIcon,
  CheckCircle,
  Quote,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import useAdminTestimonials, { Testimonial } from "@/hooks/admin/useAdminTestimonials";

export default function AdminTestimonialsPage() {
  const {
    fetchTestimonials,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    toggleTestimonialStatus,
    testimonials,
    loading,
    error,
    uploadProgress,
    clearError,
  } = useAdminTestimonials();

  // State variables
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filteredTestimonials, setFilteredTestimonials] = useState<Testimonial[]>([]);
  const [processingAction, setProcessingAction] = useState(false);

  // Dialogs state
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    quote: "",
    name: "",
    designation: "",
    isActive: true,
    order: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Load testimonials when component mounts
  useEffect(() => {
    loadTestimonials();
  }, []);

  // Filter testimonials based on search and status
  useEffect(() => {
    if (!testimonials) return;

    let filtered = [...testimonials];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((testimonial) =>
        statusFilter === "active" ? testimonial.isActive : !testimonial.isActive
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (testimonial) =>
          testimonial.name.toLowerCase().includes(query) ||
          testimonial.designation.toLowerCase().includes(query) ||
          testimonial.quote.toLowerCase().includes(query)
      );
    }

    setFilteredTestimonials(filtered);
  }, [testimonials, statusFilter, searchQuery]);

  const loadTestimonials = async () => {
    try {
      await fetchTestimonials();
    } catch (err) {
      console.error("Error loading testimonials:", err);
      toast.error("Failed to load testimonials");
    }
  };

  const handleRefresh = () => {
    clearError();
    loadTestimonials();
  };

  const handleToggleStatus = async (testimonial: Testimonial) => {
    try {
      setProcessingAction(true);
      await toggleTestimonialStatus(testimonial.id, !testimonial.isActive);
      toast.success(
        `Testimonial ${!testimonial.isActive ? "activated" : "deactivated"} successfully`
      );
    } catch (err) {
      console.error("Error toggling testimonial status:", err);
      toast.error("Failed to update testimonial status");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTestimonial) return;

    try {
      setProcessingAction(true);
      await deleteTestimonial(selectedTestimonial.id);
      toast.success("Testimonial deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedTestimonial(null);
    } catch (err) {
      console.error("Error deleting testimonial:", err);
      toast.error("Failed to delete testimonial");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only images (JPEG, PNG, WebP) are allowed");
        return;
      }

      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleOpenEditDialog = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setFormData({
      quote: testimonial.quote,
      name: testimonial.name,
      designation: testimonial.designation,
      isActive: testimonial.isActive,
      order: testimonial.order,
    });
    setSelectedImage(null);
    setImagePreview(testimonial.src); // Show existing image
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const handleOpenCreateDialog = () => {
    setFormData({
      quote: "",
      name: "",
      designation: "",
      isActive: true,
      order: testimonials.length,
    });
    setSelectedImage(null);
    setImagePreview("");
    setFormErrors({});
    setCreateDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.quote.trim()) errors.quote = "Quote is required";
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.designation.trim()) errors.designation = "Designation is required";
    
    // Only require image for create, not edit
    if (createDialogOpen && !selectedImage) {
      errors.image = "Customer image is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitCreate = async () => {
    if (!validateForm() || !selectedImage) return;

    try {
      setProcessingAction(true);
      await createTestimonial(formData, selectedImage);
      toast.success("Testimonial created successfully");
      setCreateDialogOpen(false);
      setSelectedImage(null);
      setImagePreview("");
    } catch (err) {
      console.error("Error creating testimonial:", err);
      toast.error("Failed to create testimonial");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedTestimonial || !validateForm()) return;

    try {
      setProcessingAction(true);
      await updateTestimonial(selectedTestimonial.id, formData, selectedImage || undefined);
      toast.success("Testimonial updated successfully");
      setEditDialogOpen(false);
      setSelectedTestimonial(null);
      setSelectedImage(null);
      setImagePreview("");
    } catch (err) {
      console.error("Error updating testimonial:", err);
      toast.error("Failed to update testimonial");
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
        <X className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  // Loading state
  if (loading && testimonials.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Testimonials</h1>
            <p className="text-white/70 mt-1">Manage customer testimonials</p>
          </div>
        </div>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[#70b340]" />
            <p className="text-lg font-medium text-white">Loading Testimonials</p>
            <p className="text-sm text-white/70 mt-1">
              Please wait while we fetch the testimonials...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Testimonials</h1>
          <p className="text-white/70 mt-1">Manage customer testimonials</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
            className="border-white/20 text-white bg-transparent hover:bg-white/10"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={handleOpenCreateDialog}
            className="bg-[#70b340] hover:bg-[#5a9235] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Testimonial
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors p-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Total Testimonials</p>
                <p className="text-3xl font-bold text-white mt-1">{testimonials.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors p-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Active</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {testimonials.filter((t) => t.isActive).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors p-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Inactive</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {testimonials.filter((t) => !t.isActive).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-gray-500/20 rounded-xl flex items-center justify-center">
                <X className="h-6 w-6 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and search */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-0">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2951] border-white/20 text-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {(statusFilter !== "all" || searchQuery) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setStatusFilter("all");
                    setSearchQuery("");
                  }}
                  className="text-white hover:bg-white/10"
                  title="Clear filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                placeholder="Search by name, designation, or quote..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/20 p-0">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <h3 className="font-medium text-white">Error loading testimonials</h3>
                <p className="text-sm text-white/70">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && filteredTestimonials.length === 0 && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 border-dashed p-0">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-white/50" />
            <p className="text-lg font-medium text-white">No testimonials found</p>
            <p className="text-sm text-white/70 mt-1">
              {searchQuery || statusFilter !== "all"
                ? "Try changing your search or filter criteria"
                : "Get started by adding your first testimonial"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button
                onClick={handleOpenCreateDialog}
                className="mt-4 bg-[#70b340] hover:bg-[#5a9235]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Testimonial
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Testimonials Grid */}
      {filteredTestimonials.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTestimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all p-0"
            >
              <CardContent className="p-6 space-y-4">
                {/* Header with avatar and status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-white/20">
                      <AvatarImage src={testimonial.src} alt={testimonial.name} className="object-cover"/>
                      <AvatarFallback className="bg-[#70b340] text-white">
                        {testimonial.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-semibold">{testimonial.name}</p>
                      <p className="text-white/70 text-sm">{testimonial.designation}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-white/10"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-[#1a2951] border-white/20 text-white"
                    >
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedTestimonial(testimonial);
                          setPreviewDialogOpen(true);
                        }}
                        className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenEditDialog(testimonial)}
                        className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(testimonial)}
                        className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                      >
                        {testimonial.isActive ? (
                          <>
                            <ToggleLeft className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <ToggleRight className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedTestimonial(testimonial);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Quote */}
                <div className="relative">
                  <Quote className="absolute -top-2 -left-2 h-8 w-8 text-[#70b340]/20" />
                  <p className="text-white/90 text-sm line-clamp-4 pl-6">
                    {testimonial.quote}
                  </p>
                </div>

                {/* Footer with status and order */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  {getStatusBadge(testimonial.isActive)}
                  <Badge variant="outline" className="text-white/70">
                    Order: {testimonial.order}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1a2951] border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to delete this testimonial? This action cannot be undone and the image will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={processingAction}
            >
              {processingAction ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setSelectedTestimonial(null);
            setSelectedImage(null);
            setImagePreview("");
            setFormErrors({});
          }
        }}
      >
        <DialogContent className="bg-[#1a2951] border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editDialogOpen ? "Edit Testimonial" : "Create Testimonial"}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {editDialogOpen
                ? "Update the testimonial details"
                : "Add a new customer testimonial"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-white/90">Customer Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className={`bg-white/5 border-white/20 text-white placeholder:text-white/50 ${
                  formErrors.name ? "border-red-500" : ""
                }`}
              />
              {formErrors.name && (
                <p className="text-red-400 text-sm">{formErrors.name}</p>
              )}
            </div>

            {/* Designation */}
            <div className="space-y-2">
              <Label className="text-white/90">Designation *</Label>
              <Input
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="CEO, Company Name"
                className={`bg-white/5 border-white/20 text-white placeholder:text-white/50 ${
                  formErrors.designation ? "border-red-500" : ""
                }`}
              />
              {formErrors.designation && (
                <p className="text-red-400 text-sm">{formErrors.designation}</p>
              )}
            </div>

            {/* Quote */}
            <div className="space-y-2">
              <Label className="text-white/90">Testimonial Quote *</Label>
              <Textarea
                value={formData.quote}
                onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                placeholder="Write the customer's testimonial here..."
                rows={4}
                className={`bg-white/5 border-white/20 text-white placeholder:text-white/50 ${
                  formErrors.quote ? "border-red-500" : ""
                }`}
              />
              {formErrors.quote && (
                <p className="text-red-400 text-sm">{formErrors.quote}</p>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-white/90 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Customer Image {createDialogOpen && "*"}
              </Label>
              
              {imagePreview ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <Avatar className="h-20 w-20 border-2 border-white/20">
                      <AvatarImage src={imagePreview} alt="Preview" className="object-cover"/>
                      <AvatarFallback className="bg-[#70b340] text-white text-xl">
                        {formData.name ? formData.name.charAt(0) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {formData.name || "Customer Name"}
                      </p>
                      <p className="text-white/70 text-sm">
                        {formData.designation || "Designation"}
                      </p>
                      {selectedImage && (
                        <p className="text-white/50 text-xs mt-1">
                          {(selectedImage.size / 1024).toFixed(2)} KB
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview("");
                      }}
                      className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors">
                  <input
                    type="file"
                    id="image-upload"
                    className="hidden"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    onChange={handleImageSelect}
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-white/50" />
                    <p className="text-white font-medium mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-white/50 text-sm">JPG, PNG or WebP (max 5MB)</p>
                  </label>
                </div>
              )}
              
              {formErrors.image && (
                <p className="text-red-400 text-sm">{formErrors.image}</p>
              )}
              <p className="text-xs text-white/50">
                {editDialogOpen 
                  ? "Upload a new image to replace the current one, or leave empty to keep existing"
                  : "Upload a high-quality image of the customer"}
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Status and Order */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label className="text-white/90">Active Status</Label>
                <Button
                  type="button"
                  variant={formData.isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={
                    formData.isActive
                      ? "bg-[#70b340] hover:bg-[#5a9235]"
                      : "border-white/20 text-white hover:bg-white/10 bg-transparent"
                  }
                >
                  {formData.isActive ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Active
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Inactive
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-white/90">Display Order</Label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                  }
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
            </div>

            {/* Upload Progress */}
            {loading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Uploading image...</span>
                  <span className="text-white font-medium">{uploadProgress.toFixed(0)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setEditDialogOpen(false);
                setSelectedTestimonial(null);
                setSelectedImage(null);
                setImagePreview("");
                setFormErrors({});
              }}
              disabled={loading}
              className="border-white/20 text-white bg-transparent hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={editDialogOpen ? handleSubmitEdit : handleSubmitCreate}
              disabled={loading || processingAction}
              className="bg-[#70b340] hover:bg-[#5a9235]"
            >
              {loading || processingAction ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadProgress > 0 ? "Uploading..." : editDialogOpen ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {editDialogOpen ? "Update" : "Create"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="bg-[#1a2951] border-white/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Testimonial Preview</DialogTitle>
          </DialogHeader>

          {selectedTestimonial && (
            <div className="space-y-6">
              {/* Preview Card */}
              <Card className="bg-white/5 border-white/10 p-0">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-white/20">
                      <AvatarImage
                        src={selectedTestimonial.src}
                        alt={selectedTestimonial.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-[#70b340] text-white text-xl">
                        {selectedTestimonial.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-semibold text-lg">
                        {selectedTestimonial.name}
                      </p>
                      <p className="text-white/70">{selectedTestimonial.designation}</p>
                    </div>
                  </div>

                  <Separator className="bg-white/10" />

                  <div className="relative">
                    <Quote className="absolute -top-2 -left-2 h-10 w-10 text-[#70b340]/20" />
                    <p className="text-white/90 pl-8 leading-relaxed">
                      {selectedTestimonial.quote}
                    </p>
                  </div>

                </CardContent>
              </Card>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/50">Status</p>
                  {getStatusBadge(selectedTestimonial.isActive)}
                </div>
                <div>
                  <p className="text-white/50">Display Order</p>
                  <p className="text-white">{selectedTestimonial.order}</p>
                </div>
                <div>
                  <p className="text-white/50">Created</p>
                  <p className="text-white">
                    {new Date(selectedTestimonial.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-white/50">Last Updated</p>
                  <p className="text-white">
                    {new Date(selectedTestimonial.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}