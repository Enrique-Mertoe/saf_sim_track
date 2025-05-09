'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface SimCard {
  id: string;
  simSerial: string;
  customerMsisdn: string;
  saleDate: string;
  topupAmount: number;
  activationStatus: boolean;
}

export default function SimCardsList() {
  const [simCards, setSimCards] = useState<SimCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, role } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Create query based on user role
    let simCardsQuery;

    if (role === 'admin') {
      // Admins can see all SIM cards
      simCardsQuery = query(
        collection(db, 'simCards'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
    } else if (role === 'team_leader') {
      // Team leaders can only see their team's SIM cards
      // Assuming team leaders have a teamId field
      simCardsQuery = query(
        collection(db, 'simCards'),
        where('teamId', '==', user.customClaims?.teamId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
    } else {
      // Staff can only see their own SIM cards
      simCardsQuery = query(
        collection(db, 'simCards'),
        where('agentId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
    }

    // Set up real-time listener
    const unsubscribe = onSnapshot(simCardsQuery, (snapshot) => {
      const simCardData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SimCard[];

      setSimCards(simCardData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching SIM cards:', error);
      setLoading(false);
    });

    // Clean up listener
    return () => unsubscribe();
  }, [user, role]);

  if (loading) return <div>Loading SIM cards...</div>;

  return (
    <div className="sim-cards-list">
      <h2>SIM Cards</h2>
      {simCards.length === 0 ? (
        <p>No SIM cards found.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>Customer MSISDN</th>
              <th>Sale Date</th>
              <th>Top-up Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {simCards.map((sim) => (
              <tr key={sim.id}>
                <td>{sim.simSerial}</td>
                <td>{sim.customerMsisdn}</td>
                <td>{new Date(sim.saleDate).toLocaleDateString()}</td>
                <td>{sim.topupAmount} KES</td>
                <td>{sim.activationStatus ? 'Activated' : 'Pending'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}