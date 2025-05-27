import TopicPage from "@/app/forum/topic/[id]/view";

export default async function Page({params}: { params: Promise<{ id: string }> }) {
    const {id} = await params;
    return (
        <TopicPage id={id}/>
    )
}