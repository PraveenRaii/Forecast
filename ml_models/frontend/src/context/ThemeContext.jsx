import { createContext, useContext, useEffect, useState } from 'react'
const ThemeContext = createContext()
export function ThemeProvider({ children }) { const [dark, setDark] = useState(localStorage.getItem('safar-theme') === 'dark'); useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('safar-theme', dark ? 'dark' : 'light') }, [dark]); return <ThemeContext.Provider value={{dark, setDark}}>{children}</ThemeContext.Provider> }
export const useTheme = () => useContext(ThemeContext)
