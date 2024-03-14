

'use server';

import CreatePost from "@/components/Create";


export default async function Page() {

  return (
    <div className="flex min-h-screen flex-col">
      <CreatePost/>
    </div>
  )
}