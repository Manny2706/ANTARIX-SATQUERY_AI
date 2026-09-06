export interface RegisterInput {
    fullName: string
    email: string
    password: string
}

export interface LoginInput {
    email: string
    password: string
}

export interface UserResponse {
    id: string
    fullName: string
    email: string
    createdAt: Date
    updatedAt: Date
}

export interface AuthResult {
    user: UserResponse
    token: string
}