/**
 * SmartSeller — typed API client
 * Import from "@/services"
 */
import { api, tokenStore, companyStore, permsStore } from "@/lib/api";
import { decodeJwt } from "@/lib/jwt";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const qs = (params: Record<string, unknown>) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.append(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email:    string;
  password: string;
}

export interface LoginResponse {
  token:       string;
  expiration:  string;
  permissions: string[];
}

export interface CompanyRequest {
  companyName:  string;
  email:        string;
  password:     string;
  description?: string;
  phoneNumber:  string;
  country:      string;
  address:      string;
  companyType:  number;
}

export interface RegisterCompanyResponse {
  succeeded?: boolean;
  message?:   string;
  data?:      string;
}

export interface CompanyType {
  id:   number;
  name: string;
}

export interface ProfileDetailsDto {
  storeName:      string;
  contactEmail:   string;
  phoneNumber:    string;
  primaryAddress: string;
}

export interface UpdateProfileCommand {
  contactEmail?:   string;
  phoneNumber?:    string;
  primaryAddress?: string;
}

export interface ForgotPasswordCommand {
  email: string;
  baseUrl: string;
}
export interface ResetPasswordCommand {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserRequestDto {
  email:        string;
  password:     string;
  fullName:     string;
  phoneNumber:  string;
  userName:     string;
  role:         string;
  dateCreated?: string;
  isActive?:    boolean;
}

export interface UpdateUserRequestDto {
  email?:       string;
  fullName?:    string;
  phoneNumber?: string;
  userName?:    string;
  role?:        string;
  password?:        string;
  isActive?:    boolean;
}

export interface UserDto {
  id:           string;
  email:        string;
  userName:     string;
  role:         string;
  phoneNumber:  string;
  isActive?:    boolean;
  dateCreated?: string;
  createdBy?:   string;
  fullName?:    string;
}

export const AccountAPI = {
  login: async (b: LoginRequest): Promise<LoginResponse> => {
    const raw = await api.post<any>("/Account/login", b, { auth: false });
    const inner = raw?.data ?? raw;
    if (inner?.token) {
      tokenStore.set(inner.token);
      permsStore.set(inner.permissions ?? []);
      try {
        const claims = decodeJwt<Record<string, string>>(inner.token) || {};
        const companyId = claims["CompanyId"];
        if (companyId) companyStore.set(companyId);
      } catch {
        console.warn("Could not decode JWT");
      }
    }
    return inner as LoginResponse;
  },

  registerCompany: (b: CompanyRequest) =>
    api.post<RegisterCompanyResponse>("/Account/register-company", b, { auth: false }),

  getCompanyTypes: async (): Promise<CompanyType[]> => {
    const res = await api.get<any>("/Account/get-all-company-types", { auth: false });
    if (Array.isArray(res))       return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.Data)) return res.Data;
    return [];
  },

  getCompanyName: () =>
    api.get<{ companyName?: string; name?: string } | string>("/Account/get-name"),

  getProfile: () =>
    api.get<ProfileDetailsDto>("/Account/get-profile"),

  updateProfile: (b: UpdateProfileCommand) =>
    api.patch<void>("/Account/update-profile", b),

  forgotPassword: (b: ForgotPasswordCommand) =>
    api.post<unknown>("/Account/forgot-password", b, { auth: false }),

resetPassword: (b: ResetPasswordCommand) =>
  api.post<{
    succeeded?: boolean;
    message?: string;
    data?: unknown;
  }>("/Account/change-password", b, { auth: false }),

  authTest: () => api.get<string>("/Account/auth-test"),

  registerUser: (b: UserRequestDto) =>
    api.post<{ succeeded?: boolean; message?: string }>("/Account/register-user", b),

  updateUser: (id: string, b: UpdateUserRequestDto) =>
    api.put<{ succeeded?: boolean; message?: string }>(`/Account/update-user/${id}`, b),

  activateUser: (id: string) =>
    api.post<{ succeeded?: boolean }>(`/Account/activate-user/${id}`),

  deactivateUser: (id: string) =>
    api.post<{ succeeded?: boolean }>(`/Account/deactivate-user/${id}`),

  deleteUser: (id: string) =>
    api.del<{ succeeded?: boolean }>(`/Account/delete-user/${id}`),

  getUsersByCompany: (companyId: string) =>
    api.get<UserDto[]>(`/Account/get-users-by-company${qs({ CompanyId: companyId })}`),

  logout: () => tokenStore.clear(),
};

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────────────────────────────────────

// Mirrors backend: public enum OrderStatus
// { NewOrder, PaymentPending, Paid, ReadyForDispatch, InTransit, Delivered, Cancelled }
export enum OrderStatus {
  NewOrder         = 0,
  PaymentPending   = 1,
  Paid             = 2,
  ReadyForDispatch = 3,
  InTransit        = 4,
  Delivered        = 5,
  Cancelled        = 6,
}

// Kept for backwards-compat with any existing code using OrderStatusEnum
export type OrderStatusEnum = OrderStatus;

export interface CreateOrderItem {
  productName:   string;
  description:   string;
  price:         number;
  quantity:      number;
  packageLength: number;
  packageWidth:  number;
  packageHeight: number;
  categoryId:    number;
  weight:        number;
}

export interface CreateOrderCommand {
  customerName:    string;
  customerEmail:   string;
  customerPhone:   string;
  whatsAppNumber?: string;
  deliveryAddress: string;
  orderItems:      CreateOrderItem[];
  deliveryFee:     number;
  driverName?:     string;
  driverPhone?:    string;
}

export interface OrderListFilter {
  Search?:    string;
  MinAmount?: number;
  MaxAmount?: number;
  StartDate?: string;
  EndDate?:   string;
  Status?:    number;
}

export interface OrderSummaryDto {
  id:           string;
  status:       OrderStatus;
  createdAt:    string;
  customerName: string;
  totalDue:     number;
}

export interface DashboardStatsDto {
  totalSalesMonth:         number;
  ordersToFulfill:         number;
  pendingPayment:          number;
  totalOrdersMonth:        number;
  totalSalesYear:          number;
  revenueGrowthPercentage: number;
}

export interface FulfillBatchManuallyDto {
  orderIds:           string[];
  manualRiderName:    string;
  manualTrackingInfo: string;
}

export const OrderAPI = {
  create: (b: CreateOrderCommand) =>
    api.post<{ id: string }>("/Order/create-order", b),

  list: async (f: OrderListFilter = {}): Promise<OrderSummaryDto[]> => {
    const raw = await api.get<any>(`/Order/get-orders${qs(f as Record<string, unknown>)}`);
    if (Array.isArray(raw))       return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    return [];
  },

  getById: (id: string) =>
    api.get<unknown>(`/Order/get-order-by-id${qs({ OrderId: id })}`),

  updateStatus: (id: string, newStatus: OrderStatus) =>
    api.patch<void>(`/Order/${id}/status`, { newStatus }),

  remove: (id: string) =>
    api.del<void>(`/Order/${id}`),

  stats: async (): Promise<DashboardStatsDto> => {
    const raw = await api.get<any>("/Order/stats");
    const s = raw?.data ?? raw;
    return s as DashboardStatsDto;
  },

  fulfillManually: (b: FulfillBatchManuallyDto) =>
    api.post<void>("/Order/fulfill-batch-manually", b),

  bookDispatch: (id: string) =>
    api.post<unknown>(`/Order/${id}/book-dispatch`),
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMERS
// Endpoints (exact from Swagger):
//   GET    /api/Customer/get-customers
//   POST   /api/Customer/create-customer        ← body: { request: { ... } }
//   GET    /api/Customer/get-customer-by-id?customerId={id}
//   PATCH  /api/Customer/{id}                   ← body: { name, email, ... }
//   DELETE /api/Customer/{id}
// ─────────────────────────────────────────────────────────────────────────────

export interface CustomerDto {
  id:              string;
  name:            string | null;
  email:           string;
  phoneNumber:     string | null;
  whatsAppNumber?: string | null;
  address?:        string | null;
  totalOrders:     number;
  totalSpent:      number;
  lastOrderDate?:  string | null;
  createdAt:       string;
  isActive?:       boolean;
}

export interface CreateCustomerCommand {
  name:            string;
  email:           string;
  phoneNumber:     string;
  whatsAppNumber?: string;
  address?:        string;
}

export interface EditCustomerCommand {
  name?:           string;
  email?:          string;
  phoneNumber?:    string;
  whatsAppNumber?: string;
  address?:        string;
}

export const CustomerAPI = {
  list: async (): Promise<CustomerDto[]> => {
    const raw = await api.get<any>("/Customer/get-customers");
    if (Array.isArray(raw))       return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    return [];
  },

  getById: async (id: string): Promise<CustomerDto> => {
    const raw = await api.get<any>(`/Customer/get-customer-by-id${qs({ customerId: id })}`);
    return (raw?.data ?? raw) as CustomerDto;
  },

  // Backend expects: { "request": { name, email, phoneNumber, ... } }
  create: (b: CreateCustomerCommand) =>
    api.post<{ id: string }>("/Customer/create-customer", { request: b }),

  // Only send non-empty fields to avoid overwriting backend data with blank strings
  edit: (id: string, b: EditCustomerCommand) => {
    const clean: EditCustomerCommand = {};
    if (b.name?.trim())           clean.name           = b.name.trim();
    if (b.email?.trim())          clean.email          = b.email.trim();
    if (b.phoneNumber?.trim())    clean.phoneNumber    = b.phoneNumber.trim();
    if (b.whatsAppNumber?.trim()) clean.whatsAppNumber = b.whatsAppNumber.trim();
    if (b.address?.trim())        clean.address        = b.address.trim();
    return api.patch<void>(`/Customer/${id}`, clean);
  },

  delete: (id: string) =>
    api.del<void>(`/Customer/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface NotificationDto {
  id?:        string;
  title?:     string;
  message?:   string;
  isRead?:    boolean;
  createdAt?: string;
  [k: string]: unknown;
}

export const NotificationAPI = {
  list: (page = 1, pageSize = 10) =>
    api.get<NotificationDto[] | { items: NotificationDto[]; total?: number }>(
      `/Notofication/get-all${qs({ page, pageSize })}`,
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT
// ─────────────────────────────────────────────────────────────────────────────

export interface BankDto {
  name: string;
  code: string;
}

export interface VerifyBankAccountCommand {
  accountNumber: string;
  bankCode:      string;
}

export interface AccountVerificationResponseDto {
  success?:     boolean;
  accountName?: string;
  message?:     string;
}

export const PaymentAPI = {
  banks: () =>
    api.get<BankDto[]>("/Payment/get-banks"),

  verify: (b: VerifyBankAccountCommand) =>
    api.post<AccountVerificationResponseDto>("/Payment/verify-account", b),
};

// ─────────────────────────────────────────────────────────────────────────────
// ROLES & PERMISSIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateRoleModel {
  roleName:     string;
  description?: string;
  isActive:     boolean;
  claims:       string[];
}

export interface UpdateRoleCommand {
  roleId:       string;
  roleName:     string;
  description?: string;
  isActive:     boolean;
  claims:       string[];
}

export interface RoleDto {
  id?:          string;
  roleId?:      string;
  name?:        string;
  roleName?:    string;
  description?: string;
  isActive?:    boolean;
  claims?:      string[];
  [k: string]:  unknown;
}

export interface AssignRoleCommand {
  userId:   string;
  roleName: string;
}

export interface RemoveUserRoleCommand {
  userId:   string;
  roleName: string;
}

export interface AssignUserPermissionsDto {
  userId:      string;
  permissions: string[];
}

export interface PermissionDto {
  roleName:    string;
  permissions: string[];
}

export interface AddClaimsToRoleCommand {
  roleId: string;
  claims: string[];
}

export const RoleAPI = {
  create:   (b: CreateRoleModel)        => api.post<{ succeeded?: boolean }>("/Role/create", b),
  list:     ()                          => api.get<RoleDto[]>("/Role/get/roles"),
  getById:  (id: string)                => api.get<RoleDto>(`/Role/get/role/id${qs({ id })}`),
  update:   (b: UpdateRoleCommand)      => api.put<{ succeeded?: boolean }>("/Role/update/role", b),
  remove:   (roleId: string)            => api.del<{ succeeded?: boolean }>(`/Role/delete/role${qs({ roleId })}`),

  assignRole:              (b: AssignRoleCommand)          => api.post<{ succeeded?: boolean }>("/Role/assign/role", b),
  removeRoleFromUser:      (b: RemoveUserRoleCommand)      => api.post<{ succeeded?: boolean }>("/Role/remove/role", b),
  addClaims:               (b: AddClaimsToRoleCommand)     => api.post<{ succeeded?: boolean }>("/Role/role/add-claims", b),
  usersInRole:             (roleId: string)                => api.get<UserDto[]>(`/Role/GetAllUsersInRole${qs({ roleId })}`),
  assignToRole:            (b: PermissionDto)              => api.post<unknown>("/Role/assign-to-role", b),
  assignPermissionsToUser: (b: AssignUserPermissionsDto)   => api.post<unknown>("/Role/assign-permission-user", b),
  allPermissions:          ()                              => api.get<string[]>("/Role/get-all-permission"),
};