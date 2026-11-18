const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  restoreProduct,
  permanentDeleteProduct,
  exportProductsExcel,
  importProductsExcel,
  exportRecipeTemplate,
  importRecipesExcel,
  generateProductAiImage,
  uploadProductImageManual,
  bulkGenerateAiImages,
  deleteProductImage,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

// AI bulk image generation — must be before /:id
router.post('/bulk-ai-images', authorize('admin', 'manager'), bulkGenerateAiImages);

// Excel import/export — must be before /:id
router.get('/export/excel',           authorize('admin', 'manager'), exportProductsExcel);
router.post('/import/excel',          authorize('admin', 'manager'), upload.single('file'), importProductsExcel);
router.get('/export/recipe-template', authorize('admin', 'manager'), exportRecipeTemplate);
router.post('/import/recipes',        authorize('admin', 'manager'), upload.single('file'), importRecipesExcel);

// Bulk + restore — must be before /:id
router.delete('/bulk',          authorize('admin', 'manager'), bulkDeleteProducts);
router.post('/:id/restore',     authorize('admin', 'manager'), restoreProduct);
router.delete('/:id/permanent', authorize('admin'), permanentDeleteProduct);

// Product Image (Manual & AI generation)
router.post('/:id/ai-image', authorize('admin', 'manager', 'supervisor'), generateProductAiImage);
router.post('/:id/image',    authorize('admin', 'manager', 'supervisor'), upload.single('image'), uploadProductImageManual);
router.delete('/:id/image',  authorize('admin', 'manager', 'supervisor'), deleteProductImage);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authorize('admin', 'manager'), createProduct);
router.put('/:id', authorize('admin', 'manager'), updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

module.exports = router;
