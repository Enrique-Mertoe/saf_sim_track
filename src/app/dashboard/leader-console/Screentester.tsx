import {MaterialScreenProvider, useScreen} from "@/ui/materia_screen/context";
import {Screen} from "@/ui/materia_screen/screen";
import React, {useEffect, useState} from "react";
import App from "@/app/dashboard/leader-console/components/T2";
// import {useScreen} from "@/app/dashboard/leader-console/components/Test2";

export default function Screentester() {
    return (
        <App/>
        // <MaterialScreenProvider initialScreen="Screen1">
        //     sadsdsfdsgfdsf
        //     <Screen name="Screen1">
        //         <Screen1/>
        //     </Screen>
        //     <Screen name="Screen2">
        //         <Screen2/>
        //     </Screen>
        //     <Screen name="Screen3">
        //         <Screen3/>
        //     </Screen>
        //     <Screen name="Screen4">
        //         <Screen4/>
        //     </Screen>
        // </MaterialScreenProvider>
    )
}