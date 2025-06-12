import UserDetailPage from "@/app/system/admin/users/[id]/page.client";


export default async function Page({params}: any) {
    const {id} = await params;
    return <UserDetailPage id={id}/>
}
