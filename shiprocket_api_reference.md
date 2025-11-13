# Shiprocket API Reference

This document lists all Shiprocket-related API endpoints in the backend, including payloads, authentication, and expected responses.

---

## Authentication
- **Header:** `Authorization: Bearer <Shiprocket Token>`
- **Token Generation:**
  - Endpoint: Internal (handled via ShipRocket.login())
  - Payload: `{ email, password }`
  - Response: `{ token, ... }`

---

## Endpoints

### 1. Create Pickup Address
- **Path:** `/shiprocket-address/create`
- **Method:** POST
- **Payload:**
```json
{
  "email": "retailer@email.com",
  "phone": "9876543210",
  "title": "Warehouse Name",
  "addressLineOne": "123 Main St",
  "addressLineTwo": "Suite 101",
  "city": "Delhi",
  "pinCode": "110001",
  "state": "Delhi",
  "country": "India"
}
```
- **Fields:**
  - `email`, `phone`, `title`, `addressLineOne`, `addressLineTwo`, `city`, `pinCode`, `state`, `country`
- **Success Response:**
```json
{
  "code": 200,
  "message": "Address registered successfully!",
  "data": { ... }
}
```
- **Error Response:**
```json
{
  "code": 409,
  "message": "Invalid field or Shiprocket error"
}
```

---

### 2. Create Order (Shipment)
- **Path:** `/shiprocket-order/create-order`
- **Method:** POST
- **Payload:**
```json
{
  "orderId": "ORD123",
  "orderDate": "2025-11-13",
  "pickupLocation": "WH123456",
  "comment": "Handle with care",
  "billingCustomerName": "John",
  "billingLastName": "Doe",
  "billingAddress": "123 Main St",
  "billingAddressTwo": "Suite 101",
  "billingCity": "Delhi",
  "billingPincode": "110001",
  "billingState": "Delhi",
  "billingCountry": "India",
  "billingEmail": "john@email.com",
  "billingPhone": "9876543210",
  "orderItems": [ ... ],
  "paymentMethod": "Prepaid",
  "subTotal": 1000,
  "length": 10,
  "breadth": 5,
  "height": 5,
  "weight": 1
}
```
- **Fields:** See validator for required fields.
- **Success Response:**
```json
{
  "code": 200,
  "message": "Pickup request placed successfully!",
  "data": { ... }
}
```
- **Error Response:**
```json
{
  "code": 409,
  "message": "Invalid field or Shiprocket error"
}
```

---

### 3. Assign AWB
- **Path:** `/shiprocket-order/assign-awb`
- **Method:** POST
- **Payload:**
```json
{
  "shipmentId": "SHIP123456"
}
```
- **Success Response:**
```json
{
  "code": 200,
  "message": "AWB assigned successfully!",
  "data": { ... }
}
```
- **Error Response:**
```json
{
  "code": 409,
  "message": "Invalid shipment id or Shiprocket error"
}
```

---

### 4. Generate Label
- **Path:** `/shiprocket-order/generate-label`
- **Method:** POST
- **Payload:**
```json
{
  "shipmentIds": ["SHIP123456"]
}
```
- **Success Response:**
```json
{
  "code": 200,
  "message": "Label generated successfully!",
  "data": "<label_url>"
}
```
- **Error Response:**
```json
{
  "code": 409,
  "message": "Error while generating labels!"
}
```

---

### 5. Generate Invoice
- **Path:** `/shiprocket-order/generate-invoice`
- **Method:** POST
- **Payload:**
```json
{
  "orderIds": ["ORD123"]
}
```
- **Success Response:**
```json
{
  "code": 200,
  "message": "Invoice generated successfully!",
  "data": "<invoice_url>"
}
```
- **Error Response:**
```json
{
  "code": 409,
  "message": "Unable to generate invoice!"
}
```

---

### 6. Shipment Pickup
- **Path:** `/shiprocket-order/shipment-pickup`
- **Method:** POST
- **Payload:**
```json
{
  "shipmentIds": ["SHIP123456"]
}
```
- **Success Response:**
```json
{
  "code": 200,
  "message": "Pickup scheduled successfully!",
  "data": { ... }
}
```
- **Error Response:**
```json
{
  "code": 409,
  "message": "Unable to schedule pickup!"
}
```

---

### 7. Generate Manifest
- **Path:** `/shiprocket-order/generate-manifest`
- **Method:** POST
- **Payload:**
```json
{
  "shipmentIds": ["SHIP123456"]
}
```
- **Success Response:**
```json
{
  "code": 200,
  "message": "Manifest generated successfully!",
  "data": "<manifest_url>"
}
```
- **Error Response:**
```json
{
  "code": 409,
  "message": "Unable to generate manifest!"
}
```

---

### 8. Print Manifest
- **Path:** `/shiprocket-order/print-manifest`
- **Method:** POST
- **Payload:**
```json
{
  "orderIds": ["ORD123"]
}
```
- **Success Response:**
```json
{
  "code": 200,
  "message": "Manifest printed successfully!",
  "data": "<manifest_url>"
}
```
- **Error Response:**
```json
{
  "code": 409,
  "message": "Unable to print manifest!"
}
```

---

### 9. Delete Order
- **Path:** `/shiprocket-order/delete-order`
- **Method:** DELETE
- **Payload:**
```json
{
  "orderIds": ["ORD123"]
}
```
- **Success Response:**
```json
{
  "code": 200,
  "message": "Orders cancelled successfully!",
  "data": true
}
```
- **Error Response:**
```json
{
  "code": 409,
  "message": "Unable to cancel order!"
}
```

---

### 10. Track Shipment
- **Path:** `/shiprocket-tracking/track/:shipmentId`
- **Method:** GET
- **Headers:** `Authorization: Bearer <Shiprocket Token>`
- **Success Response:**
```json
{
  "success": true,
  "tracking": { ... }
}
```
- **Error Response:**
```json
{
  "success": false,
  "message": "Failed to fetch tracking details"
}
```

---

## Notes
- All endpoints require Shiprocket token in the Authorization header.
- All payloads must match the required field structure and types.
- Error codes and messages are standardized for frontend handling.
