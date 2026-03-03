import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import HomeScreen from './screens/Home/HomeScreen';
import ShiftDetailScreen from './screens/Home/ShiftDetailScreen';
import LoadsScreen from './screens/Loads/LoadsScreen';
import AddLoadScreen from './screens/Loads/AddLoadScreen';
import LoadDetailScreen from './screens/Loads/LoadDetailScreen';
import CaptureScreen from './screens/Capture/CaptureScreen';
import ReceiptDetailScreen from './screens/Capture/ReceiptDetailScreen';
import InspectScreen from './screens/Inspect/InspectScreen';
import TractorInspection from './screens/Inspect/TractorInspection';
import ChassisInspection from './screens/Inspect/ChassisInspection';
import ContainerInspection from './screens/Inspect/ContainerInspection';
import InspectionDetailScreen from './screens/Inspect/InspectionDetailScreen';
import MoreScreen from './screens/More/MoreScreen';
import ProfileSettings from './screens/More/ProfileSettings';
import TerminalsManager from './screens/More/TerminalsManager';
import CredentialsTracker from './screens/More/CredentialsTracker';
import DocumentHistory from './screens/More/DocumentHistory';
import LoadHistory from './screens/More/LoadHistory';
import ReceiptsSummary from './screens/More/ReceiptsSummary';

// TODO: Multi-driver support — login + user accounts
// TODO: Stripe subscription check — gate features behind paid plan

export default function App() {
    const location = useLocation();

    return (
        <Layout>
            <div key={location.pathname} className="animate-page-enter h-full">
                <Routes location={location}>
                    <Route path="/" element={<HomeScreen />} />
                    <Route path="/shift/:date" element={<ShiftDetailScreen />} />
                    <Route path="/loads" element={<LoadsScreen />} />
                    <Route path="/loads/new" element={<AddLoadScreen />} />
                    <Route path="/loads/:id" element={<LoadDetailScreen />} />
                    <Route path="/capture" element={<CaptureScreen />} />
                    <Route path="/receipt/:id" element={<ReceiptDetailScreen />} />
                    <Route path="/inspect" element={<InspectScreen />} />
                    <Route path="/inspect/tractor" element={<TractorInspection />} />
                    <Route path="/inspect/chassis" element={<ChassisInspection />} />
                    <Route path="/inspect/container" element={<ContainerInspection />} />
                    <Route path="/inspect/detail/:id" element={<InspectionDetailScreen />} />
                    <Route path="/more" element={<MoreScreen />} />
                    <Route path="/more/profile" element={<ProfileSettings />} />
                    <Route path="/more/terminals" element={<TerminalsManager />} />
                    <Route path="/more/credentials" element={<CredentialsTracker />} />
                    <Route path="/more/documents" element={<DocumentHistory />} />
                    <Route path="/more/load-history" element={<LoadHistory />} />
                    <Route path="/more/receipts" element={<ReceiptsSummary />} />
                </Routes>
            </div>
        </Layout>
    );
}
