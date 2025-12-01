/*
    This file implements the access Control Logic 
*/

import { Injectable } from "@nestjs/common";

interface IsAuthorizedParams {
    currentRole: string,
    requiredRoles: string[],
}


@Injectable()
export class AccessControlService {
    public isAuthorized ({currentRole, requiredRoles}: IsAuthorizedParams) : boolean {

        //The validation is true if currentRole in requiredRoles list
        return (requiredRoles.includes(currentRole));
    }
}
    