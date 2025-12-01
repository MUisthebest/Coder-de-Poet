/*
    This file injects Reflection to retrieves metadata about handler method and roles it needs
    Calling isAuthorized method from AccessControlService to verify whether the user has access to the protected route
*/


import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import {Reflector} from "@nestjs/core";


import { AccessControlService } from "./auth_access_logic.auth";


@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        private readonly accessControlService: AccessControlService,
        private readonly reflector: Reflector
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        
        const user = request["user"] as {role: string} | undefined;

        //Retrieve metadata @Roles from handler and controller
        const requiredRoles = this.reflector.getAllAndOverride<string[]> (
            "roles", [
                context.getHandler(),
                context.getClass()
            ]
        )
        
        //If no user or no role info, deny access
        if (!user || !user.role) return false;

        return this.accessControlService.isAuthorized({
            currentRole: user.role,
            requiredRoles: requiredRoles ?? []
        });
    }

}

