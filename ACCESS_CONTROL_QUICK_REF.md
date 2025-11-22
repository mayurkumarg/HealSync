# Access Control Quick Reference

## 🎯 Current System (Updated Nov 22, 2025)

### Access Type: `view` (ONLY)

**Doctors CAN:**
- ✅ View all patient records
- ✅ Upload new health forms
- ✅ Upload new documents

**Doctors CANNOT:**
- ❌ Edit existing health forms
- ❌ Update patient profile
- ❌ Delete any records

---

## 📋 API Endpoints

### Patient Creates Form
```
POST /api/form-entry/create
Auth: Patient token
Body: { formType, data, description }
Result: ✅ Success
```

### Doctor Creates Form for Patient
```
POST /api/form-entry/create
Auth: Doctor token
Body: { patientId, formType, data, description }
Access Required: view access with valid expiry
Result: ✅ Success (if access valid)
```

### Doctor Tries to Edit Form
```
PUT /api/form-entry/:id
Auth: Doctor token
Body: { data, ... }
Result: ❌ 403 Forbidden
Message: "Doctors can only view and upload new data. Editing existing entries is not allowed."
```

### Doctor Tries to Delete Form
```
DELETE /api/form-entry/:id
Auth: Doctor token
Result: ❌ 403 Forbidden
Message: "Doctors cannot delete form entries. Only patients can delete their own data."
```

---

## 🔑 Access Grant Methods

### 1. QR Code / Short Code
```javascript
// Patient generates token
POST /api/access/generate
Body: { 
  accessType: "view",  // Fixed
  expiryDuration: "24hours" 
}

// Doctor claims token
POST /api/access/claim
Body: { shortCode: "123456" }
```

### 2. Phone Number
```javascript
// Patient grants access
POST /api/access/grant-by-phone
Body: { 
  doctorPhone: "+1234567890",
  accessType: "view",  // Fixed
  expiryDuration: "7days"
}
```

### 3. Doctor Request
```javascript
// Doctor requests access
POST /api/access/request-by-doctor
Body: { 
  patientPhone: "+1234567890",
  accessType: "view",  // Fixed
  reason: "Treatment follow-up"
}

// Patient approves with OTP
POST /api/access/approve-request
Body: { requestId, otp: "123456" }
```

---

## 🔍 Access Check Logic

```javascript
// In createFormEntry controller
if (actor.type === "doctor") {
  const access = await PatientAccess.findOne({
    patientId: targetPatientId,
    doctorId: doctor._id,
    isActive: true
  });

  // Check expiry if set
  const isExpired = access?.expiresAt && new Date() > new Date(access.expiresAt);

  if (access && !isExpired) {
    // ✅ Allow upload
  } else {
    // ❌ Deny access
  }
}
```

---

## 🖥️ Frontend Display

### Patient Side:
```
Access Type Dropdown: [Disabled]
└── "👁️ View & Upload - Doctor can view records and upload new data"

Helper Text: "Doctors can view your medical records and upload new forms/documents, but cannot edit existing data."
```

### Doctor Side:
```
Permissions Badge: "👁️ View & Upload"

Permissions List:
✓ View patient profile and contact information
✓ View health forms and medical records
✓ Upload new forms and documents
❌ Cannot edit existing records
❌ Cannot delete records
```

---

## 🐛 Common Issues & Solutions

### Issue: "Doctor can't create forms"
**Check:**
1. Does doctor have active PatientAccess?
2. Is access expired? (check `expiresAt`)
3. Is `isActive` set to `true`?

**Solution:**
```javascript
// Debug query
const access = await PatientAccess.findOne({
  patientId: "patient_id",
  doctorId: "doctor_id",
  isActive: true
});

console.log('Access:', access);
console.log('Expires:', access?.expiresAt);
console.log('Is expired:', access?.expiresAt && new Date() > new Date(access.expiresAt));
```

### Issue: "403 Forbidden when doctor uploads"
**Cause:** Access expired or doesn't exist
**Solution:** Re-grant access or extend expiry

### Issue: "Edit button still showing"
**Check:** Frontend needs update
**Solution:** Replace edit buttons with "Upload Data" buttons

---

## 📊 Access Lifecycle

```
1. GRANT ACCESS
   └─> PatientAccess created (isActive: true, accessType: "view")

2. DOCTOR USES ACCESS
   ├─> View records ✅
   ├─> Upload forms ✅
   ├─> Edit records ❌ (blocked)
   └─> Delete records ❌ (blocked)

3. ACCESS EXPIRES (if expiryDuration set)
   └─> Operations blocked (except view may still work based on implementation)

4. PATIENT REVOKES
   └─> isActive: false → All operations blocked
```

---

## 🔧 Testing Commands

### Test Doctor Upload:
```bash
curl -X POST http://localhost:5000/api/form-entry/create \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "PATIENT_ID",
    "formType": "Prescription",
    "data": "Medication: Paracetamol 500mg",
    "description": "Fever treatment"
  }'
```

### Test Doctor Edit (Should Fail):
```bash
curl -X PUT http://localhost:5000/api/form-entry/FORM_ID \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Modified data"
  }'

# Expected: 403 Forbidden
```

---

## 💡 Key Points

1. **Single Access Type**: Only "view" exists now
2. **View = View + Upload**: "view" access includes upload capability
3. **No Editing**: Doctors never modify existing data
4. **No Deletion**: Doctors never remove data
5. **Expiry Check**: Check `expiresAt` field (if null = no expiry)
6. **Patient Control**: Patients can revoke anytime

---

**Last Updated:** November 22, 2025  
**Status:** ✅ Production Ready
