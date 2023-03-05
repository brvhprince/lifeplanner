export interface ErrorResponseConstructor extends ErrorConstructor {
    code: number | string
    message: string
}

export interface FormatErrorObject {
    code: number
    reason: string
    message: string
    property?: string
    path?: string
    method?: string
    extendedHelper?: string
    sendReport?: string
    instance?: ErrorInstance
}

export interface ErrorInstance {
    orm: string
    code: string | number | undefined
    meta?: any
    version: string
    message?: string
}

interface KeyValuePairs {
    [key: string] : unknown
}

interface Headers extends KeyValuePairs {
    "Content-Type": string | undefined
    Referer: string | undefined
    "User-Agent": string | undefined
}
export interface AppRequest {
    body: KeyValuePairs
    query: KeyValuePairs
    params: KeyValuePairs
    ip: string
    method: string
    path: string
    headers: Headers
}
export interface AppResponse {
    body: KeyValuePairs
    headers?: Headers
    statusCode: number
}