import {NextRequest, NextResponse} from 'next/server';
import {createSuperClient} from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    // Validate the request payload
    const { batchId } = body;

    if (!batchId) {
      return NextResponse.json(
        { status: 'error', message: 'Batch ID is required' },
        { status: 400 }
      );
    }

    // Create a Supabase client with admin privileges to bypass RSL
    const supabase = await createSuperClient();

    // First, get the batch metadata to verify it exists
    const { data: batchMetadata, error: batchError } = await supabase
      .from('batch_metadata')
      .select('*')
      .eq('id', batchId)
      .single();

    if (batchError || !batchMetadata) {
      console.error('Error fetching batch metadata:', batchError);
      return NextResponse.json(
        { status: 'error', message: 'Batch not found' },
        { status: 404 }
      );
    }

    // Get the batch_id from the metadata
    const { batch_id } = batchMetadata;

    // Delete all SIM cards associated with this batch
    const { error: simCardsError } = await supabase
      .from('sim_cards')
      .delete()
      .eq('batch_id', batch_id);

    if (simCardsError) {
      console.error('Error deleting SIM cards:', simCardsError);
      return NextResponse.json(
        { status: 'error', message: 'Failed to delete SIM cards' },
        { status: 500 }
      );
    }

    // Now delete the batch metadata
    const { error: deleteError } = await supabase
      .from('batch_metadata')
      .delete()
      .eq('id', batchId);

    if (deleteError) {
      console.error('Error deleting batch metadata:', deleteError);
      return NextResponse.json(
        { status: 'error', message: 'Failed to delete batch metadata' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      status: 'success',
      message: 'Batch and associated SIM cards deleted successfully'
    });
  } catch (error) {
    console.error('Error processing batch deletion:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { status: 'error', message: 'Method not allowed' },
    { status: 405 }
  );
}