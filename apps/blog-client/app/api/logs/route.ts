import { queryLogs } from '@/lib'
import { NextRequest, NextResponse } from 'next/server'
import { match } from 'ts-pattern'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const platform = searchParams.get('platform')
  if (platform !== 'techlog' && platform !== 'surflog') {
    return NextResponse.json({ error: 'platform query is strange' }, { status: 409 })
  }
  const locale = searchParams.get('locale')
  if (locale !== 'en' && locale !== 'ko') {
    return NextResponse.json({ error: 'locale query is strange' }, { status: 409 })
  }
  const logs = await match(platform)
    .with('surflog', async () => await queryLogs('surflog', locale))
    .with('techlog', async () => await queryLogs('techlog', locale))
    .exhaustive()
  return NextResponse.json({ logs: logs }, { status: 200 })
}