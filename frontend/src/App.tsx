import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import LoginPage from './auth/LoginPage';
import AppLayout from './layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import EntitiesPage from './pages/entities/EntitiesPage';
import EntityForm from './pages/entities/EntityForm';
import MaterialsPage from './pages/materials/MaterialsPage';
import MaterialForm from './pages/materials/MaterialForm';
import YardLocationsPage from './pages/yard-locations/YardLocationsPage';
import YardLocationForm from './pages/yard-locations/YardLocationForm';
import InboundsPage from './pages/inbounds/InboundsPage';
import InboundWeighInForm from './pages/inbounds/InboundWeighInForm';
import InboundDetailPage from './pages/inbounds/InboundDetailPage';
import ContractsPage from './pages/contracts/ContractsPage';
import ContractForm from './pages/contracts/ContractForm';
import InventoryPage from './pages/inventory/InventoryPage';
import PurchaseOrdersPage from './pages/purchase-orders/PurchaseOrdersPage';
import PurchaseOrderDetailPage from './pages/purchase-orders/PurchaseOrderDetailPage';
import GeneratePOForm from './pages/purchase-orders/GeneratePOForm';
import ReportsPage from './pages/reports/ReportsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/entities" element={<EntitiesPage />} />
              <Route path="/entities/new" element={<EntityForm />} />
              <Route path="/entities/:id" element={<EntityForm />} />
              <Route path="/materials" element={<MaterialsPage />} />
              <Route path="/materials/new" element={<MaterialForm />} />
              <Route path="/materials/:id" element={<MaterialForm />} />
              <Route path="/yard-locations" element={<YardLocationsPage />} />
              <Route path="/yard-locations/new" element={<YardLocationForm />} />
              <Route path="/yard-locations/:id" element={<YardLocationForm />} />
              <Route path="/inbounds" element={<InboundsPage />} />
              <Route path="/inbounds/weigh-in" element={<InboundWeighInForm />} />
              <Route path="/inbounds/:id" element={<InboundDetailPage />} />
              <Route path="/contracts" element={<ContractsPage />} />
              <Route path="/contracts/new" element={<ContractForm />} />
              <Route path="/contracts/:id" element={<ContractForm />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="/purchase-orders/generate" element={<GeneratePOForm />} />
              <Route path="/purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
