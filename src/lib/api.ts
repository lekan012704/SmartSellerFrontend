/**
 * SmartSeller API Client
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight fetch wrapper + every endpoint from the SmartSeller backend.
 *
 * Usage:
 *   import { authApi, orderApi, roleApi, notificationApi, paymentApi } from "@/lib/api";
 *
 *   // Login
 *   const { token, permissions } = await authApi.login({ email, password });
 *
 *   // Create order
 *   const { id } = await orderApi.createOrder(payload);
 *
 *   // Get notifications
 *   const page = await notificationApi.getAll({ page: 1, pageSize: 10 });
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────────────────────────────────────
// 0.  BASE CONFIG & STORES
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ||
  "https://smartseller-qda3.onrender.com/";

const TOKEN_KEY   = "smartseller-token";
const USER_KEY    = "smartseller-user";
const PERMS_KEY   = "smartseller-perms";
const COMPANY_KEY = "smartseller-company-id";

export const tokenStore = {
  get:   ()          => localStorage.getItem(TOKEN_KEY),
  set:   (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PERMS_KEY);
    localStorage.removeItem(COMPANY_KEY);
  },
};

export const companyStore = {
  get: ()           => localStorage.getItem(COMPANY_KEY),
  set: (id: string) => localStorage.setItem(COMPANY_KEY, id),
};

export const permsStore = {
  get: (): string[] => {
    try { return JSON.parse(localStorage.getItem(PERMS_KEY) || "[]"); }
    catch { return []; }
  },
  set: (p: string[]) => localStorage.setItem(PERMS_KEY, JSON.stringify(p)),
};

// ─────────────────────────────────────────────────────────────────────────────
// 1.  HTTP CORE
// ─────────────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data   = data;
  }
}

type Options = Omit<RequestInit, "body"> & { body?: unknown; auth?: boolean };

async function request<T>(path: string, opts: Options = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = opts;

  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Accept:         "application/json",
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const t = tokenStore.get();
    if (t) h.Authorization = `Bearer ${t}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: h,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(
      "Network error — make sure your API is running and CORS allows this origin. " +
      "If using https://localhost, open the API once in this browser to trust the certificate.",
      0,
      err,
    );
  }

  // 204 / empty body
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try { data = JSON.parse(text); }
    catch { data = text; }
  }

  if (!res.ok) {
    const msg =
      (typeof data === "object" && data !== null &&
        (("message" in data && (data as { message?: string }).message) ||
         ("title"   in data && (data as { title?:   string }).title  ))) ||
      (typeof data === "string" && data) ||
      `Request failed (${res.status})`;
    throw new ApiError(String(msg), res.status, data);
  }

  return data as T;
}

export const api = {
  get:   <T>(p: string, o?: Options)                 => request<T>(p, { ...o, method: "GET"    }),
  post:  <T>(p: string, body?: unknown, o?: Options) => request<T>(p, { ...o, method: "POST",   body }),
  put:   <T>(p: string, body?: unknown, o?: Options) => request<T>(p, { ...o, method: "PUT",    body }),
  patch: <T>(p: string, body?: unknown, o?: Options) => request<T>(p, { ...o, method: "PATCH",  body }),
  del:   <T>(p: string, o?: Options)                 => request<T>(p, { ...o, method: "DELETE" }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 2.  SHARED TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** Standard API envelope returned by most endpoints */
export interface ApiResponse<T = null> {
  succeeded: boolean;
  message:   string;
  data:      T;
  errors:    string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 3.  ACCOUNT  — /api/Account
// ─────────────────────────────────────────────────────────────────────────────

export interface CompanyType {
  id:   number;
  name: string;
}

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

export interface ProfileDetailsDto {
  storeName:      string;
  contactEmail:   string;
  phoneNumber:    string;
  primaryAddress: string;
}

export interface UpdateProfilePayload {
  contactEmail?:   string;
  phoneNumber?:    string;
  primaryAddress?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PermissionDto {
  roleName:    string;
  permissions: string[];
}

export interface GetUsersByCompanyQuery {
  CompanyId: string;
}

export const authApi = {
  getCompanyTypes: () =>
    api.get<CompanyType[]>("/Account/get-all-company-types", { auth: false }),

  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>("/Account/login", payload, { auth: false });
    if (res.token) {
      tokenStore.set(res.token);
      permsStore.set(res.permissions ?? []);
    }
    return res;
  },

  registerCompany: (payload: CompanyRequest) =>
    api.post<ApiResponse<string>>("/Account/register-company", payload, { auth: false }),

  registerUser: (payload: UserRequestDto) =>
    api.post<ApiResponse>("/Account/register-user", payload),

  updateUser: (id: string, payload: UpdateUserRequestDto) =>
    api.put<ApiResponse>(`/Account/update-user/${id}`, payload),

  addPermission: (payload: PermissionDto) =>
    api.post<ApiResponse>("/Account/add-permission", payload),

  getCompanyName: () =>
    api.get<{ name: string }>("/Account/get-name"),

  getProfile: () =>
    api.get<ProfileDetailsDto>("/Account/get-profile"),

  updateProfile: (payload: UpdateProfilePayload) =>
    api.patch<null>("/Account/update-profile", payload),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    api.post<ApiResponse>("/Account/forgot-password", payload, { auth: false }),

resetPassword: (payload: ResetPasswordPayload) =>
  api.post<ApiResponse>("/Account/change-password", payload, { auth: false }),

  activateUser: (id: string) =>
    api.post<ApiResponse>(`/Account/activate-user/${id}`),

  deactivateUser: (id: string) =>
    api.post<ApiResponse>(`/Account/deactivate-user/${id}`),

  deleteUser: (id: string) =>
    api.del<ApiResponse>(`/Account/delete-user/${id}`),

  getUsersByCompany: (params: GetUsersByCompanyQuery) => {
    const qs = new URLSearchParams({ CompanyId: params.CompanyId }).toString();
    return api.get<UserDto[]>(`/Account/get-users-by-company?${qs}`);
  },

  logout: () => tokenStore.clear(),
};

// ─────────────────────────────────────────────────────────────────────────────
// 4.  ORDERS  — /api/Order
// ─────────────────────────────────────────────────────────────────────────────

export interface OrderItemPayload {
  productName:    string;
  description?:   string;
  price:          number;
  quantity:       number;
  packageLength?: number;
  packageWidth?:  number;
  packageHeight?: number;
  categoryId?:    number;
  weight?:        number;
}

export interface CreateOrderPayload {
  customerName:    string;
  customerEmail:   string;
  whatsAppNumber?: string;
  deliveryAddress: string;
  deliveryFee?:    number;
  orderItems:      OrderItemPayload[];
}

export enum OrderStatus {
  Pending    = 0,
  Processing = 1,
  Shipped    = 2,
  Delivered  = 3,
  Cancelled  = 4,
}

export interface OrderSummaryDto {
  id:           string;
  status:       OrderStatus;
  createdAt:    string;
  customerName: string;
  totalDue:     number;
}

export interface GetOrdersQuery {
  Search?:    string;
  MinAmount?: number;
  MaxAmount?: number;
  StartDate?: string;
  EndDate?:   string;
}

export interface UpdateOrderStatusPayload {
  newStatus: OrderStatus;
}

export interface DashboardStatsDto {
  totalSalesMonth:          number;
  ordersToFulfill:          number;
  pendingPayment:           number;
  totalOrdersMonth:         number;
  totalSalesYear:           number;
  revenueGrowthPercentage:  number;
}

export interface FulfillBatchManuallyPayload {
  orderIds:            string[];
  manualRiderName:     string;
  manualTrackingInfo?: string;
}

export const orderApi = {
  createOrder: (payload: CreateOrderPayload) =>
    api.post<{ id: string }>("/Order/create-order", payload),

  getOrders: (params: GetOrdersQuery = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => [k, String(v)])
      )
    ).toString();
    return api.get<OrderSummaryDto[]>(`/Order/get-orders${qs ? `?${qs}` : ""}`);
  },

  getOrderById: (orderId: string) =>
    api.get<OrderSummaryDto>(`/Order/get-order-by-id?OrderId=${orderId}`),

  updateStatus: (id: string, newStatus: OrderStatus) =>
    api.patch<null>(`/Order/${id}/status`, { newStatus } satisfies UpdateOrderStatusPayload),

  deleteOrder: (id: string) =>
    api.del<null>(`/Order/${id}`),

  getDashboardStats: () =>
    api.get<DashboardStatsDto>("/Order/stats"),

  bookDispatch: (id: string) =>
    api.post<unknown>(`/Order/${id}/book-dispatch`),

  fulfillBatchManually: (payload: FulfillBatchManuallyPayload) =>
    api.post<null>("/Order/fulfill-batch-manually", payload),
};

// ─────────────────────────────────────────────────────────────────────────────
// 5.  ROLES  — /api/Role
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateRolePayload {
  roleName:     string;
  description?: string;
  isActive?:    boolean;
  claims?:      string[];
}

export interface RoleDto {
  roleId:      string;
  roleName:    string;
  description: string;
  isActive:    boolean;
  claims:      string[];
}

export interface UpdateRolePayload {
  roleId:       string;
  roleName:     string;
  description?: string;
  isActive?:    boolean;
  claims?:      string[];
}

export interface AssignRolePayload {
  userId:   string;
  roleName: string;
}

export interface RemoveRolePayload {
  userId:   string;
  roleName: string;
}

export interface AddClaimsToRolePayload {
  roleId: string;
  claims: string[];
}

export interface AssignPermissionsToRolePayload {
  roleName:    string;
  permissions: string[];
}

export interface AssignUserPermissionsPayload {
  userId:      string;
  permissions: string[];
}

export const roleApi = {
  createRole: (payload: CreateRolePayload) =>
    api.post<ApiResponse>("/Role/create", payload),

  getAllRoles: () =>
    api.get<RoleDto[]>("/Role/get/roles"),

  getRoleById: (id: string) =>
    api.get<RoleDto>(`/Role/get/role/id?id=${id}`),

  assignRole: (payload: AssignRolePayload) =>
    api.post<ApiResponse>("/Role/assign/role", payload),

  updateRole: (payload: UpdateRolePayload) =>
    api.put<ApiResponse>("/Role/update/role", payload),

  deleteRole: (roleId: string) =>
    api.del<ApiResponse>(`/Role/delete/role?roleId=${roleId}`),

  removeRole: (payload: RemoveRolePayload) =>
    api.post<ApiResponse>("/Role/remove/role", payload),

  addClaimsToRole: (payload: AddClaimsToRolePayload) =>
    api.post<ApiResponse>("/Role/role/add-claims", payload),

  getUsersInRole: (roleId: string) =>
    api.get<UserDto[]>(`/Role/GetAllUsersInRole?roleId=${roleId}`),

  assignPermissionsToRole: (payload: AssignPermissionsToRolePayload) =>
    api.post<ApiResponse>("/Role/assign-to-role", payload),

  assignPermissionsToUser: (payload: AssignUserPermissionsPayload) =>
    api.post<ApiResponse>("/Role/assign-permission-user", payload),

  getAllPermissions: () =>
    api.get<string[]>("/Role/get-all-permission"),
};

// ─────────────────────────────────────────────────────────────────────────────
// 6.  NOTIFICATIONS  — /api/Notofication   (note: server typo — matches exactly)
// ─────────────────────────────────────────────────────────────────────────────

export interface NotificationDto {
  id:        string;
  message:   string;
  isRead:    boolean;
  createdAt: string;
}

export interface NotificationPage {
  items:      NotificationDto[];
  totalCount: number;
  page:       number;
  pageSize:   number;
}

export interface GetNotificationsParams {
  page?:     number;
  pageSize?: number;
}

export const notificationApi = {
  getAll: (params: GetNotificationsParams = {}) => {
    const qs = new URLSearchParams({
      page:     String(params.page     ?? 1),
      pageSize: String(params.pageSize ?? 10),
    }).toString();
    return api.get<NotificationPage>(`/Notofication/get-all?${qs}`);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 7.  PAYMENT  — /api/Payment
// ─────────────────────────────────────────────────────────────────────────────

export interface BankDto {
  name: string;
  code: string;
}

export interface VerifyAccountPayload {
  accountNumber: string;
  bankCode:      string;
}

export interface AccountVerificationResponse {
  success:     boolean;
  accountName: string;
  message?:    string;
}

export const paymentApi = {
  getBanks: () =>
    api.get<BankDto[]>("/Payment/get-banks"),

  verifyAccount: (payload: VerifyAccountPayload) =>
    api.post<AccountVerificationResponse>("/Payment/verify-account", payload),
};

// ─────────────────────────────────────────────────────────────────────────────
// 8.  PERMISSION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export const Permissions = {
  User: {
    Create:     "User.Create",
    Edit:       "User.Edit",
    View:       "User.View",
    Delete:     "User.Delete",
    Activate:   "User.Activate",
    Deactivate: "User.Deactivate",
    AssignRole: "User.AssignRole",
  },
  Role: {
    Create:            "Role.Create",
    Edit:              "Role.Edit",
    View:              "Role.View",
    Delete:            "Role.Delete",
    AssignPermissions: "Role.AssignPermissions",
  },
  Order: {
    View:   "Order.View",
    Create: "Order.Create",
    Edit:   "Order.Edit",
    Delete: "Order.Delete",
  },
  Payment: {
    View: "Payment.View",
  },
  Report: {
    View: "Report.View",
  },
} as const;

export function hasPermission(permission: string): boolean {
  return permsStore.get().includes(permission);
}

export function hasAnyPermission(permissions: string[]): boolean {
  const userPerms = permsStore.get();
  return permissions.some((p) => userPerms.includes(p));
}

export function hasAllPermissions(permissions: string[]): boolean {
  const userPerms = permsStore.get();
  return permissions.every((p) => userPerms.includes(p));
}
