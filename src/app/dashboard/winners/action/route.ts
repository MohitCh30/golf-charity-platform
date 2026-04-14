import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const winnerId = formData.get('winnerId') as string
    const proofFile = formData.get('proof') as File | null

    if (!winnerId) {
      return NextResponse.json({ error: 'Winner ID required' }, { status: 400 })
    }

    if (!proofFile) {
      return NextResponse.json({ error: 'Proof file required' }, { status: 400 })
    }

    const bytes = await proofFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${user.id}/${winnerId}/${Date.now()}_${proofFile.name}`

    const adminClient = await createAdminClient()
    const { error: uploadError } = await adminClient.storage
      .from('winner-proofs')
      .upload(fileName, buffer, {
        contentType: proofFile.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload proof' }, { status: 500 })
    }

    const { data: urlData } = adminClient.storage
      .from('winner-proofs')
      .getPublicUrl(fileName)

    const proofUrl = urlData.publicUrl

    const { error: updateError } = await adminClient
      .from('winners')
      .update({
        proof_url: proofUrl,
        verification_status: 'pending_review',
      })
      .eq('id', winnerId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update winner record' }, { status: 500 })
    }

    return NextResponse.json({ success: true, proofUrl })
  } catch (error) {
    console.error('Proof upload error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
