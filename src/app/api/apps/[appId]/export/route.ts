import { NextRequest, NextResponse } from 'next/server';
import { dbWrapper } from '@/lib/dbWrapper';
import { getCurrentUser } from '@/lib/auth';
import { generateCodebase } from '@/lib/codeGenerator';
import { pushToGitHub } from '@/lib/github';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { appId } = await params;
    const app = await dbWrapper.getApp(appId);

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (app.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { token, repoName, description, isPrivate } = body;

    if (!token || !repoName) {
      return NextResponse.json(
        { error: 'GitHub personal access token and repository name are required' },
        { status: 400 }
      );
    }

    // Compile the app metadata into standard files
    const files = generateCodebase(app.config);

    // Push the files directly to GitHub
    const result = await pushToGitHub({
      token,
      repoName,
      files,
      description: description || `Repository for ${app.name} generated dynamically.`,
      isPrivate: isPrivate !== false,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      repoUrl: result.repoUrl,
      message: 'Codebase exported and pushed to GitHub successfully!',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
