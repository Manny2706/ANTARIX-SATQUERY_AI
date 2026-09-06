import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
    userId: string
}
declare global {
    namespace Express {
        interface Request {
            user?: { _id: string }
        }
    }
}
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.cookies?.accessToken
        if (!token) {
            return res.status(401).json({
                message: "Unauthorized",
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload

        req.user = { _id: decoded.userId }
        next()
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
        })
    }
}
