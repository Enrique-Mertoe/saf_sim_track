'use server';

import { adminFirestore, adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

// Example server action to securely add a SIM card record
export async function addSimCardRecord(formData: FormData) {
  try {
    // Get session token from cookies
    const sessionCookie = (await cookies()).get('session')?.value;

    if (!sessionCookie) {
      return { error: 'Unauthorized' };
    }

    // Verify the session
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    // Get user role
    const userRecord = await adminAuth.getUser(userId);
    const userRole = userRecord.customClaims?.role;

    // Check if user has permission
    if (!['admin', 'team_leader', 'staff'].includes(userRole as string)) {
      return { error: 'Permission denied' };
    }

    // Extract data from form
    const simSerial = formData.get('simSerial') as string;
    const customerMsisdn = formData.get('customerMsisdn') as string;
    const customerId = formData.get('customerId') as string;
    const saleDate = formData.get('saleDate') as string;
    const topupAmount = parseFloat(formData.get('topupAmount') as string);
    const location = formData.get('location') as string;

    // Validate data
    if (!simSerial || !customerMsisdn) {
      return { error: 'Missing required fields' };
    }

    // Add record to Firestore
    await adminFirestore.collection('simCards').add({
      simSerial,
      customerMsisdn,
      customerId,
      saleDate: saleDate || new Date().toISOString(),
      topupAmount: topupAmount || 0,
      location,
      agentId: userId,
      timestamp: new Date(),
    });

    return { success: true, message: 'SIM card record created successfully' };
  } catch (error) {
    console.error('Error adding SIM card record:', error);
    return { error: 'Failed to add SIM card record' };
  }
}