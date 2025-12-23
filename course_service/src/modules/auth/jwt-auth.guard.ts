/*
    This file decodes the JWT Token sent from each API request and check authorization with protected route.
    If valid, it will allow individual to access to the data.
    Otherwise, return 401/403 Not Authorization status code
*/

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) { }

    //Verify whether the request can access the protected route via roles extracted from JWT token

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        //Extract token from request header
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            const secret = process.env["JWT_SECRET"];
            const payload: any = await this.jwtService.verifyAsync(token, {
                secret,
            });

            // Normalize common claim names for id and role
            const id = payload.sub || payload.nameid || payload.NameIdentifier || payload.userId || payload.id;
            const role = payload.Role || payload.role || payload.roles || payload.RoleName;

            request['user'] = {
                id,
                role
            };
        }
        catch (error) {
            throw new UnauthorizedException();
        }
        return true;
    }

    //This function extracts the JWT token from the request header and verifies it
    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(" ") ?? [];
        return type == "Bearer" ? token : undefined;
    }
}


