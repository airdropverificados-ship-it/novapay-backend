const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'normal', config: null });
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    let unsubscribe = () => {};
    (async () => {
      try {
        const list = await db.entities.AppConfig.list();
        const cfg = list && list[0];
        if (cfg) setConfig(cfg);
      } catch (e) {
        // config not available yet; defaults apply
      }
      try {
        unsubscribe = db.entities.AppConfig.subscribe((event) => {
          if (event && (event.type === 'create' || event.type === 'update') && event.data) {
            setConfig(event.data);
          }
        });
      } catch (e) {}
    })();
    return () => unsubscribe();
  }, []);

  const theme = config?.active_theme || 'normal';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, config }}>
      {children}
    </ThemeContext.Provider>
  );
}