import { createContext, useContext } from "react";
import { useAuth as useClerkAuth, useUser as useClerkUser } from "@clerk/react";

interface AuthContextType {
  user: { id: string; email: string | undefined; fullName: string | null } | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isSignedIn: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  isSignedIn: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, signOut } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();

  const loading = !isLoaded;

  const user = isSignedIn && clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        fullName: clerkUser.fullName,
      }
    : null;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut, isSignedIn: !!isSignedIn }}>
      {children}
    </AuthContext.Provider>
  );
}
