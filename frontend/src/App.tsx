import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import BountiesPage from './pages/BountiesPage';
import ClaimPage from './pages/ClaimPage';
import AdminPage from './pages/AdminPage';
import DocsPage from './pages/DocsPage';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <div className="app-shell">
          <Navbar />
          <main className="main-content-flow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/bounties" element={<BountiesPage />} />
              <Route path="/claim" element={<ClaimPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </WalletProvider>
    </BrowserRouter>
  );
}
