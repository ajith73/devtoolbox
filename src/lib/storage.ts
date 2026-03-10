import { useState } from 'react'

export const getLocalData = (key: string, defaultValue: any) => {
    const data = localStorage.getItem(key)
    if (!data) return defaultValue
    try {
        return JSON.parse(data)
    } catch {
        return defaultValue
    }
}

export const setLocalData = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value))
}

export const useRecentlyUsed = () => {
    const [recentTools, setRecentTools] = useState<string[]>(() => getLocalData('recent_tools', []))

    const addToRecent = (toolId: string) => {
        const recent = getLocalData('recent_tools', [])
        const filtered = recent.filter((id: string) => id !== toolId)
        const updated = [toolId, ...filtered].slice(0, 8)
        setLocalData('recent_tools', updated)
        setRecentTools(updated)
    }

    return { addToRecent, recentTools }
}

export const useFavorites = () => {
    const [favorites, setFavorites] = useState<string[]>(() => getLocalData('favorites', []))

    const toggleFavorite = (toolId: string) => {
        const current = getLocalData('favorites', [])
        const updated = current.includes(toolId)
            ? current.filter((id: string) => id !== toolId)
            : [...current, toolId]
        setLocalData('favorites', updated)
        setFavorites(updated)
    }

    return { favorites, toggleFavorite }
}

export const usePersistentState = <T>(key: string, defaultValue: T): [T, (val: T | ((prev: T) => T)) => void] => {
    const [state, setState] = useState<T>(() => getLocalData(key, defaultValue))

    const setPersistentState = (val: T | ((prev: T) => T)) => {
        setState(prev => {
            const next = typeof val === 'function' ? (val as (prev: T) => T)(prev) : val
            setLocalData(key, next)
            return next
        })
    }

    return [state, setPersistentState]
}
