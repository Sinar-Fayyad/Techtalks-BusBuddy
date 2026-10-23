import { createContext, useContext } from 'react';

// { token, role, me, refreshMe, logout }
export const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);
