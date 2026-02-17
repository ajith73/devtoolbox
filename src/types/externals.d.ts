declare module 'punycode/' {
    const punycode: {
        toASCII(input: string): string
        toUnicode(input: string): string
    }
    export default punycode
}

declare module 'prettier/standalone' {
    const prettier: {
        format(source: string, options: Record<string, unknown>): Promise<string> | string
    }
    export default prettier
}

declare module 'prettier/plugins/html' {
    const plugin: Record<string, unknown>
    export default plugin
}

declare module 'prettier/plugins/postcss' {
    const plugin: Record<string, unknown>
    export default plugin
}

declare module 'prettier/plugins/babel' {
    const plugin: Record<string, unknown>
    export default plugin
}

declare module 'prettier/plugins/estree' {
    const plugin: Record<string, unknown>
    export default plugin
}
