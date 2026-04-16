## 🍽️ Foodics — Full Project Summary

---

### Tech Stack
| | |
|---|---|
| **Frontend** | Next.js 14 (App Router) + TypeScript |
| **Backend** | Convex (DB + mutations + queries) |
| **Auth** | Clerk + Convex JWT |
| **Styling** | Tailwind CSS + shadcn/ui |
| **State** | Zustand (per-table cart) |
| **Forms** | react-hook-form + zod |

---

### Database Schema
| Table | Fields |
|---|---|
| `users` | clerkId, name, email, role |
| `tables` | name, status, capacity |
| `categories` | name |
| `menuItems` | name, price, categoryId, image, description, available |
| `orders` | tableId, userId, status, total, createdAt |
| `orderItems` | orderId, itemId, quantity, note |

---

### Pages & Roles
| Route | Role | Access |
|---|---|---|
| `/` | Public | Role selector + Clerk sign-in |
| `/admin` | Admin only | Full system access |
| `/cashier` | Admin + Cashier | Orders & payments |
| `/waiter` | Admin + Waiter | Table service |
| `/unauthorized` | All | Access denied page |

---

### Auth Flow
```
User visits "/"
  → Selects role (Admin/Cashier/Waiter)
  → Signs in with Clerk modal
  → upsertUser() → saves to Convex with selected role
  → window.location.href → navigates to role page
  → useRoleGuard() checks DB role
  → Wrong role → /unauthorized
  → Correct role → page renders ✅
```

---

### Key Files
```
app/
  (pages)/
    home/page.tsx        ← role selector + Clerk sign-in
    admin/page.tsx       ← admin dashboard
    cashier/page.tsx     ← cashier POS screen
    waiter/page.tsx      ← waiter screen
  _components/
    AdminPage/
      Dashboard.tsx
      MenuItems.tsx
      AddMenuItemsModal.tsx
      EditMenuItemModal.tsx
      UserManagement.tsx
    ConvexClerkProvider.tsx
    Navbar.tsx

convex/
  schema.ts
  auth.config.ts         ← Clerk JWT domain
  menuItems.ts           ← getMenu, addMenuItem, editMenuItem
  orders.ts              ← createOrder
  tables.ts              ← getTables
  users.ts               ← getCurrentUser, upsertUser

hooks/
  useRoleGuard.ts        ← role-based route protection
  useCreateOrder.ts      ← order submission

stores/
  cartStore.ts           ← per-table Zustand cart
```

---

### Cart System
```ts
carts: {
  "tableId_1": [{ name, price, qty, note }],
  "tableId_2": [{ name, price, qty, note }],
  "tableId_3": [],
}
```
- Each table has its own isolated cart
- Live totals per table shown in sidebar
- Table dot turns red when cart has items
---

### What's Next
- [ ] Waiter page
- [ ] Orders management page
- [ ] Payment flow (Pay Now button)
- [ ] Reports / analytics dashboard
- [ ] Real-time order updates with Convex subscriptions
- [ ] Print receipt feature
- [ ] Search menu items
- [ ] Low stock alerts