import {$} from "@/lib/request";
import {SimCardTransfer, User, UserCreate} from "@/models";
import {SimControllerActions} from "@/controllers/SimController";
import {UserControllerActions} from "@/controllers/UserController";
import {TeamControllerActions} from "@/controllers/TeamController";
import {BatchControllerActions} from "@/controllers/BatchController";

type ApiType = {
    admin: ClientAdmin;
    sim: SimControllerActions<any>;
    user: UserControllerActions<any>;
    team: TeamControllerActions<any>;
    batch: BatchControllerActions<any>;
    transfer: ClientTransfer;
    report: ClientReport;
}


export const dispatcher = <T>(type: keyof ApiType, target: string, data: any) => $.post<T>({
    url: "/api/actions",
    contentType: $.JSON,
    data: {
        action: type,
        target: target,
        data: data
    }
})


class ClientAdmin {
    create_user(data: UserCreate) {
        return dispatcher("admin", "create_user", data)
    }

    del_user(data: Partial<User>) {
        return dispatcher("admin", "del_user", data)
    }
}

function buildArgs(methodName: string, args: any[]) {
    switch (methodName) {
        case "createSIMCardBatch":
            const [data, batchSize, progressCallback] = args;
            return {simCardsData: data, batchSize, progressCallback};
        case "byId":
            return {id: args[0]};
        default:
            return {args}
    }
}


class ClientSim {
    constructor() {
        return new Proxy(this, {
            get: (target, prop, receiver) => {
                // ✅ First, check if the method/property exists and return it
                if (typeof prop === "string" && typeof target[prop as keyof this] === "function") {
                    return Reflect.get(target, prop, receiver);
                }

                // ✅ Otherwise, dynamically handle unknown method
                if (typeof prop === "string") {
                    return (...args: any[]) => {
                        return dispatcher("sim", prop, buildArgs(prop, args));
                    };
                }

                return undefined;
            }
        });
    }

    // ✅ Explicit method — real implementation
    createSIMCardBatch(data: any, batchSize: number, progressCallback: Closure) {
        return dispatcher("sim", "create_sim_card_batch", {
            simCardsData: data,
            batchSize,
            progressCallback
        });
    }

    byId(id: string) {
        return dispatcher("sim", "byId", {id});
    }
}

class ClientUser {
    constructor() {
        return new Proxy(this, {
            get: (target, prop, receiver) => {
                // ✅ First, check if the method/property exists and return it
                if (typeof prop === "string" && typeof target[prop as keyof this] === "function") {
                    return Reflect.get(target, prop, receiver);
                }

                // ✅ Otherwise, dynamically handle unknown method
                if (typeof prop === "string") {
                    return (...args: any[]) => {
                        return dispatcher("user", prop, buildArgs(prop, args));
                    };
                }

                return undefined;
            }
        });
    }
}


class ClientTeam {
    constructor() {
        return new Proxy(this, {
            get: (target, prop, receiver) => {
                // ✅ First, check if the method/property exists and return it
                if (typeof prop === "string" && typeof target[prop as keyof this] === "function") {
                    return Reflect.get(target, prop, receiver);
                }

                // ✅ Otherwise, dynamically handle unknown method
                if (typeof prop === "string") {
                    return (...args: any[]) => {
                        return dispatcher("team", prop, buildArgs(prop, args));
                    };
                }

                return undefined;
            }
        });
    }
}

class ClientBatch {
    constructor() {
        return new Proxy(this, {
            get: (target, prop, receiver) => {
                // ✅ First, check if the method/property exists and return it
                if (typeof prop === "string" && typeof target[prop as keyof this] === "function") {
                    return Reflect.get(target, prop, receiver);
                }


                // ✅ Otherwise, dynamically handle unknown method
                if (typeof prop === "string") {
                    return (...args: any[]) => {
                        return dispatcher("batch", prop, buildArgs(prop, args));
                    };
                }

                return undefined;
            }
        });
    }
}

class ClientTransfer {
    del_transfer_request(data: Partial<SimCardTransfer>) {
        return dispatcher("transfer", "delete_t_request", data)
    }

    create_transfer_request(data: Partial<SimCardTransfer>) {
        return dispatcher("transfer", "create_t_request", data)
    }

    approve_transfer_request(data: Partial<SimCardTransfer>) {
        return dispatcher("transfer", "approve_t_request", data)
    }

    reject_transfer_request(data: Partial<SimCardTransfer>) {
        return dispatcher("transfer", "reject_t_request", data)
    }
}

class ClientReport {
    generate_excel_report(data: any) {
        return dispatcher("report", "generate_excel_report", data)
    }

    generate_team_excel_report(data: any) {
        return dispatcher("report", "generate_team_excel_report", data)
    }
}

class ClientApi<T> {
    private readonly instance: T;

    constructor(instance: T) {
        this.instance = instance;
    }

    static of<K extends keyof ApiType>(key: K): ClientApi<ApiType[K]> {
        const instance = apiTypeMap[key]; // <-- Must exist at runtime
        return new ClientApi<ApiType[K]>(instance);
    }

    get() {
        return this.instance;
    }


}

const apiTypeMap: ApiType = {
    admin: new ClientAdmin(),
    sim: (new ClientSim() as unknown as SimControllerActions<any>),
    user: (new ClientUser() as unknown as UserControllerActions<any>),
    team: (new ClientTeam() as unknown as TeamControllerActions<any>),
    batch: (new ClientBatch() as unknown as BatchControllerActions<any>),
    transfer: new ClientTransfer(),
    report: new ClientReport(),
};
// ClientApi.of("admin").get()

export default ClientApi
