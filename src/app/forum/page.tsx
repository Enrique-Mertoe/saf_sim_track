'use client';

import {ReactNode, Suspense} from 'react';
import ForumPage from "@/app/forum/page.view";

interface SuspenseWrapperProps {
    fallback?: ReactNode;
    children: ReactNode;
}

// @ts-ignore
function SuspenseWrapper({
                                            fallback = <div>Loading...</div>,
                                            children,
                                        }: SuspenseWrapperProps) {
    return <Suspense fallback={fallback}>{children}</Suspense>;
}

export default function Page() {
    return (
        <SuspenseWrapper>
           <ForumPage/>
        </SuspenseWrapper>
    )
}