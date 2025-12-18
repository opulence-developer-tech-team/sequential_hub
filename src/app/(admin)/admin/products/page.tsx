"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus } from "lucide-react";
import { Product, IProductVariant } from "@/types";
import { ClothingCategory, ProductSize } from "@/types/enum";
import ProductFilters from "@/components/admin/products/ProductFilters";
import ProductsTable from "@/components/admin/products/ProductsTable";
import EmptyState from "@/components/admin/products/EmptyState";
import AddProductModal from "@/components/admin/products/AddProductModal";
import EditProductModal from "@/components/admin/products/EditProductModal";
import ViewProductModal from "@/components/admin/products/ViewProductModal";
import DeleteProductModal from "@/components/admin/products/DeleteProductModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorState from "@/components/ui/ErrorState";
import { useDispatch, useSelector } from "react-redux";
import { useHttp } from "@/hooks/useHttp";
import { RootState } from "@/store/redux";
import { adminActions } from "@/store/redux/adminSlice";
import type { Product as ReduxProduct } from "@/store/redux/adminSlice";
import { toast } from "sonner";
import { getProductDisplayData } from "@/lib/product-display";

export default function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [productToView, setProductToView] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    material: "",
    productOwner: "self",
    sizes: [] as string[],
    colors: [] as string[],
    quantity: 0,
    inStock: true,
    featured: false,
    rating: 0,
    reviewCount: 0,
    images: ["https://via.placeholder.com/400x400?text=New+Product"],
  });

  // Edit product form state
  const [editProduct, setEditProduct] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    material: "",
    productOwner: "self",
    sizes: [] as string[],
    colors: [] as string[],
    quantity: 0,
    inStock: true,
    featured: false,
    rating: 0,
    reviewCount: 0,
    images: ["https://via.placeholder.com/400x400?text=Product"],
    slug: "",
    createdAt: "",
    adminId: "",
    productId: "", // MongoDB ObjectId as string
    productVariant: [] as any[], // Store actual variants
  });

  const [mounted, setMounted] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const dispatch = useDispatch();
  const {
    isLoading,
    error,
    sendHttpRequest: fetchAdminUsersInfoReq,
  } = useHttp();
  const productInfo = useSelector(
    (state: RootState) => state.admin.productData
  );
  const { hasFetchedProducts, products } = productInfo;

  // Map Redux Product type to Product type expected by components
  // The Product interface now matches the backend structure with productVariant array
  const mapReduxProductToProduct = (reduxProduct: ReduxProduct): Product => {
    // Map productVariant to include _id field, cast size to ProductSize,
    // and preserve measurements from the backend/Redux
    const productVariant: IProductVariant[] = Array.isArray(reduxProduct.productVariant)
      ? reduxProduct.productVariant.map((variant, index): IProductVariant => {
          // Handle both new imageUrls array and old imageUrl field for backward compatibility
          const variantAny = variant as any
          const imageUrls = Array.isArray(variantAny.imageUrls) && variantAny.imageUrls.length > 0
            ? variantAny.imageUrls.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
            : (variantAny.imageUrl && typeof variantAny.imageUrl === 'string' && variantAny.imageUrl.trim().length > 0 ? [variantAny.imageUrl] : [])
          
          return {
          _id: variantAny._id || `variant-${index}`, // Add _id if missing
          imageUrls: imageUrls,
          color: variant.color,
          size: variant.size as ProductSize, // Cast string to ProductSize
          quantity: variant.quantity,
          reservedQuantity:
            typeof variantAny.reservedQuantity === 'number' && !Number.isNaN(variantAny.reservedQuantity) && variantAny.reservedQuantity >= 0
              ? variantAny.reservedQuantity
              : 0,
          price: variant.price,
          discountPrice: variant.discountPrice,
          inStock: variant.inStock,
          measurements: (variant as any).measurements || undefined,
          }
        })
      : [];

    return {
      _id: reduxProduct._id || '',
      adminId: reduxProduct.adminId || '',
      name: reduxProduct.name,
      description: reduxProduct.description,
      slug: reduxProduct.slug,
      category: reduxProduct.category as ClothingCategory, // Cast string to ClothingCategory
      material: reduxProduct.material ?? '',
      productOwner: reduxProduct.productOwner ?? 'self',
      productVariant,
      isFeatured: reduxProduct.isFeatured,
      createdAt: reduxProduct.createdAt ? new Date(reduxProduct.createdAt) : undefined,
    };
  };

  // Fetch products with pagination and filters
  const fetchProducts = useCallback(
    (page: number = 1, showTableLoading: boolean = false) => {
      // Validate page number
      const validPage = Math.max(1, Math.floor(page));
      
      // Use isTableLoading for filter/search/pagination changes, isInitialLoading for first load
      if (showTableLoading) {
        setIsTableLoading(true);
      } else if (!hasFetchedProducts) {
        setIsInitialLoading(true);
      }

      const onFetchAdminDetailsReq = (res: any) => {
        try {
          const responseData = res?.data?.data;
          const products = Array.isArray(responseData?.products) ? responseData.products : [];
          const paginationData = responseData?.pagination;

          dispatch(adminActions.setProducts(products));

          if (paginationData && typeof paginationData === 'object') {
            setPagination({
              page: paginationData.page || validPage,
              limit: paginationData.limit || 10,
              total: paginationData.total || 0,
              totalPages: paginationData.totalPages || 0,
              hasNextPage: paginationData.hasNextPage || false,
              hasPrevPage: paginationData.hasPrevPage || false,
            });
          }
        } catch (error) {
          console.error('Error processing fetch products response:', error);
          dispatch(adminActions.setProducts([]));
        } finally {
          // Only reset table loading, page loading is handled by mount effect
          setIsTableLoading(false);
        }
      };

      // Build query string with filters
      const queryParams = new URLSearchParams({
        page: validPage.toString(),
        limit: '10',
      });

      if (searchTerm && searchTerm.trim()) {
        queryParams.append('searchTerm', searchTerm.trim());
      }

      if (selectedCategory && selectedCategory.trim()) {
        queryParams.append('category', selectedCategory);
      }

      if (showFeaturedOnly) {
        queryParams.append('featured', 'true');
      }

      fetchAdminUsersInfoReq({
        successRes: onFetchAdminDetailsReq,
        requestConfig: {
          url: `/admin/fetch-products?${queryParams.toString()}`,
          method: "GET",
        },
      });
    },
    [dispatch, fetchAdminUsersInfoReq, searchTerm, selectedCategory, showFeaturedOnly, hasFetchedProducts]
  );

  // Reset loading states when request completes (handles both success and error)
  useEffect(() => {
    if (!isLoading) {
      // Reset loading states when request completes
      setIsInitialLoading(false);
      setIsTableLoading(false);
    }
  }, [isLoading]);

  // Initial fetch on mount
  useEffect(() => {
    setMounted(true);
    if (!hasFetchedProducts) {
      fetchProducts(1, false);
    }
  }, [fetchProducts, hasFetchedProducts]);

  // Track previous filter values to detect changes
  const prevFiltersRef = useRef({ searchTerm, selectedCategory, showFeaturedOnly });

  // Fetch products when page changes (including page 1)
  useEffect(() => {
    if (mounted && hasFetchedProducts) {
      // Only fetch if page actually changed (not just initial render)
      const isPageChange = currentPage !== pagination.page;
      if (isPageChange) {
        // Validate page is within bounds if we have pagination data
        if (pagination.totalPages > 0) {
          const validPage = Math.min(Math.max(1, currentPage), pagination.totalPages);
          if (validPage !== currentPage) {
            // If invalid page, reset to valid page (this will trigger another effect)
            setCurrentPage(validPage);
            return;
          }
        }
        // Fetch with table loading for pagination
        fetchProducts(currentPage, true);
      }
    }
  }, [currentPage, mounted, hasFetchedProducts, fetchProducts, pagination.page, pagination.totalPages]);

  // Fetch products when filters change (reset to page 1)
  useEffect(() => {
    if (mounted && hasFetchedProducts) {
      const filtersChanged =
        prevFiltersRef.current.searchTerm !== searchTerm ||
        prevFiltersRef.current.selectedCategory !== selectedCategory ||
        prevFiltersRef.current.showFeaturedOnly !== showFeaturedOnly;

      if (filtersChanged) {
        // Update ref before state change to prevent infinite loops
        prevFiltersRef.current = { searchTerm, selectedCategory, showFeaturedOnly };

        // Reset to page 1 when filters change
        if (currentPage !== 1) {
          setCurrentPage(1);
        } else {
          // If already on page 1, fetch immediately with table loading state
          fetchProducts(1, true);
        }
      }
    }
  }, [searchTerm, selectedCategory, showFeaturedOnly, mounted, hasFetchedProducts, currentPage, fetchProducts]);

  // Use products from Redux state, fallback to empty array if not loaded
  const reduxProducts = products || [];

  // Reset deleting state when request completes (handles error cases)
  // Success case is handled in confirmDelete successRes callback
  useEffect(() => {
    if (!isLoading && deletingProductId) {
      // Check if product still exists - if it does, the delete failed
      const productStillExists = reduxProducts.some(
        (p) => p.slug === deletingProductId
      );
      
      // If product still exists after request completes, delete failed
      // Reset the loading state so user can try again (modal stays open)
      if (productStillExists) {
        const timer = setTimeout(() => {
          setDeletingProductId(null);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, deletingProductId, reduxProducts]);

  // Only show page loading for initial fetch, not for delete operations
  if (isInitialLoading || !mounted) {
    return <LoadingSpinner fullScreen text="Loading products..." />;
  }

  if (error && isInitialLoading) {
    const handleRetry = () => {
      if (hasFetchedProducts) return;

      setIsInitialLoading(true);
      // Error will be cleared automatically by useHttp when new request starts

      fetchProducts(1);
    };

    return (
      <ErrorState
        title="Failed to load products"
        message={error || "We couldn't load your products. Please try again."}
        onRetry={handleRetry}
        retryLabel="Retry"
        fullScreen
      />
    );
  }
  
  // Map Redux products to Product type expected by components
  const productsList: Product[] = reduxProducts.map(mapReduxProductToProduct);

  // Note: Filtering is now done on the server side with pagination
  // No need for client-side filtering as server handles it
  const filteredProducts = productsList;

  // Categories are now coming from resources.ts, no need to derive from products

  const handleEditProduct = (product: Product) => {
    // Find the original Redux product to get all fields
    const originalReduxProduct = reduxProducts.find(
      (p) => p.slug === product.slug
    );
    
    // Get actual variants from the product
    const variants = product.productVariant || []
    const displayData = getProductDisplayData(product)
    
    setProductToEdit(product);
    setEditProduct({
      name: product.name,
      description: product.description,
      price: "", // Will be set per variant
      originalPrice: "", // Will be set per variant
      category: product.category,
      material: product.material || "",
      productOwner: product.productOwner || "self",
      sizes: displayData.sizes.map(s => s.toString()),
      colors: displayData.colors,
      quantity: 0, // Will be set per variant
      inStock: displayData.inStock,
      featured: product.isFeatured,
      rating: 0,
      reviewCount: 0,
      images: displayData.images,
      slug: product.slug,
      createdAt: product.createdAt?.toISOString() || "",
      adminId: product.adminId || "",
      productId: product._id || "", // MongoDB ObjectId
      productVariant: variants, // Pass actual variants
    });
    setShowEditModal(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleViewProduct = (product: Product) => {
    // Product already has all the fields we need from the new structure
    setProductToView(product);
    setShowViewModal(true);
  };

  const confirmDelete = () => {
    if (!productToDelete) return;

    // Product already has _id and slug from the new structure
    if (!productToDelete._id) {
      toast.error("Product ID not found. Cannot delete product.");
      return;
    }

    const productId = productToDelete._id;
    const productSlug = productToDelete.slug;

    // Set deleting state (keep modal open to show loading)
    setDeletingProductId(productSlug);

    // Make DELETE request with productId as query parameter
    fetchAdminUsersInfoReq({
      successRes: () => {
        // Update Redux state after successful deletion using removeProduct action
        dispatch(adminActions.removeProduct(productSlug));
        setProductToDelete(null);
        setDeletingProductId(null);
        setShowDeleteModal(false); // Close modal after successful deletion
      },
      requestConfig: {
        url: `/admin/delete-product?productId=${productId}`,
        method: "DELETE",
        successMessage: "Product deleted successfully",
      },
    });
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
    setDeletingProductId(null); // Reset deleting state if user cancels
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setProductToView(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setProductToEdit(null);
    setEditProduct({
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      category: "",
      material: "",
      productOwner: "self",
      sizes: [],
      colors: [],
      quantity: 0,
      inStock: true,
      featured: false,
      rating: 0,
      reviewCount: 0,
      images: ["https://via.placeholder.com/400x400?text=Product"],
      slug: "",
      createdAt: "",
      adminId: "",
      productId: "",
      productVariant: [],
    });
  };

  const handleSaveEdit = () => {
    // EditProductModal handles the API call and Redux update
    // This function is kept for compatibility but the actual save happens in EditProductModal
    closeEditModal();
  };

  const handleEditInputChange = (field: string, value: any) => {
    setEditProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddProduct = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewProduct({
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      category: "",
      material: "",
      productOwner: "self",
      sizes: [],
      colors: [],
      quantity: 0,
      inStock: true,
      featured: false,
      rating: 0,
      reviewCount: 0,
      images: ["https://via.placeholder.com/400x400?text=New+Product"],
    });
  };

  const handleSaveProduct = () => {
    // This is called after successful API request from AddProductModal
    // Just close the modal and refresh the product list
    handleCloseModal();
    // TODO: Refresh product list from API if needed
  };

  const handleInputChange = (field: string, value: any) => {
    setNewProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full mx-auto min-w-0">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Products
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your product inventory and listings.
            </p>
          </div>
          <button
            onClick={handleAddProduct}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center sm:justify-start"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <ProductFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        showFeaturedOnly={showFeaturedOnly}
        onFeaturedChange={setShowFeaturedOnly}
        resultsCount={filteredProducts.length}
      />

      {/* Products Table */}
      {isTableLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-12">
          <LoadingSpinner text="Loading products..." />
        </div>
      ) : filteredProducts.length > 0 ? (
        <ProductsTable
          products={filteredProducts}
          onView={handleViewProduct}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          deletingProductId={deletingProductId}
          pagination={pagination}
          onPageChange={setCurrentPage}
          currentPage={currentPage}
        />
      ) : (
        <EmptyState />
      )}

      {/* Modals */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onSave={handleSaveProduct}
        product={newProduct}
        onInputChange={handleInputChange}
      />

      <EditProductModal
        isOpen={showEditModal}
        onClose={closeEditModal}
        onSave={handleSaveEdit}
        product={editProduct}
        onInputChange={handleEditInputChange}
      />

      <ViewProductModal
        isOpen={showViewModal}
        onClose={closeViewModal}
        onEdit={handleEditProduct}
        product={productToView}
      />

      <DeleteProductModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        product={productToDelete}
        isDeleting={isLoading && !!deletingProductId}
      />
    </div>
  );
}
