


### What's Next
- [ ] Waiter page
- [done] Orders management page
- [done] Payment flow (Pay Now button)
- [done] Reports / analytics dashboard
- [ ] Real-time order updates with Convex subscriptions
- [ ] Print receipt feature
- [ ] Search menu items
- [ ] Low stock alerts
<!-- ///////////////////////////////////// -->


# 🍽️ Foodics — Restaurant POS System

A full-stack, real-time Point of Sale system built for restaurants. Manage tables, menus, orders, and payments across multiple staff roles from a single unified platform.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Convex](https://img.shields.io/badge/Convex-Backend-orange?style=flat-square)
![Clerk](https://img.shields.io/badge/Clerk-Auth-purple?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square&logo=tailwindcss)

---

## ✨ Features

### 🔐 Authentication & Role Management
- Role-based login (Admin / Cashier ) via Clerk
- JWT integration between Clerk and Convex
- Route protection with `useRoleGuard` hook
- Auto-redirect based on DB role after sign-in
- Unauthorized access page

### 👨‍💼 Admin Panel
- Dashboard with live stats (revenue, orders, top items)
- Full menu management (add, edit, delete items)
- Category-based menu filtering
- Availability toggle per item
- User management
- Orders management with status updates
- Reports & Analytics Dashboard (Daily/weekly/monthly revenue charts, Top selling items, Busiest hours heatmap, Export to CSV/PDF)

### 💰 Cashier Screen
- Live table selection with status indicators (free/busy)
- Per-table isolated cart (Zustand)
- Menu grid with category tabs and search
- Order summary with qty controls and notes
- Edit existing orders inline (no modal)
- Payment processing (Cash / Card)
- Real-time subtotal, tax, and discount calculation

## Create order and edit order 

Cashier adds items → clicks "Confirm Order"
        ↓
createOrder mutation:
  - calculates total
  - inserts into orders (status: "pending")
  - inserts into orderItems (with notes)
  - patches table → "occupied"
  
        ↓
Admin Orders page shows real-time updates
  - Stats cards per status
  - Full table with items + notes
  - "Mark →" button advances status
  - When marked "paid" → table freed → status "available"

### 💳 Payment System
- Cash and Card payment methods
- Payment records stored in DB
- Auto-frees table on payment completion
- Order marked as paid

---
## Payment process 

  Order status: "pending"
  → Cashier clicks "Pay Now"
  → PaymentModal opens with total
  → Cashier selects Cash or Card
  → Clicks "Process Payment"
        ↓
  processPayment mutation:
    1. Creates payment record in DB
    2. Updates order → status: "paid"
    3. Updates table → status: "available"
        ↓
  Toast: "Payment processed!"
  Modal closes
  Table turns green ✅
  Order disappears from active list ✅

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Backend | Convex (DB + Mutations + Queries) |
| Auth | Clerk + Convex JWT |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand (per-table cart) |
| Forms | react-hook-form + zod |
| Notifications | Sonner (toast) |

---

## 🗄️ Database Schema

```
users         → clerkId, name, email, role
tables        → name, status, capacity
categories    → name
menuItems     → name, price, categoryId, image, description, available
orders        → tableId, userId, status, total, createdAt
orderItems    → orderId, itemId, quantity, note
payments      → orderId, amount, method, status, createdAt
```

---

## 📁 Project Structure

```
app/
├── (pages)/
│   ├── home/page.tsx          # Role selector + Clerk sign-in
│   ├── admin/page.tsx         # Admin dashboard
│   ├── cashier/page.tsx       # Cashier POS screen
│   └── unauthorized/page.tsx  # Access denied
│  
├── _components/
│   ├── AdminPage/
│   │   ├── Dashboard.tsx
│   │   ├── MenuItems.tsx
│   │   ├── AddMenuItemsModal.tsx
│   │   ├── EditMenuItemModal.tsx
│   │   ├── Orders.tsx
│   │   └── UserManagement.tsx
│   ├── cashier/
│       ├── NewOrder.tsx
│       ├── EditOrderModal.tsx
│       └── PaymentModal.tsx
│       └── MyOrders.tsx
│   

convex/
├── schema.ts
├── auth.config.ts
├── menuItems.ts
├── orders.ts
├── tables.ts
├── users.ts
└── payments.ts

hooks/
├── useRoleGuard.ts       # Role-based route protection
└── useCreateOrder.ts     # Order submission logic

stores/
└── cartStore.ts          # Per-table Zustand cart
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Convex account
- Clerk account


## 👥 Role Access Matrix

| Route | Admin | Cashier | 
|  ---  |  ---  |   ---   |
| `/admin` | ✅ |   ❌   | 
| `/cashier` | ✅ | ✅   | 
| `/`    |  ✅   |  ✅   | 


---

Built with ❤️ using Next.js, Convex, and Clerk.

