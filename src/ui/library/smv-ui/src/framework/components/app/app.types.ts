import {ComponentActivity} from "@/ui/library/smv-ui/src";

export interface AppCombat {

}

export interface ApplicationContext {
    name?: AppCombat,
    activities?:typeof ComponentActivity[],
    theme?:string,
}