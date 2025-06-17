"use client"
import {createPortal} from 'react-dom';
import React from "react";

export default function Fixed({children}: { children: React.ReactNode }) {
    return createPortal(
        <>{children}</>,
        document.body
    );
}
