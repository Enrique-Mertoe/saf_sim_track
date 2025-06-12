import {$} from "@/lib/request";
import {SimCardTransfer, UserCreate} from "@/models";

type ApiType = {
    admin: ClientAdmin;
    sim: ClientSim;
    transfer: ClientTransfer;
}

const dispatcher = <T>(type: keyof ApiType, target: string, data: any) => $.post<T>({
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
}

class ClientSim {
    createSIMCardBatch(data: any, batchSize: number, progressCallback: Closure) {
        return dispatcher("sim", "create_sim_card_batch", {
            simCardsData: data,
            batchSize: batchSize,
            progressCallback: progressCallback
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
    sim: new ClientSim(),
    transfer: new ClientTransfer(),
};
// ClientApi.of("admin").get()

export default ClientApi
