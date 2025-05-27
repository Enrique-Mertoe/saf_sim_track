import {Metadata} from 'next';
import AppDownloadPage from './page.view';

export const metadata: Metadata = {
  title: 'Download Our Mobile App | SIM Manager',
  description: 'Download the SIM Manager mobile app for Android to manage your SIM cards on the go.',
};

export default function Page() {
  return <AppDownloadPage />;
}