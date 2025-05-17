"use client"
import UserProfileHeader from './components/UserProfileHeader';
import UserProfileDetails from './components/UserProfileDetails';
import UserProfileSkeleton from './components/UserProfileSkeleton';
import useApp from "@/ui/provider/AppProvider";
import {useEffect} from "react";
// export const revalidate = 0;

export default function UserProfilePage() {
    const {user} = useApp()

    useEffect(() => {
        // const {data: user, error} = await userService.getUserById(userId);
    }, []);

    if (!user) {
        return <UserProfileSkeleton/>
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                <UserProfileHeader user={user}/>

                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <UserProfileDetails user={user}/>
                    </div>
                    <div className="lg:col-span-2">
                        {/*<UserProfileStats user={user}/>*/}
                        <div className="mt-6">
                            {/*<UserProfileActivity user={user}/>*/}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}