import { db } from "@/config/db";
import { chatTable, frameTable, projectTable, usersTable } from "@/config/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { projectId, frameId, messages, credits } = await req.json();
    const user = await currentUser();
    const { has } = await auth();
    const hasUnlimitedAccess = has && has({ plan: 'unlimited' })

    // Create Project
    const projectResult = await db.insert(projectTable).values({
        projectId: projectId,
        createdBy: user?.primaryEmailAddress?.emailAddress
    })

    // Create Frame
    const frameResult = await db.insert(frameTable).values({
        frameId: frameId,
        projectId: projectId,
    })

    // Save User Message
    const chatResult = await db.insert(chatTable).values({
        chatMessage: messages,
        createdBy: user?.primaryEmailAddress?.emailAddress,
        frameId: frameId,
    })

    if (!hasUnlimitedAccess) {
        const userResult = await db.update(usersTable).set({
            credits: credits - 1
            // @ts-ignore
        }).where(eq(usersTable.email, user?.primaryEmailAddress?.emailAddress))
    }

    return NextResponse.json({
        projectId, frameId, messages
    })
}