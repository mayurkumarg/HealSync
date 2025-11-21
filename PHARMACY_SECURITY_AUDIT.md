# Pharmacy Pipeline Security Audit & Fixes

**Date:** November 21, 2025  
**Status:** ✅ ALL ISSUES FIXED

---

## 🚨 Critical Issues Found & Fixed

### 1. **Route Ordering Conflicts** (CRITICAL)

**Problem:**
```javascript
// BEFORE - Routes in wrong order
pharmacyRouter.get("/stock", pharmacyAuth, getAllStock);
pharmacyRouter.get("/stock/:stockId", pharmacyAuth, getStockItem);
pharmacyRouter.get("/stock/search", pharmacyAuth, searchStock);  // ❌ NEVER REACHED!
pharmacyRouter.get("/stock/nearest", pharmacyAuth, findNearest); // ❌ NEVER REACHED!
```

Express matches routes in order. `/stock/search` was being caught by `/stock/:stockId` with `stockId="search"`.

**Fix:**
```javascript
// AFTER - Specific routes BEFORE parameterized routes
pharmacyRouter.get("/stock/search", pharmacyAuth, searchStock);     // ✅ Now works!
pharmacyRouter.get("/stock/nearest", pharmacyAuth, findNearest);    // ✅ Now works!
pharmacyRouter.get("/stock/low", pharmacyAuth, lowStock);           // ✅ Now works!
pharmacyRouter.get("/stock/expiry", pharmacyAuth, expiryAlert);     // ✅ Now works!
pharmacyRouter.get("/stock", pharmacyAuth, getAllStock);
pharmacyRouter.get("/stock/:stockId", pharmacyAuth, getStockItem);  // ✅ Now last
```

---

### 2. **Duplicate Routes** (ERROR)

**Problem:**
```javascript
// Line 39
pharmacyRouter.get("/nearby", getNearbyPharmacies);

// Line 43 - DUPLICATE!
pharmacyRouter.get("/nearby", getNearbyPharmacies);
```

**Fix:** Removed duplicate.

---

### 3. **Security Vulnerability - Missing Authorization** (CRITICAL)

**Problem:**
```javascript
// ❌ CRITICAL: Anyone could update ANY pharmacy's inventory!
pharmacyRouter.put("/:id/inventory", updateInventory);
```

No `pharmacyAuth` middleware = unauthenticated users could modify any pharmacy's stock by changing the `:id` param.

**Fix:**
```javascript
// ✅ SECURED: Now protected + uses JWT identity
pharmacyRouter.put("/inventory", pharmacyAuth, updateInventory);
```

Updated controller to use `req.user.id` from JWT instead of URL param:
```javascript
// BEFORE - Insecure
const { id } = req.params;  // ❌ Attacker controls this!
const pharmacy = await Pharmacy.findById(id);

// AFTER - Secure
const pharmacyId = req.user?.id;  // ✅ From verified JWT
if (!pharmacyId) return next(new CustomError(401, "Unauthorized"));
const pharmacy = await Pharmacy.findById(pharmacyId);
```

---

### 4. **Route Parameter Mismatch**

**Problem:**
```javascript
// Route expects /:pharmacyId but controller ignores it
pharmacyRouter.patch("/:pharmacyId", pharmacyAuth, updatePharmacy);

// Controller uses JWT instead (good!) but param is confusing
const pharmacyId = req.user?.id;  // Not from params!
```

**Fix:**
```javascript
// ✅ Clear intent: no param needed, uses JWT
pharmacyRouter.patch("/profile", pharmacyAuth, updatePharmacy);
```

---

### 5. **Route Conflict with Dynamic Params**

**Problem:**
```javascript
pharmacyRouter.get("/:id", getPharmacyById);  // ❌ Catches /nearby, /filter, etc.
```

Dynamic param routes must come LAST to avoid catching specific routes.

**Fix:**
```javascript
pharmacyRouter.get("/pharmacy/:id", getPharmacyById);  // ✅ Renamed to avoid conflict
```

---

## ✅ Final Route Structure (Secure & Correct)

### PUBLIC ROUTES (No Authentication)
```javascript
POST   /api/pharmacy                          → createPharmacy
GET    /api/pharmacy/verify/:token            → verifyPharmacyEmail
POST   /api/pharmacy/login                    → loginPharmacy
POST   /api/pharmacy/forgot-password          → forgotPasswordPharmacy
GET    /api/pharmacy/reset-password/:token    → passwordResetClientPharmacy
POST   /api/pharmacy/reset-password/:token    → passwordResetServerPharmacy
GET    /api/pharmacy/nearby                   → getNearbyPharmacies (public search)
GET    /api/pharmacy/search-medicine          → searchByMedicine (public)
GET    /api/pharmacy/filter                   → filterPharmacies (public)
GET    /api/pharmacy/pharmacy/:id             → getPharmacyById (public)
```

### PROTECTED ROUTES (Pharmacy Authentication Required)
```javascript
PATCH  /api/pharmacy/profile                  → updatePharmacy (uses JWT id)
PUT    /api/pharmacy/inventory                → updateInventory (uses JWT id)

// Stock Management - Specific routes BEFORE :stockId
GET    /api/pharmacy/stock/search             → searchStock
GET    /api/pharmacy/stock/nearest            → findNearest
GET    /api/pharmacy/stock/low                → lowStock
GET    /api/pharmacy/stock/expiry             → expiryAlert
GET    /api/pharmacy/stock                    → getAllStock
POST   /api/pharmacy/stock                    → registerStock

// Parameterized routes LAST
GET    /api/pharmacy/stock/:stockId           → getStockItem
PATCH  /api/pharmacy/stock/:stockId           → updateStock
DELETE /api/pharmacy/stock/:stockId           → deleteStock
```

---

## 🔒 Security Improvements

### Authentication Middleware (`pharmacyAuth.js`)
✅ Validates JWT from `Authorization: Bearer <token>` header  
✅ Verifies pharmacy exists in database  
✅ Checks email verification status  
✅ Attaches pharmacy info to `req.user`:
```javascript
req.user = {
  id: pharmacy._id,
  email: pharmacy.email,
  role: "pharmacy",
  name: pharmacy.name
};
```

### Authorization Pattern
All protected routes now follow this pattern:
1. JWT validated by `pharmacyAuth` middleware
2. Controller uses `req.user.id` (never URL params for identity)
3. Queries filtered by `pharmacyId` to prevent data leakage

Example:
```javascript
// ✅ SECURE
const pharmacyId = req.user.id;  // From verified JWT
const stock = await PharmacyStock.find({ pharmacyId });  // Only their data
```

---

## 📊 Field Validation Status

### Stock Registration (`POST /api/pharmacy/stock`)
✅ Required fields validated: `brandName`, `genericName`, `quantity`, `price`, `expiryDate`  
✅ Duplicate prevention: checks if medicine already in pharmacy stock  
✅ Auto-creates Medicine if doesn't exist  
✅ Links PharmacyStock to Medicine via `medicineId`

### Stock Update (`PATCH /api/pharmacy/stock/:stockId`)
✅ Ownership validation: `{ _id: stockId, pharmacyId }`  
✅ Field whitelist: only `quantity`, `price`, `expiryDate`, `batchNo` allowed  
✅ Type validation: quantity ≥ 0, price > 0, expiryDate in future  
✅ Auto-status update: `available`/`low`/`out_of_stock` based on quantity  
✅ Timestamp update: `lastUpdated` set to now

---

## 🧪 Testing Checklist

### Authentication
- [x] Register new pharmacy
- [x] Verify email with token
- [x] Login returns JWT with pharmacy info
- [x] JWT contains: `{id, email, name, type: "pharmacy"}`
- [x] Frontend decodes JWT to extract name

### Authorization
- [x] Protected routes reject requests without token (401)
- [x] Protected routes reject invalid/expired tokens (401)
- [x] Protected routes reject unverified pharmacies (403)
- [x] Profile update only affects own pharmacy
- [x] Stock operations only access own inventory

### Stock Management
- [x] Add medicine creates Medicine + PharmacyStock
- [x] Duplicate medicine rejected
- [x] Update stock validates ownership
- [x] Update stock validates field types
- [x] Status auto-calculated (quantity thresholds)
- [x] Delete stock only affects own items

### Route Ordering
- [x] `/stock/search` accessible (not caught by `:stockId`)
- [x] `/stock/nearest` accessible
- [x] `/stock/low` accessible
- [x] `/stock/expiry` accessible
- [x] `/stock/:stockId` only catches actual IDs

---

## 🎯 Frontend Integration

### API Service (`frontend/src/services/apiService.js`)
All endpoints already correct:
```javascript
// Authentication
export const pharmacyRegister = (data) => api.post('/pharmacy', data);
export const pharmacyLogin = (credentials) => api.post('/pharmacy/login', credentials);

// Stock Management (all use pharmacyAuth)
export const getPharmacyStock = () => api.get('/pharmacy/stock');
export const addMedicine = (data) => api.post('/pharmacy/stock', data);
export const updateStock = (id, data) => api.patch(`/pharmacy/stock/${id}`, data);
export const deleteStock = (id) => api.delete(`/pharmacy/stock/${id}`);
```

### Login Flow (`PharmacyLogin.js`)
✅ Decodes JWT to extract pharmacy name:
```javascript
const tokenParts = token.split('.');
const payload = JSON.parse(atob(tokenParts[1]));
const pharmacy = {
  email: payload.email,
  name: payload.name,  // ✅ From JWT
  id: payload.id
};
```

### Inventory Form (`Inventory.js`)
✅ All required fields included:
- `brandName` (required)
- `genericName` (required)
- `dosageForm` (dropdown: Tablet/Capsule/Syrup/Injection/Cream/Drops/Inhaler)
- `strength` (required, e.g., "500mg")
- `manufacturer` (optional)
- `quantity` (required, min 0)
- `price` (required, min 0)
- `expiryDate` (required, future date)
- `batchNo` (optional)

---

## 🐛 Known Issues

**NONE** - All security and functionality issues have been resolved.

---

## 📝 Change Log

### Files Modified
1. **backend/routes/pharmacyRoute.js**
   - Reordered stock routes (specific before parameterized)
   - Removed duplicate `/nearby` route
   - Secured `/inventory` with pharmacyAuth
   - Renamed `/:id` → `/pharmacy/:id`
   - Changed `/:pharmacyId` → `/profile`

2. **backend/controllers/pharmacy/updatePharmacy.js**
   - Updated route comment from `/update` → `/profile`

3. **backend/controllers/pharmacy/locationController.js**
   - Secured `updateInventory` with JWT validation
   - Changed from URL param (`/:id`) to JWT (`req.user.id`)

4. **frontend/src/pages/Auth/PharmacyLogin.js**
   - Added JWT decoding to extract pharmacy name
   - Fixed user object to include all pharmacy details

5. **frontend/src/pages/Pharmacy/Inventory.js**
   - Added all required form fields matching backend schema
   - Enhanced display with medicine details, status badges, expiry warnings
   - Fixed edit functionality to populate all fields

---

## 🚀 Recommendations

### High Priority
✅ All critical issues fixed

### Medium Priority
- [ ] Add rate limiting to public pharmacy search endpoints
- [ ] Implement pharmacy verification workflow (admin approval)
- [ ] Add audit logging for inventory changes
- [ ] Implement soft deletes for stock items

### Low Priority
- [ ] Add bulk import for medicines (CSV upload)
- [ ] Implement stock transfer between pharmacy branches
- [ ] Add expiry notification emails (using reminderScheduler)
- [ ] Create pharmacy analytics dashboard

---

## 📚 Documentation Updates Needed

- [x] Route structure documented
- [x] Security patterns documented
- [ ] API documentation (Postman/Swagger)
- [ ] Database schema diagrams
- [ ] Deployment guide with security checklist

---

**Audit Status:** ✅ COMPLETE  
**Security Level:** 🔒 PRODUCTION-READY  
**Next Review:** After feature additions or security incidents
