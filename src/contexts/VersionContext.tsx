import { createContext, useContext, useState, ReactNode } from "react";

type AppVersion = "mvp" | "developed";

interface VersionContextType {
  version: AppVersion;
  setVersion: (v: AppVersion) => void;
  isDeveloped: boolean;
}

const VersionContext = createContext<VersionContextType>({
  version: "mvp",
  setVersion: () => {},
  isDeveloped: false,
});

export function VersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersionState] = useState<AppVersion>(() => {
    return (localStorage.getItem("app_version") as AppVersion) || "mvp";
  });

  const setVersion = (v: AppVersion) => {
    setVersionState(v);
    localStorage.setItem("app_version", v);
  };

  return (
    <VersionContext.Provider value={{ version, setVersion, isDeveloped: version === "developed" }}>
      {children}
    </VersionContext.Provider>
  );
}

export const useVersion = () => useContext(VersionContext);
