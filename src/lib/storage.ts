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
    const addToRecent = (toolId: string) => {
        const recent = getLocalData('recent_tools', [])
        const filtered = recent.filter((id: string) => id !== toolId)
        const updated = [toolId, ...filtered].slice(0, 8)
        setLocalData('recent_tools', updated)
    }

    return { addToRecent, recentTools: getLocalData('recent_tools', []) }
}

export const useFavorites = () => {
    const toggleFavorite = (toolId: string) => {
        const favorites = getLocalData('favorites', [])
        const updated = favorites.includes(toolId)
            ? favorites.filter((id: string) => id !== toolId)
            : [...favorites, toolId]
        setLocalData('favorites', updated)
        return updated
    }

    return { favorites: getLocalData('favorites', []), toggleFavorite }
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
