import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import {
  AccountAPI,
  type LoginRequest,
  type LoginResponse,
  type CompanyRequest,
} from "@/services";
import { tokenStore, permsStore, companyStore } from "@/lib/api";
import { decodeJwt } from "@/lib/jwt";

interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  role?: string;
}

const ADMIN_ROLES = ["SuperAdmin", "Admin"];

const isAdminRole = (role?: string) =>
  !!role && ADMIN_ROLES.includes(role);

interface AuthContextType {
  user: User | null;
  permissions: string[];
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  registerCompany: (req: CompanyRequest) => Promise<void>;
  logout: () => void;
  updateProfile: (username: string, email: string) => void;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = "smartseller-user";

const readUser = (): User | null => {
  try {
    const s = localStorage.getItem(USER_KEY);
    return s ? (JSON.parse(s) as User) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(readUser);
  const [permissions, setPermissions] = useState<string[]>(permsStore.get());
  const [loading, setLoading] = useState(false);

  const persistUser = (u: User | null) => {
    setUser(u);

    if (u) {
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  };

  const buildUserFromToken = (
    token: string,
    fallbackEmail: string,
    fallbackUsername?: string
  ): User => {
    const claims = decodeJwt<Record<string, string>>(token) || {};

    const username =
      claims["name"] ||
      claims["unique_name"] ||
      claims["preferred_username"] ||
      fallbackUsername ||
      fallbackEmail.split("@")[0];

    const id =
      claims["sub"] ||
      claims["nameid"] ||
      claims[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ] ||
      "me";

    const email =
      claims["email"] ||
      claims[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
      ] ||
      fallbackEmail;

   const role =
  claims["Role"] ||
  claims["RoleName"] ||
  claims["role"] ||
  claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
  undefined;

    return {
      id,
      username,
      email,
      role,
    };
  };

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResponse> => {
      setLoading(true);

      try {
        const req: LoginRequest = { email, password };
        const res = await AccountAPI.login(req);

        tokenStore.set(res.token);
        permsStore.set(res.permissions || []);
        setPermissions(res.permissions || []);

        const userFromToken = buildUserFromToken(res.token, email);
        persistUser(userFromToken);

        return res;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const registerCompany = useCallback(
    async (req: CompanyRequest) => {
      setLoading(true);

      try {
        const res = await AccountAPI.registerCompany(req);

        if (res?.data && typeof res.data === "string") {
          companyStore.set(res.data);
        }

        await loginInternal(req.email, req.password);
      } finally {
        setLoading(false);
      }

      async function loginInternal(email: string, password: string) {
        const res = await AccountAPI.login({ email, password });

        tokenStore.set(res.token);
        permsStore.set(res.permissions || []);
        setPermissions(res.permissions || []);

        const userFromToken = buildUserFromToken(
          res.token,
          email,
          req.companyName
        );

        persistUser(userFromToken);
      }
    },
    []
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setPermissions([]);
    persistUser(null);
  }, []);

  const updateProfile = useCallback(
    (username: string, email: string) => {
      if (user) {
        const updated = { ...user, username, email };
        persistUser(updated);
      }
    },
    [user]
  );

  const hasPermission = useCallback(
    (perm: string) => permissions.includes(perm),
    [permissions]
  );

  const isAdmin =
    isAdminRole(user?.role) ||
    permissions.includes("SuperAdmin") ||
    permissions.includes("Admin") ||
    permissions.includes("Role.View") ||
    permissions.includes("User.View");

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        loading,
        isAdmin,
        login,
        registerCompany,
        logout,
        updateProfile,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
};