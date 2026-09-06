import { ApiError } from "../utils/ApiError"
import {Request, Response } from "express"
import {loginUser,registerUser} from "../service/auth.service"

export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
}

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullName, email, password, confirmPassword } = req.body

        if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
            res.status(400).json({
                success: false,
                message: "Full name is required",
            })
            return
        }
        if (password !== confirmPassword) {
            res.status(400).json({
                success: false,
                message: "Passwords do not match",
            })
            return
        }
        if (!email || typeof email !== "string" || !email.trim()) {
            res.status(400).json({
                success: false,
                message: "Valid email is required",
            })
            return
        }
        if (!password || typeof password !== "string" || password.length < 6) {
            res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            })
            return
        }

        const { user, token } = await registerUser({
            fullName,
            email,
            password,
        })

        res.cookie("token", token, COOKIE_OPTIONS)

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user,
                token,
            },
        })
    } catch (error: any) {
        const statusCode = error instanceof ApiError ? error.statusCode : 500
        res.status(statusCode).json({
            success: false,
            message: error.message || "An unexpected error occurred during registration",
        })
    }
}

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body

        if (!email || typeof email !== "string" || !email.trim()) {
            res.status(400).json({
                success: false,
                message: "Email is required",
            })
            return
        }

        if (!password || typeof password !== "string") {
            res.status(400).json({
                success: false,
                message: "Password is required",
            })
            return
        }

        const { user, token } = await loginUser({
            email,
            password,
        })

        res.cookie("token", token, COOKIE_OPTIONS)

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user,
                token,
            },
        })
    } catch (error: any) {
        const statusCode = error instanceof ApiError ? error.statusCode : 500
        res.status(statusCode).json({
            success: false,
            message: error.message || "An unexpected error occurred during login",
        })
    }
}

export const logout = async (_req: Request, res: Response): Promise<void> => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" as const,
        })

        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "An unexpected error occurred during logout",
        })
    }
}
